# Phase P3 — Chat History Service

> **Status:** 📋 PLANNING
> **Ngày lập kế hoạch:** 2026-05-11
> **Service:** `chat-history-service` (port 8083)
> **Database:** MongoDB Atlas (Cluster0) + CloudAMQP (RabbitMQ)
> **Mục tiêu:** Lưu trữ lịch sử tin nhắn (Write-Heavy), cung cấp API đọc tin nhắn với Cursor Pagination, lắng nghe event từ RabbitMQ

---

## 1. Overview

### Hiện trạng

`chat-history-service` hiện chỉ có:
- ✅ `ChatHistoryApplication.java` — entry point + `@EnableDiscoveryClient`
- ✅ `application.yml` — cấu hình MongoDB Atlas + CloudAMQP + Eureka
- ✅ `pom.xml` — dependencies: web, data-mongodb, AMQP, eureka-client, common-lib
- ✅ `.env` — MONGODB_URI, RabbitMQ credentials
- ✅ `Dockerfile` — multi-stage build sẵn sàng
- ✅ `docker-compose.yml` — service đã cấu hình (profile `full`)
- ✅ Gateway route — `/api/messages/**` → `lb://chat-history-service`
- 🔴 **Không có bất kỳ Document/Controller/Service nào** → 0% business logic

### Mục tiêu Phase P3

Sau khi hoàn thành, hệ thống sẽ:
1. **Lưu tin nhắn từ RabbitMQ** — Lắng nghe event `MessageEvent` từ `messaging-service` (Phase 4 sẽ publish), ghi vào MongoDB
2. **REST API đọc lịch sử** — Cursor-based pagination (không dùng offset), sắp xếp giảm dần theo thời gian
3. **Tìm kiếm tin nhắn** — Text search trong nội dung tin nhắn (MongoDB text index)
4. **Quản lý Read Receipts** — Theo dõi user đã đọc đến tin nhắn nào trong mỗi channel
5. **Nhận userId từ Gateway** — Thông qua header `X-User-Id`, reject 401 nếu thiếu header (cùng pattern Phase 2)
6. **Soft Delete** — Xóa mềm tin nhắn, tự động dọn dẹp sau 30 ngày qua MongoDB TTL Index

---

## 2. Kiến trúc & Luồng dữ liệu

```
Frontend → API Gateway (JWT validation + X-User-Id)
                ↓ (chỉ qua Docker internal network)
        chat-history-service (:8083 — KHÔNG expose ra host)
                │
        ┌───────┴───────┐
        │ MongoDB Atlas  │ (Cluster0)
        │ messages       │ (Collection)
        │ read_receipts  │ (Collection)
        └───────┬───────┘
                │
        ┌───────┴───────┐
        │ RabbitMQ       │ (CloudAMQP)
        │ chat.exchange  │ ← Nhận message từ messaging-service
        │ room.events    │ ← Nhận event room.deleted từ group-channel-service
        └───────────────┘
```

**Nguyên tắc quan trọng (kế thừa từ Phase 2):**
- Service này **KHÔNG** tự validate JWT. Gateway đã làm → service nhận `X-User-Id` header.
- Service này **KHÔNG** cấu hình CORS. Gateway xử lý tập trung.
- Service này **KHÔNG** expose port ra host trong Docker. Chỉ Gateway (8080) được expose.
- Service này **KHÔNG** chủ động gửi tin nhắn. Nó chỉ **lắng nghe** event từ RabbitMQ và **lưu trữ**.

### Luồng Giao tiếp Tổng quan (The Big Picture)

```
Ghi (Write Path — Asynchronous, không có API POST nào):
  Client gửi tin → messaging-service → RabbitMQ → chat-history-service → MongoDB
  ⚡ Service này KHÔNG nhận tin nhắn trực tiếp từ Client.

Đọc (Read Path — Synchronous REST API):
  Client scroll lên → API Gateway → chat-history-service → MongoDB → Response
  ⚡ Cursor pagination O(1) nhờ ObjectId index.
```

---

## 3. Phân tích Trade-offs Kiến trúc

### Q1: Tại sao MongoDB thay vì PostgreSQL?

**Giải pháp đã chọn:** MongoDB. Lý do:
- Write throughput cao hơn PostgreSQL cho use case append-only.
- Schema linh hoạt cho `reactions[]`, `replyTo{}`, `fileUrl` (embedded documents).
- Horizontal scaling bằng sharding theo `roomId` khi cần.
- TTL Index tự động dọn dẹp tin nhắn đã xóa mềm sau 30 ngày.

### Q2: Cursor Pagination vs Offset Pagination

**Giải pháp đã chọn:** Cursor-based pagination sử dụng `_id` (ObjectId) của MongoDB.
- ObjectId tự nhiên có tính chất monotonic (sắp xếp theo thời gian tạo).
- Query `{ _id: { $lt: cursor } }` luôn O(1) nhờ B-tree index.
- Frontend gửi `?before={lastObjectId}&limit=50` để load thêm khi scroll lên.

### Q2.5: Quan hệ giữa `messageId` (event) và `_id` (document) — Idempotent Consumer

**Vấn đề (Review #1):** `MessageEvent.messageId` là String UUID (do `messaging-service` sinh). Nếu để MongoDB tự sinh `_id` ObjectId mới mỗi lần consume, hai lần redelivery cùng một event sẽ tạo ra hai document khác nhau → Idempotent Consumer phá sản.

**Phân tích 2 phương án:**
- **Cách A** — Dùng `messageId` làm `_id`: Idempotent ngay, nhưng mất tính monotonic của ObjectId → Cursor pagination `{ _id: { $lt: cursor } }` sụp đổ vì UUID so sánh lexicographic.
- **Cách B** — `_id` ObjectId tự sinh + thêm field `messageId` (unique index): Giữ cursor pagination, Idempotent Consumer chạy nhờ unique constraint throw `DuplicateKeyException`.

**Quyết định: Cách B.** Document giữ `_id` ObjectId để cursor pagination hoạt động đúng. Thêm field `messageId` (String) với **unique index** riêng. Listener dùng `insert()` + catch `DuplicateKeyException` để bỏ qua message trùng.

### Q3: Denormalization — Lưu `senderName` & `senderAvatar` trong message

**Vấn đề:** `senderName` có thể thay đổi sau khi tin nhắn được gửi.

**Giải pháp đã chọn:** Chấp nhận denormalization. Tin nhắn lưu snapshot `senderName` tại thời điểm gửi, tránh cross-service JOIN. Đây là pattern chuẩn của Discord/Slack/Telegram.

> ⚠️ **Tương lai (P_FINAL):** Khi user đổi tên, có thể phát event `user.updated` để batch-update `senderName` trong messages (optional, low priority).

### Q4: Xử lý event `room.deleted` — Xóa toàn bộ lịch sử?

**Giải pháp đã chọn:** Khi nhận event `room.deleted` từ `group-channel-service`, đánh dấu soft-delete toàn bộ messages của room đó. TTL Index sẽ tự động dọn dẹp sau 30 ngày.

> ⚠️ **Chưa implement listener `room.deleted` trong P3.** Để TODO. Sẽ xử lý khi Phase 2 publish đủ events.

---

## 4. MongoDB Schema (MongoDB Atlas — Cluster0)

### 4.1 Collection: `messages`

```javascript
{
    _id: ObjectId("..."),                    // MongoDB auto-generated, dùng làm CURSOR
    messageId: "uuid-from-event",            // ⚡ UNIQUE INDEX — Idempotent Consumer key
    roomId: "uuid-room-id",                  // Partition key (shard key tương lai)
    channelId: "uuid-channel-id",
    senderId: "uuid-user-id",
    senderName: "username",                  // Denormalized (snapshot)
    senderAvatar: "https://...",             // Denormalized (snapshot)

    type: "TEXT",                             // TEXT | IMAGE | FILE | SYSTEM
    content: "Hello everyone!",

    // File attachment (optional)
    fileUrl: "https://b2/bucket/file.png",
    fileName: "screenshot.png",
    fileSize: 204800,                        // bytes

    // Edit/Delete tracking
    isEdited: false,
    isDeleted: false,                        // Soft delete
    deletedAt: null,                         // ⚡ TTL anchor — tách khỏi updatedAt (Review #4)

    // Timestamps
    createdAt: ISODate("2026-05-11T13:22:09Z"),
    updatedAt: null,

    // Reply reference (optional)
    replyTo: {
        messageId: "uuid-string",        // ⚡ Dùng UUID của event, KHÔNG dùng ObjectId của Mongo
        content: "Original message preview...",
        senderName: "user1"
    }
}
```

### 4.2 Collection: `read_receipts`

```javascript
{
    _id: ObjectId("..."),
    userId: "uuid-user-id",
    roomId: "uuid-room-id",
    channelId: "uuid-channel-id",
    lastReadMessageId: "ObjectId-string",
    lastReadAt: ISODate("2026-05-11T13:22:09Z")
    // ⚡ Không lưu unreadCount: tính realtime bằng bounded count query (cap 100)
    //    để tránh side-effect trong listener phá vỡ idempotency
}
```

### 4.3 MongoDB Indexes (Tạo qua `MongoIndexConfig.java` — tắt `auto-index-creation`)

> ⚠️ Tắt `auto-index-creation` trong `application.yml`, chỉ dùng `MongoIndexConfig` programmatic.
> TODO (P_FINAL): Tích hợp **Mongock** để quản lý versioning schema và index migrations an toàn trên production.

| Index | Collection | Fields | Mục đích |
|-------|-----------|--------|----------|
| `idx_channel_cursor` | messages | `{ roomId: 1, channelId: 1, _id: -1 }` | Cursor pagination (ESR: Equality roomId+channelId → Sort+Range _id) |
| `idx_messageId` | messages | `{ messageId: 1 }` **UNIQUE** | ⚡ Idempotent Consumer — chống duplicate (Review #1) |
| `idx_sender_time` | messages | `{ senderId: 1, createdAt: -1 }` | Tìm tin nhắn theo user |
| TTL Index | messages | `{ deletedAt: 1 }` (partial: `isDeleted: true`) | Tự xóa 30 ngày sau khi soft-delete (Review #4) |
| Text Index | messages | `{ content: "text" }` | Full-text search |
| Unique | read_receipts | `{ userId: 1, roomId: 1, channelId: 1 }` | Mỗi user chỉ 1 receipt/channel |

---

## 5. API Endpoints

### 5.1 Message APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/messages/rooms/{roomId}/channels/{channelId}` | ✅ + Membership | Lịch sử tin nhắn (cursor pagination, filter `isDeleted: false`) |
| `GET` | `/api/messages/rooms/{roomId}/channels/{channelId}/search?q={keyword}` | ✅ + Membership | Tìm kiếm tin nhắn |
| `DELETE` | `/api/messages/{messageId}` | ✅ Sender only | Soft-delete (`isDeleted=true`, `deletedAt=now()`). **Không cần check membership** — user có quyền xóa tin nhắn của chính mình kể cả khi đã rời room |

> ⚠️ **ESR rule:** API path bao gồm `roomId` để compound index `{ roomId, channelId, _id }` được hit đúng prefix.

> ⚠️ **IDOR:** Mọi request GET phải verify user là member của room (xem mục 8.3). DELETE chỉ check `userId == senderId`.

> ⚠️ GET luôn filter `isDeleted: false`. Frontend không bao giờ nhận tin nhắn đã xóa.

**Query Parameters cho GET:**
- `before` (String, optional): ObjectId cursor — lấy messages trước ID này
- `limit` (Integer, optional, default=50, max=100): Số lượng messages trả về

### 5.2 Read Receipt APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `PUT` | `/api/messages/rooms/{roomId}/channels/{channelId}/read` | ✅ + Membership | Atomic update — chỉ ghi đè nếu `newReadId > lastReadMessageId` |
| `GET` | `/api/messages/rooms/{roomId}/channels/{channelId}/unread` | ✅ + Membership | Bounded count (cap 100, hiển thị "99+") |

---

## 6. File Plan (14 files mới)

### 6.1 Tầng Document (MongoDB) & DTO (4 files)

```
model/document/
├── Message.java              # @Document messages — ObjectId, roomId, channelId, type, content
└── ReadReceipt.java          # @Document read_receipts — userId, channelId, lastReadMessageId
model/dto/
├── MessageResponse.java      # DTO trả về cho Frontend (hide internal fields)
└── ReadReceiptResponse.java  # DTO cho unread count
```

### 6.2 Tầng Repository (2 files)

```
repository/
├── MessageRepository.java        # MongoRepository<Message, String> + custom cursor queries
└── ReadReceiptRepository.java    # MongoRepository<ReadReceipt, String>
```

### 6.3 Tầng Service (2 files)

```
service/
├── MessageService.java           # Lưu message, cursor pagination, search, soft-delete
└── ReadReceiptService.java       # Cập nhật read receipt, tính unread count
```

### 6.4 Tầng Controller (1 file)

```
controller/
└── MessageController.java        # REST endpoints: GET messages, DELETE message, PUT read receipt
```

### 6.5 Tầng Listener (1 file)

```
listener/
└── MessageEventListener.java     # @RabbitListener — nhận MessageEvent → insert() MongoDB
                                  # ⚡ Idempotent Consumer: dùng insert() thay save(),
                                  #    catch DuplicateKeyException để bỏ qua message trùng
                                  #    (RabbitMQ chỉ đảm bảo At-Least-Once Delivery)
```

### 6.6 Tầng Config & Exception (4 files)

```
config/
├── RabbitMQConfig.java            # Exchange + Queue + Binding declarations
├── SecurityHeaderFilter.java      # ⚡ STRICT: Reject 401 nếu thiếu X-User-Id (reuse pattern P2)
└── MongoIndexConfig.java          # Tạo compound indexes programmatically (backup cho auto-index)
exception/
└── GlobalExceptionHandler.java    # @RestControllerAdvice (pattern từ P2)
```

---

## 7. RabbitMQ Integration

### 7.1 Exchanges & Queues

| Exchange | Type | Routing Key | Queue | Consumer | Mô tả |
|----------|------|-------------|-------|----------|-------|
| `chat.exchange` | Topic | `message.sent` | `chat-history.message.queue` | `MessageEventListener` | Lưu tin nhắn mới vào MongoDB |
| `room.events` | Topic | `room.deleted` | `chat-history.room-deleted.queue` | TODO (P_FINAL) | Soft-delete toàn bộ messages của room |

### 7.2 MessageEvent (common-lib — CẦN MỞ RỘNG)

> ⚠️ **Review #5:** `MessageEvent` hiện tại thiếu `senderAvatar`, `fileName`, `fileSize`, `replyTo`. Cần bổ sung vào `common-lib` để Document nhận đủ dữ liệu.

```java
// com.discordmini.common.event.MessageEvent — BỔ SUNG fields
public class MessageEvent implements Serializable {
    private String messageId;
    private String roomId;
    private String channelId;
    private String senderId;
    private String senderName;
    private String senderAvatar;   // ⚡ NEW (Review #5)
    private String content;
    private String type;           // TEXT, IMAGE, FILE, SYSTEM
    private String fileUrl;
    private String fileName;       // ⚡ NEW (Review #5)
    private Long fileSize;         // ⚡ NEW (Review #5)
    private ReplyInfo replyTo;     // ⚡ NEW (Review #5) — nullable
    private LocalDateTime createdAt;
}
```

> **Lưu ý:** Việc mở rộng `MessageEvent` trong `common-lib` sẽ được thực hiện tại **Step 0** của Task Order. Phase 4 (messaging-service) sẽ populate đầy đủ các field này khi publish.

---

## 8. Bảo mật: Chống X-User-Id Spoofing (Kế thừa P2)

### 8.1 Docker-level

```yaml
# docker-compose.yml — KHÔNG expose port 8083 ra host
chat-history-service:
  # ports:             ← XÓA HOÀN TOÀN
  #   - "8083:8083"
  expose:
    - "8083"           ← Chỉ visible cho containers trong cùng network
```

### 8.2 Application-level (SecurityHeaderFilter — clone từ P2)

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeaderFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        HttpServletRequest request = (HttpServletRequest) req;
        // Skip actuator
        if (request.getRequestURI().startsWith("/actuator")) {
            chain.doFilter(req, res); return;
        }
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            // → 401 Unauthorized
        }
        chain.doFilter(req, res);
    }
}
```

### 8.3 Authorization theo Membership (Chống IDOR)

**Vấn đề:** Xác thực (authn) ≠ phân quyền (authz). User có JWT hợp lệ vẫn có thể đọc tin nhắn của room không thuộc → lỗ hổng IDOR.

**Giải pháp:** Gọi sync sang `group-channel-service` qua Eureka bằng **`RestClient`** (Spring Boot 3.4+ fluent API, thay thế RestTemplate).

```java
// MembershipClient.java — dùng RestClient (Spring Boot 3.4+)
@Component
public class MembershipClient {
    private final RestClient restClient;

    public MembershipClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("lb://group-channel-service").build();
    }

    public void verifyMembership(String userId, String roomId) {
        // GET /api/rooms/{roomId}/members/{userId} → 404 = not member
        restClient.get()
            .uri("/api/rooms/{roomId}/members/{userId}", roomId, userId)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new ForbiddenException("Not a member of this room");
            })
            .toBodilessEntity();
    }
}
```

**Phân quyền theo endpoint:**
| Endpoint | Cần Membership? | Lý do |
|----------|-----------------|-------|
| `GET .../messages` | ✅ Bắt buộc | Chống IDOR — không cho đọc trộm |
| `GET .../search` | ✅ Bắt buộc | Tương tự GET messages |
| `PUT .../read` | ✅ Bắt buộc | User rời room không được update receipt |
| `GET .../unread` | ✅ Bắt buộc | User rời room không được query |
| `DELETE /messages/{id}` | ❌ Không cần | User xóa tin nhắn của chính mình kể cả khi đã rời room |

> **TODO (P_FINAL):** Lắng nghe event `member.removed` từ RabbitMQ để evict Caffeine cache key ngay lập tức, ngăn user bị kick tiếp tục đọc tin mới.

---

## 9. Unit Test Plan

### 9.1 MessageServiceTest
- `getMessagesByChannel_CursorPagination_Success` — Cursor pagination trả đúng thứ tự giảm dần
- `getMessagesByChannel_EmptyChannel_ReturnsEmptyList` — Channel rỗng không lỗi
- `getMessagesByChannel_WithLimit_RespectsMaxLimit` — Limit vượt quá 100 bị clamp
- `softDeleteMessage_BySender_Success` — Chỉ người gửi mới được xóa
- `softDeleteMessage_ByOther_ThrowsForbidden` — Người khác không được xóa
- `searchMessages_WithKeyword_ReturnsMatches` — Text search hoạt động

### 9.2 MessageEventListenerTest
- `onMessageEvent_ValidEvent_SavesDocument` — Event hợp lệ → `insert()` vào MongoDB
- `onMessageEvent_DuplicateId_IgnoresGracefully` — Tin nhắn trùng `messageId` → catch `DuplicateKeyException`, return bình thường, không crash (Idempotent Consumer pattern)

### 9.3 SecurityHeaderFilterTest (Reuse pattern từ P2)
- `request_WithoutXUserId_Returns401`
- `request_WithXUserId_PassesThrough`
- `request_ActuatorPath_SkipsFilter`

### 9.4 ReadReceiptServiceTest
- `markAsRead_NewerMessage_UpdatesReceipt` — Atomic update thành công khi `newReadId > lastReadMessageId`
- `markAsRead_OlderMessageId_DoesNotOverwrite` — Không ghi đè khi `newReadId < lastReadMessageId` (multi-device safe)
- `getUnreadCount_ReturnsCorrectCount` — Bounded count trả đúng (cap 100)
- `getUnreadCount_ExceedsLimit_ReturnsHasMore` — Khi vượt 100, trả `displayCount: "99+"`, `hasMore: true`

---

## 10. Verification Plan

### 10.1 Unit Test
```bash
cd backend/chat-history-service
mvn clean test
```

### 10.2 Integration Test (Docker)
```bash
cd backend
docker compose up --build discovery-server user-service api-gateway group-channel-service chat-history-service
```

### 10.3 API Test (curl)
```bash
# Lấy lịch sử tin nhắn (cursor pagination)
curl -X GET "http://localhost:8080/api/messages/rooms/{roomId}/channels/{channelId}?limit=20" \
  -H "Authorization: Bearer <JWT>"

# Lấy page tiếp theo (before cursor)
curl -X GET "http://localhost:8080/api/messages/rooms/{roomId}/channels/{channelId}?before={lastObjectId}&limit=20" \
  -H "Authorization: Bearer <JWT>"

# Tìm kiếm tin nhắn
curl -X GET "http://localhost:8080/api/messages/rooms/{roomId}/channels/{channelId}/search?q=hello" \
  -H "Authorization: Bearer <JWT>"

# Soft-delete tin nhắn
curl -X DELETE "http://localhost:8080/api/messages/{messageId}" \
  -H "Authorization: Bearer <JWT>"

# Đánh dấu đã đọc
curl -X PUT "http://localhost:8080/api/messages/rooms/{roomId}/channels/{channelId}/read" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"lastReadMessageId":"<ObjectId>"}'
```

---

## 11. Thứ tự triển khai (Task Order)

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| 0 | Mở rộng MessageEvent | Bổ sung fields vào `common-lib/MessageEvent.java` (Review #5) | — |
| 1 | Document + DTO | Message (với `messageId` field), ReadReceipt, MessageResponse, ReadReceiptResponse | Step 0 |
| 2 | Repository | MessageRepository (cursor query với roomId+channelId), ReadReceiptRepository | Step 1 |
| 3 | Config | SecurityHeaderFilter, RabbitMQConfig, MongoIndexConfig (tắt auto-index) | — |
| 4 | Exception | GlobalExceptionHandler | — |
| 5 | Service | MessageService (membership check + cursor + search + soft-delete), ReadReceiptService | Step 1-4 |
| 6 | Listener | MessageEventListener (`insert()` + catch `DuplicateKeyException`) | Step 2, 3 |
| 7 | Controller | MessageController (REST: roomId+channelId in path) | Step 5-6 |
| 8 | Docker | Xóa `ports`, dùng `expose` only + Thêm Lombok dependency | — |
| 9 | Unit Test | MessageServiceTest, MessageEventListenerTest, SecurityHeaderFilterTest, ReadReceiptServiceTest | Step 5-7 |
| 10 | E2E | Build + test từ Gateway (qua internal network) | Step 7-9 |

---

## 12. Liên kết với Gateway (Đã sẵn sàng)

Gateway route đã cấu hình từ P0:
```yaml
- id: chat-history-service
  uri: lb://chat-history-service
  predicates:
    - Path=/api/messages/**
```

`JwtAuthFilter` đã tự động gắn header `X-User-Id` → `chat-history-service` chỉ cần đọc header này.

---

## 13. Dependency Graph

```text
                common-lib (MessageEvent, ApiResponse, BaseException)
                         │
                 ┌───────┼───────────┐
                 ▼       ▼           ▼
           user-service  │     api-gateway
                 │       │           │
                 ▼       ▼           ▼
      group-channel-service    chat-history-service ← THIS PHASE
           (room.events)    │         │
                            ▼         ▼
                      RabbitMQ    MongoDB Atlas
                   (CloudAMQP)    (Cluster0)
```

---

## 14. Quyết định thiết kế đã chốt

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| Q1 | DB choice | MongoDB Atlas | Write-heavy, flexible schema, TTL auto-cleanup |
| Q2 | Pagination | Cursor-based (`_id` ObjectId) | O(1) mọi page, giữ monotonic order |
| Q3 | Denormalization | Lưu `senderName` snapshot | Tránh cross-service JOIN |
| Q4 | Room deleted cleanup | Soft-delete + TTL 30 ngày (defer) | Giữ data để audit, tự cleanup |
| Q5 | Port security | `expose` only + SecurityHeaderFilter 401 | Defense-in-depth (kế thừa P2) |
| Q6 | Event source | Consume `MessageEvent` từ common-lib | Shared event class |
| Q7 | Lombok | Thêm dependency vào pom.xml | Hiện tại pom.xml thiếu |
| R1 | `_id` vs `messageId` | **Cách B:** `_id` ObjectId + `messageId` unique index | Giữ cursor pagination + Idempotent Consumer |
| R2 | Cursor index ESR | `{ roomId, channelId, _id: -1 }` + API nhận roomId | ESR prefix match, không collection scan |
| R3 | Authorization IDOR | **RestClient** sync call verify membership | Chống IDOR. TODO P_FINAL: event-based cache eviction |
| R4 | TTL field | Dùng `deletedAt` thay `updatedAt` | Edit không reset TTL timer |
| R5 | MessageEvent expansion | Mở rộng common-lib thêm 4 fields | Document nhận đủ data từ event |
| R6 | Unread count | Bounded count (cap 100, "99+") | Tránh full collection scan + listener idempotency |
| R7 | Index migration | `MongoIndexConfig` (tắt auto). TODO P_FINAL: Mongock | Tránh race condition + versioning |
| R8 | Read receipt race | Atomic `$set` chỉ khi `newReadId > old` | Multi-device safe, không overwrite |
| R9 | `replyTo.messageId` | Lưu UUID (event ID), không lưu ObjectId | Frontend chỉ biết UUID, lookup qua `idx_messageId` |
| R10 | DELETE authz | Chỉ check `userId == senderId`, bỏ qua membership | User xóa tin nhắn của mình kể cả khi đã rời room |
