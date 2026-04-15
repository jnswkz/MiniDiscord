# 📊 Discord Mini — Tiến Độ Dự Án

> **Cập nhật:** 2026-04-16 | **Phase hiện tại:** Infrastructure ✅ → Backend Implementation 🔜
> **Backend:** Java 17 / Spring Boot 3.4.4 / Spring Cloud 2024.0.1
> **Frontend:** Next.js (65 files TSX/TS đã phát triển)
> **Infrastructure:** 100% Cloud ✅

---

## 🏗️ Tổng quan tiến độ

```
████████████░░░░░░░░░░░░░░░░░░  ~20% Overall

  Infrastructure   ████████████████████  100% ✅
  Backend Logic    ██░░░░░░░░░░░░░░░░░░   10% 🔴
  Frontend UI      ██████████████░░░░░░   70% 🟡
  Integration      ░░░░░░░░░░░░░░░░░░░░    0% 🔴
  Testing          ░░░░░░░░░░░░░░░░░░░░    0% 🔴
```

---

## 📋 Deep Scan — Trạng thái từng Microservice

### Legend

| Icon | Trạng thái |
|------|------------|
| ✅ | Hoàn thành |
| 🟡 | Có scaffold nhưng chưa đầy đủ |
| 🔴 | Chưa implement |
| ⬜ | Không áp dụng |

---

### 1. `common-lib` — Shared Library

| Component | File | Trạng thái | Ghi chú |
|-----------|------|------------|---------|
| ApiResponse\<T\> | `dto/ApiResponse.java` | ✅ | `ok()`, `error()` methods |
| BaseException | `exception/BaseException.java` | ✅ | HttpStatus + errorCode |
| MessageEvent | `event/MessageEvent.java` | ✅ | Serializable, dùng cho RabbitMQ |
| JwtUtil | `security/JwtUtil.java` | 🔴 | **Thiếu!** Plan có nhưng chưa implement |

**Tiến độ: 75%** — Thiếu `JwtUtil.java` (critical cho auth flow)

---

### 2. `discovery-server` — Eureka Server (port 8761)

| Component | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Application class | ✅ | `DiscoveryServerApplication.java` |
| application.yml | ✅ | Port 8761, self-register disabled |
| @EnableEurekaServer | ✅ | Annotation có sẵn |

**Tiến độ: 100%** ✅ — Service sẵn sàng khởi chạy

---

### 3. `config-server` — Spring Cloud Config (port 8888)

| Component | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Application class | ✅ | `ConfigServerApplication.java` |
| application.yml | ✅ | Native search `classpath:/configurations` |
| @EnableConfigServer | ✅ | Annotation có sẵn |
| configurations/ | 🔴 | Directory chưa tạo (optional — services dùng local yml) |

**Tiến độ: 90%** — Service chạy được, config files là optional

---

### 4. `api-gateway` — Spring Cloud Gateway (port 8080)

| Component | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Application class | ✅ | Chỉ `@SpringBootApplication` |
| application.yml | ✅ | 5 routes (user/group/chat/ws/file) |
| GatewayConfig.java | 🔴 | Plan có, chưa implement |
| CorsConfig.java | 🔴 | Critical cho frontend CORS |
| RateLimitConfig.java | 🔴 | Redis-based rate limiting |
| JwtAuthFilter.java | 🔴 | **Critical!** JWT validation filter |
| @EnableDiscoveryClient | 🔴 | **Thiếu annotation!** |

**Tiến độ: 20%** — Framework chạy nhưng KHÔNG có security/CORS

---

### 5. `user-service` — Auth & User Management (port 8081)

| Component | File theo Plan | Trạng thái | Ghi chú |
|-----------|----------------|------------|---------|
| Application class | `UserServiceApplication.java` | ✅ | `@EnableDiscoveryClient` ✅ |
| application.yml | — | ✅ | Cloud config (Supabase) |
| **AuthController** | `controller/AuthController.java` | 🔴 | Login/Register endpoints |
| **UserController** | `controller/UserController.java` | 🔴 | Profile CRUD |
| **AuthService** | `service/AuthService.java` | 🔴 | JWT token generation |
| **UserService** | `service/UserService.java` | 🔴 | Business logic |
| **JwtService** | `service/JwtService.java` | 🔴 | Token create/validate |
| **UserRepository** | `repository/UserRepository.java` | 🔴 | JPA Repository |
| **User Entity** | `model/entity/User.java` | 🔴 | @Entity + @Version |
| **UserRole Enum** | `model/entity/UserRole.java` | 🔴 | ENUM |
| **LoginRequest** | `model/dto/LoginRequest.java` | 🔴 | DTO |
| **RegisterRequest** | `model/dto/RegisterRequest.java` | 🔴 | DTO |
| **UserResponse** | `model/dto/UserResponse.java` | 🔴 | DTO |
| **UserMapper** | `model/mapper/UserMapper.java` | 🔴 | MapStruct mapper |
| **SecurityConfig** | `config/SecurityConfig.java` | 🔴 | Spring Security config |
| **GlobalExceptionHandler** | `exception/GlobalExceptionHandler.java` | 🔴 | @ControllerAdvice |
| **UserNotFoundException** | `exception/UserNotFoundException.java` | 🔴 | Custom exception |

**Tiến độ: 10%** — CHỈ có Application class + config. **0 business logic.**

---

### 6. `group-channel-service` — Rooms & Channels (port 8082)

| Component | File theo Plan | Trạng thái |
|-----------|----------------|------------|
| Application class | `GroupChannelApplication.java` | ✅ |
| application.yml | — | ✅ |
| RoomController | `controller/RoomController.java` | 🔴 |
| ChannelController | `controller/ChannelController.java` | 🔴 |
| RoomService | `service/RoomService.java` | 🔴 |
| MembershipService | `service/MembershipService.java` | 🔴 |
| RoomRepository | `repository/RoomRepository.java` | 🔴 |
| RoomParticipantRepository | `repository/RoomParticipantRepository.java` | 🔴 |
| Room Entity | `model/entity/Room.java` | 🔴 |
| RoomParticipant Entity | `model/entity/RoomParticipant.java` | 🔴 |
| RoomRole Enum | `model/entity/RoomRole.java` | 🔴 |
| CreateRoomRequest | `model/dto/CreateRoomRequest.java` | 🔴 |
| RoomResponse | `model/dto/RoomResponse.java` | 🔴 |
| RoomEventPublisher | `event/RoomEventPublisher.java` | 🔴 |

**Tiến độ: 10%** — CHỈ có Application class + config.

---

### 7. `chat-history-service` — Message Storage (port 8083)

| Component | File theo Plan | Trạng thái |
|-----------|----------------|------------|
| Application class | `ChatHistoryApplication.java` | ✅ |
| application.yml | — | ✅ |
| MessageController | `controller/MessageController.java` | 🔴 |
| MessageService | `service/MessageService.java` | 🔴 |
| MessageRepository | `repository/MessageRepository.java` | 🔴 |
| Message Document | `model/document/Message.java` | 🔴 |
| MessageResponse | `model/dto/MessageResponse.java` | 🔴 |
| MessageEventListener | `listener/MessageEventListener.java` | 🔴 |

**Tiến độ: 10%** — CHỈ có Application class + config.

---

### 8. `messaging-service` — WebSocket Real-time (port 8084)

| Component | File theo Plan | Trạng thái |
|-----------|----------------|------------|
| Application class | `MessagingApplication.java` | ✅ | `@EnableAsync` ✅ |
| application.yml | — | ✅ |
| WebSocketConfig | `config/WebSocketConfig.java` | 🔴 |
| RabbitMQConfig | `config/RabbitMQConfig.java` | 🔴 |
| RedisConfig | `config/RedisConfig.java` | 🔴 |
| ChatWebSocketController | `controller/ChatWebSocketController.java` | 🔴 |
| ConnectionManager | `service/ConnectionManager.java` | 🔴 |
| MessageRouter | `service/MessageRouter.java` | 🔴 |
| PresenceService | `service/PresenceService.java` | 🔴 |
| WebSocketEventHandler | `handler/WebSocketEventHandler.java` | 🔴 |
| StompErrorHandler | `handler/StompErrorHandler.java` | 🔴 |
| ChatMessage DTO | `model/dto/ChatMessage.java` | 🔴 |
| TypingEvent DTO | `model/dto/TypingEvent.java` | 🔴 |

**Tiến độ: 10%** — CHỈ có Application class + config.

---

### 9. `file-service` — Object Storage (port 8085)

| Component | File theo Plan | Trạng thái |
|-----------|----------------|------------|
| Application class | `FileServiceApplication.java` | ✅ |
| application.yml | — | ✅ | `b2.*` config keys |
| FileController | `controller/FileController.java` | 🔴 |
| StorageService | `service/StorageService.java` | 🔴 |
| B2Config | `config/B2Config.java` | 🔴 |

**Tiến độ: 10%** — CHỈ có Application class + config.

---

## 📊 Bảng tổng hợp

| # | Service | Java Files | Plan Files | Implemented | Progress |
|---|---------|------------|------------|-------------|----------|
| 1 | common-lib | 3 | 4 | 3 | **75%** |
| 2 | discovery-server | 1 | 1 | 1 | **100%** ✅ |
| 3 | config-server | 1 | 1 | 1 | **90%** |
| 4 | api-gateway | 1 | 5 | 1 | **20%** |
| 5 | user-service | 1 | 17 | 1 | **10%** |
| 6 | group-channel-service | 1 | 14 | 1 | **10%** |
| 7 | chat-history-service | 1 | 8 | 1 | **10%** |
| 8 | messaging-service | 1 | 13 | 1 | **10%** |
| 9 | file-service | 1 | 5 | 1 | **10%** |
| | **TỔNG** | **11** | **~68** | **11** | **~18%** |

---

## 🎯 Recommended Next Phase: Backend Implementation

### Phase Priority (theo Dependency Order)

```mermaid
graph TD
    P0[P0: common-lib<br/>JwtUtil] --> P1A[P1A: user-service<br/>Auth + User CRUD]
    P1A --> P1B[P1B: api-gateway<br/>JWT Filter + CORS]
    P1A --> P2[P2: group-channel-service<br/>Room/Channel CRUD]
    P2 --> P3[P3: chat-history-service<br/>Message Storage]
    P3 --> P4[P4: messaging-service<br/>WebSocket + Real-time]
    P4 --> P5[P5: file-service<br/>File Upload/Download]
    
    P0 --> INF[Infrastructure fixes<br/>Eureka/Config annotations]
    
    style P0 fill:#ff6b6b,color:#fff
    style P1A fill:#ff6b6b,color:#fff
    style P1B fill:#ffa94d,color:#fff
    style P2 fill:#ffa94d,color:#fff
    style P3 fill:#69db7c,color:#fff
    style P4 fill:#69db7c,color:#fff
    style P5 fill:#4dabf7,color:#fff
    style INF fill:#ff6b6b,color:#fff
```

### Estimated File Count per Phase

| Phase | Service | Files cần tạo | Ước lượng effort |
|-------|---------|---------------|------------------|
| **P0** | common-lib + infra fixes | ~3 files | 1-2 giờ |
| **P1A** | user-service (full auth) | ~16 files | 6-8 giờ |
| **P1B** | api-gateway (JWT + CORS) | ~4 files | 2-3 giờ |
| **P2** | group-channel-service | ~13 files | 6-8 giờ |
| **P3** | chat-history-service | ~7 files | 4-5 giờ |
| **P4** | messaging-service | ~12 files | 8-10 giờ |
| **P5** | file-service | ~4 files | 2-3 giờ |
| | **TỔNG** | **~59 files** | **~30-40 giờ** |

---

## 🔴 Critical Blockers

1. **`JwtUtil.java`** thiếu trong `common-lib` → Không service nào xác thực được JWT
2. **`SecurityConfig.java`** thiếu trong `user-service` → Spring Security block tất cả requests
3. **User Entity + Repository** thiếu → Không thể đăng ký/đăng nhập
4. **API Gateway** thiếu JWT filter + CORS config → Frontend không gọi được API
5. **0/68 files** business logic đã implement → Backend chưa xử lý bất kỳ request nào

---

## ✅ Đã hoàn thành

- [x] Master Plan (`docs/plan.md`) — Kiến trúc + DB Design + Concurrency patterns
- [x] Parent POM + 9 module POMs (Spring Boot 3.4.4 + Spring Cloud 2024.0.1)
- [x] Application classes cho tất cả 9 services
- [x] application.yml configs — 100% cloud (Supabase + Atlas + Upstash + CloudAMQP + B2)
- [x] .env files cho 6 services + .env.example template
- [x] .gitignore hardened cho `.env` patterns
- [x] common-lib: ApiResponse, BaseException, MessageEvent
- [x] Frontend UI: 65 files TSX/TS (Zustand + i18n + Discord-accurate layout)
