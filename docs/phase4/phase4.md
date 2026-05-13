# Phase P4 — Messaging Service (WebSocket Real-time)

> **Status:** 📋 PLANNING
> **Ngày lập kế hoạch:** 2026-05-13
> **Service:** `messaging-service` (port 8084)
> **Infrastructure:** Upstash Redis (TLS) + CloudAMQP (RabbitMQ TLS)
> **Mục tiêu:** Xử lý kết nối WebSocket STOMP, quản lý presence online/offline, định tuyến tin nhắn real-time qua RabbitMQ

---

## 1. Overview

### Hiện trạng

`messaging-service` hiện chỉ có:
- ✅ `MessagingApplication.java` — entry point + `@EnableDiscoveryClient` + `@EnableAsync`
- ✅ `application.yml` — cấu hình Redis, RabbitMQ, JWT, Eureka
- ✅ `pom.xml` — dependencies: web, websocket, data-redis, AMQP, eureka-client, common-lib
- ✅ `.env` — Upstash Redis, CloudAMQP, JWT credentials
- ✅ `Dockerfile` — multi-stage build sẵn sàng
- ✅ `docker-compose.yml` — service đã cấu hình (profile `full`)
- ✅ Gateway route — `/ws/**` → `lb://messaging-service`
- 🔴 **Không có bất kỳ Config/Controller/Service nào** → 0% business logic

### Mục tiêu Phase P4

Sau khi hoàn thành, hệ thống sẽ:
1. **WebSocket STOMP Server** — Endpoint `/ws/chat`, xác thực JWT tại CONNECT
2. **Gửi tin nhắn real-time** — Client SEND → Publish RabbitMQ → Fan-out đến recipients
3. **Connection Management** — `ConcurrentHashMap` local + Redis cross-instance mapping
4. **Presence Tracking** — Online/Offline status lưu Redis, broadcast cho room members
5. **Typing Indicator** — Ephemeral event qua **Redis Pub/Sub** (cross-instance broadcast) (Review #2)
6. **Rate Limiting** — Redis atomic counter, max 5 msg/sec/user
7. **Membership Cache Eviction** — ⚡ Lắng nghe event `member.removed`/`member.left` để evict cache ngay lập tức (Review #1)
8. **Zombie Session Cleanup** — `@Scheduled` quét presence mồ côi mỗi 60s (Review #5)
7. **Publish MessageEvent** — Đẩy event sang `chat.exchange` để `chat-history-service` lưu trữ

---

## 2. Kiến trúc & Luồng dữ liệu

```
Frontend (STOMP Client) → API Gateway (/ws/**)
                ↓ (WebSocket upgrade qua Docker internal network)
        messaging-service (:8084 — KHÔNG expose ra host)
                │
        ┌───────┼───────────────────┐
        │ Upstash Redis (TLS)       │
        │ conn:user:{userId}        │ → Connection mapping
        │ presence:{userId}         │ → Online status
        │ rate:msg:{userId}         │ → Rate limiting
        │ Pub/Sub: typing:{roomId}  │ → ⚡ Typing broadcast (Review #2)
        │ Pub/Sub: presence:{roomId}│ → ⚡ Presence broadcast (Review #2)
        └───────┬───────────────────┘
                │
        ┌───────┴───────────────────┐
        │ CloudAMQP (RabbitMQ TLS)  │
        │ chat.exchange             │ → Publish MessageEvent (→ chat-history-service)
        │ ws.exchange               │ → Fan-out targeted messages giữa instances
        │ room.events               │ → ⚡ member.removed/left → evict cache (Review #1)
        └───────────────────────────┘
```

### Nguyên tắc quan trọng (kế thừa từ P2, P3)
- Service này **KHÔNG** tự validate JWT qua REST filter. JWT được xác thực tại **STOMP CONNECT** qua `ChannelInterceptor`.
- Service này **KHÔNG** lưu tin nhắn vào DB. Nó chỉ **publish event** lên RabbitMQ → `chat-history-service` lưu.
- Service này **KHÔNG** expose port ra host trong Docker. Chỉ Gateway (8080) được expose.
- REST API (nếu có) vẫn dùng `SecurityHeaderFilter` pattern như P2/P3.

### Luồng Gửi Tin nhắn (The Big Picture)

```
1. Client STOMP SEND /app/chat.send  →  messaging-service nhận
2. messaging-service:
   a. Rate-limit check (Redis atomic counter)
   b. Publish MessageEvent lên RabbitMQ (chat.exchange, routing key: message.sent)
   c. Trả ACK cho client ngay lập tức (non-blocking)
3. chat-history-service consume event → lưu MongoDB (đã implement P3)
4. messaging-service consumer nhận lại event từ ws.exchange:
   a. Query Redis → tìm member nào online ở instance nào
   b. Push tin nhắn xuống WebSocket của recipients
```

---

## 3. Phân tích Trade-offs Kiến trúc

### Q1: STOMP over WebSocket vs Raw WebSocket

**Giải pháp đã chọn:** STOMP over WebSocket. Lý do:
- Spring hỗ trợ native `@MessageMapping`, giảm boilerplate.
- Topic-based pub/sub (`/topic/room.{roomId}`) map tự nhiên với chat rooms.
- Queue-based 1:1 (`/queue/user.{userId}`) cho DM và notifications.
- Heartbeat tích hợp sẵn (10s interval).

### Q2: JWT Validation — Gateway hay Service?

**Giải pháp đã chọn:** **Cả hai**, nhưng khác mục đích:
- **Gateway** (`JwtAuthFilter`): Validate JWT cho HTTP upgrade request, gắn `X-User-Id` header.
- **Service** (`StompChannelInterceptor`): Validate JWT **lần nữa** tại STOMP CONNECT frame. Lý do: WebSocket upgrade chỉ xảy ra 1 lần, nhưng STOMP CONNECT mang token riêng trong header → phải xác thực tại đây để set `Principal` cho session.

> ⚠️ **Defense-in-depth:** Nếu attacker bypass Gateway (ví dụ: container compromise), service vẫn reject token invalid.

### Q3: Connection Registry — In-memory vs Redis only?

**Giải pháp đã chọn:** **Hybrid** — `ConcurrentHashMap` (local) + Redis (cross-instance).
- Local map: O(1) lookup session object để push message.
- Redis: Cho phép instance A biết user B đang ở instance C → route qua RabbitMQ.
- TTL 5 phút + heartbeat refresh → tự cleanup khi instance crash.

### Q4: Fan-out Strategy — Direct push vs RabbitMQ routing?

**Giải pháp đã chọn:** RabbitMQ routing keys theo server instance.
- Mỗi instance tạo 1 exclusive queue bind vào `ws.exchange` với routing key `server.{instanceId}`.
- Khi cần push tin nhắn cho user ở instance khác → publish vào `ws.exchange` với routing key tương ứng.
- Instance nhận message từ queue riêng → lookup local `ConcurrentHashMap` → push WebSocket.

### Q5: Membership Lookup — Sync call vs Redis cache?

**Giải pháp đã chọn:** Redis cache `room:members:{roomId}` (TTL 30 phút) + **event-based eviction** (Review #1).
- Tại thời điểm fan-out, cần biết danh sách thành viên room → query Redis cache trước.
- Cache miss → sync call `group-channel-service` qua RestClient (pattern P3) → cache result.
- ⚡ **MUST-HAVE (Review #1):** `MemberEventListener` lắng nghe `member.removed` / `member.left` từ `group-channel-service` qua RabbitMQ → gọi `redisTemplate.delete("room:members:" + roomId)` ngay lập tức.
- **Lý do nâng cấp:** TTL 30 phút = user bị kick vẫn nhận tin nhắn 30 phút → lỗ hổng bảo mật quyền truy cập.

### Q6: Typing & Presence Cross-instance — RabbitMQ vs Redis Pub/Sub? (Review #2)

**Vấn đề:** Chỉ set Redis key TTL 3s không đủ — instance khác không có cơ chế trigger push WS.

**Giải pháp đã chọn:** **Redis Pub/Sub** cho ephemeral events.
- Typing/Presence là dữ liệu "bay hơi" (ephemeral), không cần ACID, mất gói tin chấp nhận được.
- RabbitMQ quá nặng cho use case này (persistent queue, ack, v.v.).
- Redis Pub/Sub: fire-and-forget, tất cả instances subscribe cùng channel → nhận event → check local map → push WS.

```
Flow Typing:
  User A gõ phím (Server 1)
  → Server 1: PUBLISH channel "typing:{roomId}" payload "{userId, username}"
  → Server 2, 3: SUBSCRIBE "typing:{roomId}" → nhận event
  → Check local ConcurrentHashMap → push /topic/room.{roomId}.typing cho members local
```

### Q7: Zombie Session Cleanup (Review #5)

**Vấn đề:** Instance crash đột ngột → `SessionDisconnectEvent` không trigger → `conn:user:{userId}` tồn tại trên Redis tối đa 5 phút.

**Giải pháp đã chọn:** Multi-layer defense:
1. **Layer 1:** `putIfAbsent` — user reconnect ở instance khác tự ghi đè (xử lý 90%).
2. **Layer 2:** ⚡ `@Scheduled` trong `PresenceService` chạy mỗi 60s — quét local `ConcurrentHashMap`, refresh TTL cho users thực sự online. Users có `presence:ONLINE` nhưng không có `conn:user` key → ép về OFFLINE.
3. **Layer 3:** Redis TTL 5 phút tự cleanup keys mồ côi.

---

## 4. Redis Key Design

| Key Pattern | Value | TTL | Mục đích |
|-------------|-------|-----|----------|
| `conn:user:{userId}` | `{instanceId}` | 5 min (auto-refresh @Scheduled 60s) | User đang kết nối instance nào |
| `presence:{userId}` | `{"status":"ONLINE","lastSeen":"..."}` | 10 min | Trạng thái online |
| `room:members:{roomId}` | `SET[userId1, userId2, ...]` | 30 min + ⚡ event eviction (Review #1) | Cache danh sách thành viên |
| `rate:msg:{userId}` | `counter` | 1 sec (sliding window) | Rate limiting: max 5 msg/sec |

**Redis Pub/Sub Channels (Review #2):**

| Channel | Payload | Mục đích |
|---------|---------|----------|
| `typing:{roomId}` | `{userId, username, channelId}` | Typing indicator cross-instance |
| `presence:{roomId}` | `{userId, status}` | Presence updates cross-instance |

---

## 5. WebSocket APIs (STOMP)

### 5.1 Connection

| Action | Destination | Header | Mô tả |
|--------|-------------|--------|--------|
| `CONNECT` | — | `Authorization: Bearer <JWT>` | Xác thực, đăng ký session |
| `DISCONNECT` | — | — | Hủy session, cập nhật presence |

### 5.2 Subscribe (Client lắng nghe)

| Destination | Mô tả |
|-------------|--------|
| `/topic/room.{roomId}` | Tin nhắn nhóm trong room |
| `/queue/user.{userId}` | DM + notifications cá nhân |
| `/topic/room.{roomId}.typing` | Typing indicators của room |
| `/topic/room.{roomId}.presence` | Presence updates của room |

### 5.3 Send (Client gửi)

| Destination | Payload | Mô tả |
|-------------|---------|--------|
| `/app/chat.send` | `ChatMessage` | Gửi tin nhắn mới |
| `/app/chat.typing` | `TypingEvent` | Typing indicator |

---

## 6. File Plan (~16 files mới)

### 6.1 Tầng Config (5 files)

```
config/
├── WebSocketConfig.java          # STOMP configuration, endpoint /ws/chat, broker prefixes
├── RabbitMQConfig.java           # Exchanges (chat.exchange, ws.exchange), Queues, Bindings
├── RedisConfig.java              # RedisTemplate, StringRedisTemplate bean
├── AsyncConfig.java              # Thread pools: taskExecutor, wsExecutor
└── SecurityHeaderFilter.java     # ⚡ Reject 401 nếu thiếu X-User-Id (cho REST endpoints nếu có)
```

### 6.2 Tầng Handler & Interceptor (2 files)

```
handler/
├── StompChannelInterceptor.java  # ⚡ JWT validation tại CONNECT frame, set Principal
└── WebSocketEventHandler.java    # @EventListener: SessionConnectedEvent, SessionDisconnectEvent
```

### 6.3 Tầng Service (5 files)

```
service/
├── ConnectionManager.java        # ConcurrentHashMap + Redis: register/unregister/lookup
├── MessageRouter.java            # @Async fan-out: publish chat.exchange + ws.exchange routing
├── PresenceService.java          # Online/Offline tracking via Redis Pub/Sub + @Scheduled zombie cleanup (Review #2, #5)
├── RateLimiter.java              # Redis INCR + TTL 1s, max 5 msg/sec
└── RedisPubSubService.java       # ⚡ Redis Pub/Sub: subscribe typing/presence channels (Review #2)
```

### 6.4 Tầng Controller (1 file)

```
controller/
└── ChatWebSocketController.java  # @MessageMapping("/chat.send", "/chat.typing")
```

### 6.5 Tầng Listener (2 files)

```
listener/
├── WsMessageListener.java       # @RabbitListener: nhận targeted messages từ ws.exchange → push WS
└── MemberEventListener.java     # ⚡ @RabbitListener: member.removed/left → evict cache (Review #1)
```

### 6.6 Tầng DTO (2 files)

```
model/dto/
├── ChatMessage.java              # roomId, channelId, content, type, fileUrl, replyTo
└── TypingEvent.java              # roomId, channelId, userId, username
```

### 6.7 Tầng Client (1 file)

```
client/
└── MembershipClient.java        # RestClient gọi group-channel-service (pattern P3)
```

### 6.8 Tầng Exception (1 file)

```
exception/
└── GlobalExceptionHandler.java   # @RestControllerAdvice (pattern P2/P3)
```

---

## 7. Chi tiết Component chính

### 7.1 WebSocketConfig.java

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .setAllowedOrigins("*"); // Gateway đã xử lý CORS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/queue");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompChannelInterceptor);
    }
}
```

### 7.2 StompChannelInterceptor.java — JWT tại CONNECT

```java
@Component
public class StompChannelInterceptor implements ChannelInterceptor {
    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            // Extract "Bearer xxx" → validate → set Principal
            String userId = jwtUtil.extractSubject(token.replace("Bearer ", ""));
            accessor.setUser(new StompPrincipal(userId));
        }
        return message;
    }
}
```

### 7.3 ConnectionManager.java — Thread-safe Hybrid Registry

```java
@Service
public class ConnectionManager {
    // Lock-free reads, high throughput
    private final ConcurrentHashMap<String, String> userToSession = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;
    private final String instanceId = UUID.randomUUID().toString();

    public void registerConnection(String userId, String sessionId) {
        userToSession.put(userId, sessionId);
        // Đồng bộ lên Redis cho cross-instance routing
        redisTemplate.opsForValue().set("conn:user:" + userId, instanceId, Duration.ofMinutes(5));
    }

    public void unregisterConnection(String userId) {
        userToSession.remove(userId);
        redisTemplate.delete("conn:user:" + userId);
    }

    public String getInstanceForUser(String userId) {
        return redisTemplate.opsForValue().get("conn:user:" + userId);
    }

    public String getInstanceId() { return instanceId; }
    public boolean isLocalUser(String userId) { return userToSession.containsKey(userId); }
}
```

### 7.4 MessageRouter.java — Non-blocking Pipeline

```java
@Service
@RequiredArgsConstructor
public class MessageRouter {
    private final RabbitTemplate rabbitTemplate;
    private final ConnectionManager connectionManager;
    private final StringRedisTemplate redisTemplate;

    // 1. Publish MessageEvent cho chat-history-service lưu trữ
    @Async("taskExecutor")
    public void publishToHistory(MessageEvent event) {
        rabbitTemplate.convertAndSend("chat.exchange", "message.sent", event);
    }

    // 2. Fan-out tin nhắn đến các instance đang giữ kết nối của members
    @Async("taskExecutor")
    public void fanOutToMembers(ChatMessage message, String roomId) {
        Set<String> memberIds = getRoomMembers(roomId);
        Map<String, List<String>> instanceToUsers = new HashMap<>();

        for (String userId : memberIds) {
            String instance = connectionManager.getInstanceForUser(userId);
            if (instance != null) {
                instanceToUsers.computeIfAbsent(instance, k -> new ArrayList<>()).add(userId);
            }
        }

        // Publish targeted message đến từng instance qua ws.exchange
        instanceToUsers.forEach((instanceId, users) ->
            rabbitTemplate.convertAndSend("ws.exchange", "server." + instanceId,
                new TargetedMessage(users, message))
        );
    }

    private Set<String> getRoomMembers(String roomId) {
        // Redis cache lookup → fallback RestClient call
        return redisTemplate.opsForSet().members("room:members:" + roomId);
    }
}
```

### 7.5 Rate Limiting (Redis Lua Script)

```java
@Component
public class RateLimiter {
    private final StringRedisTemplate redisTemplate;
    private static final int MAX_MESSAGES_PER_SECOND = 5;

    public boolean isAllowed(String userId) {
        String key = "rate:msg:" + userId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(1));
        }
        return count <= MAX_MESSAGES_PER_SECOND;
    }
}
```

---

## 8. Bảo mật

### 8.1 Docker-level (Kế thừa P2/P3)

```yaml
# docker-compose.yml — KHÔNG expose port 8084 ra host
messaging-service:
  expose:
    - "8084"          # Chỉ visible cho containers trong cùng network
```

### 8.2 WebSocket-level

- **CONNECT:** JWT validation bắt buộc tại `StompChannelInterceptor`.
- **SUBSCRIBE:** Verify user là member của room trước khi cho subscribe `/topic/room.{roomId}`.
- **SEND:** Rate limiting + membership check trước khi forward message.

### 8.3 Gateway WebSocket Route

Gateway đã cấu hình sẵn:
```yaml
- id: messaging-service
  uri: lb://messaging-service
  predicates:
    - Path=/ws/**
```

> ⚠️ **Lưu ý:** `JwtAuthFilter` của Gateway cần **bypass** cho path `/ws/**` vì WebSocket upgrade không gửi JWT theo REST pattern. JWT sẽ được validate tại STOMP level bởi `StompChannelInterceptor`.

---

## 9. Concurrency & Thread Safety

### 9.1 Thread Pool Configuration

| Pool | Core | Max | Queue | Mục đích |
|------|------|-----|-------|----------|
| `taskExecutor` | 10 | 50 | 100 | @Async: message routing, fan-out |
| `wsExecutor` | 5 | 20 | 200 | WebSocket broadcast |
| Tomcat | 200 | 200 | — | REST API (nếu có) |
| RabbitMQ Consumer | 2 | 10 | — | Nhận targeted messages từ ws.exchange |

### 9.2 Tổng hợp chiến lược Concurrency

| Tình huống | Cơ chế | Lý do |
|------------|--------|-------|
| Session registry | `ConcurrentHashMap` | Lock-free reads, high throughput |
| Cross-instance routing | Redis `conn:user:{userId}` | Distributed state |
| Message routing | `@Async` + `CompletableFuture` | Non-blocking WS threads |
| Rate limiting | Redis atomic `INCR` + TTL | Atomic counter per second |
| Typing/Presence broadcast | ⚡ Redis Pub/Sub (Review #2) | Fire-and-forget, cross-instance, no ACID needed |
| Membership cache eviction | ⚡ RabbitMQ event listener (Review #1) | Realtime eviction thay vì TTL 30m |
| Zombie session cleanup | ⚡ `@Scheduled` 60s (Review #5) | Quét presence mồ côi, ép OFFLINE |

---

## 10. Dependencies cần bổ sung

### 10.1 pom.xml

```xml
<!-- Đã có sẵn: web, websocket, data-redis, amqp, eureka-client, common-lib -->
<!-- CẦN THÊM: -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### 10.2 application.yml — Bổ sung WebSocket config

```yaml
# Thêm vào application.yml hiện tại
spring:
  websocket:
    stomp:
      heartbeat:
        outgoing: 10000    # Server gửi heartbeat mỗi 10s
        incoming: 10000    # Expect client heartbeat mỗi 10s
```

---

## 11. Unit Test Plan

### 11.1 StompChannelInterceptorTest
- `connect_ValidJwt_SetsUserPrincipal` — Token hợp lệ → set Principal thành công
- `connect_InvalidJwt_ThrowsException` — Token sai → reject CONNECT
- `connect_MissingToken_ThrowsException` — Không có token → reject

### 11.2 ConnectionManagerTest
- `registerConnection_AddsToLocalAndRedis` — Đăng ký → có trong cả ConcurrentHashMap và Redis
- `unregisterConnection_RemovesFromBoth` — Hủy → xóa khỏi cả hai
- `getInstanceForUser_ReturnsCorrectInstance` — Lookup Redis trả đúng instanceId
- `isLocalUser_ReturnsTrueForLocalOnly` — Chỉ true cho user local

### 11.3 MessageRouterTest
- `publishToHistory_SendsToRabbitMQ` — Event được publish lên `chat.exchange`
- `fanOutToMembers_RoutesToCorrectInstances` — Group by instance → đúng routing key

### 11.4 RateLimiterTest
- `isAllowed_UnderLimit_ReturnsTrue` — Dưới 5 msg/s → cho phép
- `isAllowed_OverLimit_ReturnsFalse` — Trên 5 msg/s → chặn

### 11.5 MemberEventListenerTest (Review #1)
- `onMemberRemoved_EvictsCacheImmediately` — Nhận event → `redisTemplate.delete()` đúng key
- `onMemberLeft_EvictsCacheImmediately` — Tương tự cho leave

### 11.6 PresenceServiceTest (Review #5)
- `scheduledCleanup_ZombieSession_ForcesOffline` — User có presence ONLINE nhưng conn:user đã hết → ép OFFLINE
- `scheduledCleanup_ActiveSession_RefreshesTTL` — User thực sự online → refresh TTL

### 11.7 SecurityHeaderFilterTest (Reuse pattern P2/P3)
- `request_WithoutXUserId_Returns401`
- `request_WithXUserId_PassesThrough`

---

## 12. Verification Plan

### 12.1 Unit Test
```bash
cd backend/messaging-service
mvn clean test
```

### 12.2 Integration Test (Docker)
```bash
cd backend
docker compose --profile full up --build
```

### 12.3 WebSocket Test (Postman hoặc wscat)
```bash
# 1. Kết nối STOMP
wscat -c ws://localhost:8080/ws/chat

# 2. STOMP CONNECT frame với JWT
CONNECT
Authorization:Bearer <JWT_TOKEN>
accept-version:1.2
heart-beat:10000,10000

^@

# 3. SUBSCRIBE room
SUBSCRIBE
id:sub-0
destination:/topic/room.<roomId>

^@

# 4. SEND message
SEND
destination:/app/chat.send
content-type:application/json

{"roomId":"<roomId>","channelId":"<channelId>","content":"Hello!","type":"TEXT"}
^@
```

---

## 13. Thứ tự triển khai (Task Order)

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| 0 | Dependencies | Thêm `lombok` vào `pom.xml` | — |
| 1 | DTO | `ChatMessage.java`, `TypingEvent.java` | — |
| 2 | Config | `RedisConfig`, `RabbitMQConfig`, `AsyncConfig`, `SecurityHeaderFilter` | — |
| 3 | WebSocket Config | `WebSocketConfig` + `StompChannelInterceptor` | Step 2 |
| 4 | Connection | `ConnectionManager` + `WebSocketEventHandler` | Step 2, 3 |
| 5 | Service | `PresenceService` (+ @Scheduled zombie cleanup), `RateLimiter`, `MembershipClient`, `RedisPubSubService` | Step 4 |
| 6 | Router | `MessageRouter` (publish + fan-out) | Step 2, 4, 5 |
| 7 | Listener | `WsMessageListener` + ⚡ `MemberEventListener` (cache eviction) | Step 4, 5, 6 |
| 8 | Controller | `ChatWebSocketController` (@MessageMapping) | Step 5, 6 |
| 9 | Exception | `GlobalExceptionHandler` | — |
| 10 | Docker | Xóa `ports`, dùng `expose` only | — |
| 11 | Unit Test | Tất cả test classes (mục 11, bao gồm Review #1, #5 tests) | Step 3-8 |
| 12 | E2E + Load Test | Build Docker + WebSocket test + ⚡ JMeter rate-limit stress test (Review #4) | Step 10-11 |

---

## 14. Dependency Graph

```text
                common-lib (MessageEvent, JwtUtil, ApiResponse)
                         │
                 ┌───────┼───────────┐
                 ▼       ▼           ▼
           user-service  │     api-gateway (/ws/**)
                 │       ▼           │
                 │  group-channel    │
                 │   -service       │
                 │       │           │
                 ▼       ▼           ▼
            messaging-service ← THIS PHASE
                 │           │
                 ▼           ▼
          Upstash Redis    CloudAMQP
             (TLS)       (RabbitMQ TLS)
                             │
                             ▼
                   chat-history-service (P3)
                        consumes MessageEvent
```

---

## 15. Quyết định thiết kế đã chốt

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| Q1 | Protocol | STOMP over WebSocket | Native Spring support, topic/queue pub-sub |
| Q2 | JWT validation | Gateway + STOMP interceptor (dual) | Defense-in-depth |
| Q3 | Connection registry | ConcurrentHashMap + Redis hybrid | Local O(1) + cross-instance routing |
| Q4 | Fan-out strategy | RabbitMQ routing keys per instance | Scalable, decoupled |
| Q5 | Membership lookup | Redis cache (TTL 30m) + **event eviction** | Performance + consistency + ⚡ realtime security |
| Q6 | Rate limiting | Redis INCR + TTL 1s, max 5 msg/sec | Atomic, distributed |
| Q7 | Typing/Presence | ⚡ **Redis Pub/Sub** (không dùng key TTL) | Cross-instance broadcast, fire-and-forget |
| Q8 | Presence cleanup | Redis TTL 10m + ⚡ **@Scheduled 60s** zombie scan | Multi-layer defense against stale sessions |
| Q9 | Port security | `expose` only + SecurityHeaderFilter | Defense-in-depth (kế thừa P2/P3) |
| Q10 | Lombok | Thêm dependency vào pom.xml | Hiện tại pom.xml thiếu |
| Q11 | Message storage | KHÔNG lưu DB, chỉ publish event | Separation of concerns → P3 handles storage |
| Q12 | Heartbeat | STOMP heartbeat 10s interval | Detect stale connections |
| R1 | Membership cache eviction | ⚡ `MemberEventListener` RabbitMQ (must-have) | TTL 30m = lỗ hổng bảo mật quyền truy cập (Review #1) |
| R2 | Ephemeral event routing | ⚡ Redis Pub/Sub thay vì Redis key only | Key only không trigger push ở instance khác (Review #2) |
| R3 | Frontend layout stability | UserPanel neo cố định, không float khi scroll | Tránh vỡ layout khi WS bơm data real-time (Review #3) |
| R4 | Load testing | JMeter WebSocket Sampler + rate-limit stress | Verify @Async + rate-limit dưới tải cao (Review #4) |
| R5 | Zombie session | `@Scheduled` 60s quét presence mồ côi | Ép OFFLINE khi conn:user đã bốc hơi (Review #5) |
