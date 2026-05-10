# Phase P2 — Groups & Channels Service

> **Service:** `group-channel-service` (port 8082)
> **Database:** Supabase PostgreSQL (ap-northeast-1) + CloudAMQP (RabbitMQ)
> **Mục tiêu:** CRUD Room/Channel, quản lý thành viên, phân quyền, event-driven notifications

---

## 1. Overview

### Hiện trạng

`group-channel-service` hiện chỉ có:
- ✅ `GroupChannelApplication.java` — entry point + `@EnableDiscoveryClient`
- ✅ `application.yml` — cấu hình Supabase PG + CloudAMQP + Eureka
- ✅ `pom.xml` — dependencies: web, JPA, validation, AMQP, eureka-client, common-lib
- ✅ `.env` — DB_URL, RabbitMQ credentials
- ✅ `Dockerfile` — multi-stage build sẵn sàng
- ✅ `docker-compose.yml` — service đã cấu hình (profile `full`)
- ✅ Gateway route — `/api/rooms/**`, `/api/channels/**` → `lb://group-channel-service`
- 🔴 **Không có bất kỳ Entity/Controller/Service nào** → 0% business logic

### Mục tiêu Phase P2

Sau khi hoàn thành, hệ thống sẽ:
1. **CRUD Room** — Tạo/Sửa/Xóa phòng chat (GROUP hoặc DM), tự động tạo channel "general" khi tạo room
2. **CRUD Channel** — Tạo/Sửa/Xóa channel trong room (TEXT hoặc VOICE)
3. **Quản lý thành viên** — Thêm/Xóa/Cập nhật role thành viên trong room
4. **Phân quyền** — OWNER > ADMIN > MEMBER (chỉ OWNER/ADMIN mới thao tác được)
5. **Nhận userId từ Gateway** — Thông qua header `X-User-Id` (đã implement ở P1B), reject 401 nếu thiếu header
6. **Event Publishing (RabbitMQ)** — Phát event **sau khi DB commit** (`@TransactionalEventListener`) để tránh Dual-Write inconsistency

---

## 2. Kiến trúc & Luồng dữ liệu

```
Frontend → API Gateway (JWT validation + X-User-Id)
                ↓ (chỉ qua Docker internal network)
        group-channel-service (:8082 — KHÔNG expose ra host)
                │
        ┌───────┴───────┐
        │ PostgreSQL    │ (Supabase ap-northeast-1)
        │ rooms         │
        │ room_participants │
        │ channels      │
        └───────┬───────┘
                │ @TransactionalEventListener(AFTER_COMMIT)
        ┌───────┴───────┐
        │ RabbitMQ      │ (CloudAMQP)
        │ room.events   │
        └───────────────┘
```

**Nguyên tắc quan trọng:**
- Service này **KHÔNG** tự validate JWT. Gateway đã làm → service nhận `X-User-Id` header.
- Service này **KHÔNG** cấu hình CORS. Gateway xử lý tập trung.
- Service này **KHÔNG** tự quản lý bảng `users`. Nó chỉ lưu `owner_id` / `user_id` dưới dạng UUID reference (không FK — khác DB instance).
- Service này **KHÔNG** expose port ra host trong Docker. Chỉ Gateway (8080) được expose để chống X-User-Id spoofing.

---

## 3. Phân tích Trade-offs Kiến trúc (Theo Review)

### Q1: Dangling Data — User bị xóa nhưng vẫn là OWNER

**Vấn đề:** Bảng `rooms` lưu `owner_id` nhưng `users` nằm ở DB khác. Nếu user bị xóa → room mồ côi.

**Giải pháp đã chọn:** Event-Driven (Async). `user-service` sẽ phát event `user.deleted` lên RabbitMQ. `group-channel-service` lắng nghe → chuyển OWNER cho ADMIN khác hoặc xóa room.

> ⚠️ **Chưa implement trong P2.** Comment `// TODO: P_FINAL — Handle user.deleted event` trong code. Sẽ xử lý ở Phase hoàn thiện.

### Q2: Dual-Write — DB commit rồi nhưng RabbitMQ gửi thất bại

**Vấn đề:** Ghi DB xong, gửi event thất bại → hệ thống bất đồng bộ.

**Giải pháp đã chọn:** `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`. Spring chỉ gửi event lên RabbitMQ **SAU KHI** transaction DB đã commit thành công. Tránh gửi event cho dữ liệu chưa tồn tại.

### Q3: X-User-Id Spoofing — Hacker gọi trực tiếp port 8082

**Vấn đề:** Hacker bypass Gateway → gọi thẳng vào service với header giả.

**Giải pháp:**
1. **Docker:** Xóa `ports: - "8082:8082"` khỏi docker-compose → service chỉ accessible qua internal network.
2. **SecurityHeaderFilter:** Nếu request không có `X-User-Id` header → trả 401 ngay lập tức, không cho vào Controller.

### Q4: Enum Role vs Dynamic Role Table

**Quyết định:** Giữ Enum cứng `OWNER | ADMIN | MEMBER`. Đáp ứng 90% nhu cầu (giống Telegram/Zalo). Custom roles là scope quá lớn cho dự án hiện tại.

---

## 4. Database Schema (PostgreSQL — Supabase ap-northeast-1)

### 4.1 Bảng `rooms`

| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID PK | `gen_random_uuid()` |
| name | VARCHAR(100) | NOT NULL |
| description | VARCHAR(500) | nullable |
| icon_url | VARCHAR(500) | nullable |
| type | VARCHAR(20) | NOT NULL, CHECK `GROUP\|DM` |
| owner_id | UUID | NOT NULL (plain UUID — **không FK**, khác DB) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | auto |
| is_active | BOOLEAN | DEFAULT TRUE |

### 4.2 Bảng `room_participants`

| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID | NOT NULL |
| room_id | UUID FK | NOT NULL → `rooms.id` ON DELETE CASCADE |
| role | VARCHAR(20) | NOT NULL, CHECK `OWNER\|ADMIN\|MEMBER` |
| joined_at | TIMESTAMP | DEFAULT NOW() |
| muted_until | TIMESTAMP | nullable |
| UNIQUE | (user_id, room_id) | Prevent duplicate |

### 4.3 Bảng `channels`

| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID PK | `gen_random_uuid()` |
| room_id | UUID FK | NOT NULL → `rooms.id` ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| type | VARCHAR(20) | NOT NULL, CHECK `TEXT\|VOICE` |
| position | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |

> **Lưu ý kiến trúc:** `owner_id` không dùng FK vì bảng `users` ở Supabase instance khác (ap-southeast-2 vs ap-northeast-1). Đây là trade-off chấp nhận được cho microservices isolation (xem Q1).

---

## 5. API Endpoints

### 5.1 Room APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/rooms` | ✅ | Tạo room mới → auto tạo OWNER role + channel "general" |
| `GET` | `/api/rooms` | ✅ | Lấy danh sách room mà user tham gia |
| `GET` | `/api/rooms/{roomId}` | ✅ | Chi tiết room (kèm danh sách channels + member count) |
| `PUT` | `/api/rooms/{roomId}` | ✅ OWNER/ADMIN | Cập nhật tên/mô tả/icon room |
| `DELETE` | `/api/rooms/{roomId}` | ✅ OWNER | Xóa room (soft-delete) |

### 5.2 Member APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/rooms/{roomId}/members` | ✅ | Danh sách thành viên |
| `POST` | `/api/rooms/{roomId}/members` | ✅ OWNER/ADMIN | Thêm thành viên (ngay lập tức, không có invite) |
| `PUT` | `/api/rooms/{roomId}/members/{userId}` | ✅ OWNER | Thay đổi role |
| `DELETE` | `/api/rooms/{roomId}/members/{userId}` | ✅ OWNER/ADMIN | Xóa thành viên / Rời nhóm (self) |

### 5.3 Channel APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/rooms/{roomId}/channels` | ✅ OWNER/ADMIN | Tạo channel |
| `GET` | `/api/rooms/{roomId}/channels` | ✅ | Danh sách channels (sorted by position) |
| `PUT` | `/api/channels/{channelId}` | ✅ OWNER/ADMIN | Sửa channel |
| `DELETE` | `/api/channels/{channelId}` | ✅ OWNER/ADMIN | Xóa channel (phải giữ ≥ 1 channel) |

---

## 6. File Plan (17 files mới)

### 6.1 Tầng Entity & Enum (5 files)

```
model/entity/
├── Room.java              # @Entity rooms — UUID, name, description, type, ownerId, @Version
├── RoomParticipant.java   # @Entity room_participants — userId, roomId, role
└── Channel.java           # @Entity channels — roomId, name, type, position
model/enums/
├── RoomType.java          # Enum GROUP, DM
└── RoomRole.java          # Enum OWNER, ADMIN, MEMBER
```

### 6.2 Tầng DTO (6 files)

```
model/dto/
├── CreateRoomRequest.java     # @Valid name, type, description (optional)
├── UpdateRoomRequest.java     # name, description, iconUrl (all optional)
├── RoomResponse.java          # Room info + channel list + member count
├── AddMemberRequest.java      # userId (UUID)
├── ChannelRequest.java        # name, type (TEXT/VOICE)
└── MemberResponse.java        # userId, role, joinedAt
```

### 6.3 Tầng Repository (3 files)

```
repository/
├── RoomRepository.java              # JpaRepository<Room, UUID>
├── RoomParticipantRepository.java   # findByUserId, findByRoomId, existsByUserIdAndRoomId
└── ChannelRepository.java           # findByRoomIdOrderByPosition, countByRoomId
```

### 6.4 Tầng Service (3 files)

```
service/
├── RoomService.java           # CRUD Room + auto-create "general" channel + ownership checks
├── MembershipService.java     # Join/Leave/Role management + permission validation (GROUP only)
└── ChannelService.java        # CRUD Channel within a room + min-1-channel constraint
```

**Logic nghiệp vụ quan trọng (theo Review):**
- `RoomService.createRoom()` → Sau khi save Room → auto insert OWNER role → auto create Channel("general", TEXT) → publish `room.created` event
- `MembershipService.leaveRoom()` → Chỉ áp dụng cho room type GROUP. DM room sẽ xử lý logic "hide" ở phase sau
- Mọi event publishing dùng `@TransactionalEventListener(phase = AFTER_COMMIT)` để đảm bảo DB đã commit trước khi gửi

### 6.5 Tầng Controller (2 files)

```
controller/
├── RoomController.java        # Room + Member endpoints
└── ChannelController.java     # Channel endpoints
```

### 6.6 Tầng Exception (2 files)

```
exception/
├── GlobalExceptionHandler.java  # @RestControllerAdvice (pattern từ user-service)
└── RoomNotFoundException.java   # extends BaseException
```

### 6.7 Config & Event (3 files)

```
config/
├── RabbitMQConfig.java            # Exchange + Queue declarations
└── SecurityHeaderFilter.java      # ⚡ STRICT: Reject 401 nếu thiếu X-User-Id header
event/
└── RoomEventPublisher.java        # @TransactionalEventListener(AFTER_COMMIT) → RabbitMQ
```

---

## 7. Nguyên tắc Phân Quyền

```
┌──────────────────────────────────────────────────────────────┐
│ Action                │ OWNER │ ADMIN │ MEMBER │ Ghi chú     │
├───────────────────────┼───────┼───────┼────────┼─────────────┤
│ Update Room Info      │  ✅   │  ✅   │   ❌   │             │
│ Delete Room           │  ✅   │  ❌   │   ❌   │ soft-delete │
│ Add Member            │  ✅   │  ✅   │   ❌   │ instant     │
│ Remove Member         │  ✅   │  ✅*  │   ❌   │ *chỉ MEMBER │
│ Change Role           │  ✅   │  ❌   │   ❌   │             │
│ Create Channel        │  ✅   │  ✅   │   ❌   │             │
│ Delete Channel        │  ✅   │  ✅   │   ❌   │ min 1       │
│ Leave Room (GROUP)    │  ❌** │  ✅   │   ✅   │             │
│ Leave Room (DM)       │  —    │  —    │   —    │ P2: skip    │
│ View Rooms/Members    │  ✅   │  ✅   │   ✅   │             │
└───────────────────────┴───────┴───────┴────────┴─────────────┘

*  ADMIN chỉ xóa được MEMBER, không xóa được ADMIN/OWNER khác
** OWNER không thể rời room — phải chuyển OWNER cho người khác trước
   DM room không có khái niệm Leave (sẽ implement "Hide" ở phase sau)
```

---

## 8. RabbitMQ Events (Dual-Write Safe)

Exchange: `room.events` (topic)

**Cơ chế gửi event:** `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`
→ Đảm bảo event **CHỈ** gửi lên RabbitMQ sau khi transaction DB đã commit thành công.
→ Nếu DB rollback → event không bao giờ gửi → tránh dữ liệu ma (phantom events).

| Routing Key | Payload | Consumer dự kiến |
|-------------|---------|-------------------|
| `room.created` | `{ roomId, ownerId, name, type }` | messaging-service (chuẩn bị topic) |
| `room.deleted` | `{ roomId }` | messaging-service (xóa topic) |
| `member.added` | `{ roomId, userId, role }` | messaging-service (subscribe user) |
| `member.removed` | `{ roomId, userId }` | messaging-service (unsubscribe user) |

> **TODO (Phase cuối):** Thêm listener cho event `user.deleted` từ `user-service` để xử lý OWNER bị xóa tài khoản.

---

## 9. Bảo mật: Chống X-User-Id Spoofing

### 9.1 Docker-level (Tầng hạ tầng)

```yaml
# docker-compose.yml — KHÔNG expose port 8082 ra host
group-channel-service:
  # ports:             ← XÓA HOÀN TOÀN DÒNG NÀY
  #   - "8082:8082"    ← Service chỉ truy cập qua internal Docker network
  expose:
    - "8082"           ← Chỉ visible cho các container khác trong cùng network
```

### 9.2 Application-level (SecurityHeaderFilter)

```java
// Filter này chạy TRƯỚC mọi Controller
// Nếu request KHÔNG CÓ header X-User-Id → 401 Unauthorized ngay lập tức
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeaderFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        HttpServletRequest request = (HttpServletRequest) req;
        String userId = request.getHeader("X-User-Id");

        if (userId == null || userId.isBlank()) {
            HttpServletResponse response = (HttpServletResponse) res;
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Missing X-User-Id header\"}");
            return; // CHẶN — không cho vào Controller
        }

        chain.doFilter(req, res);
    }
}
```

---

## 10. Unit Test Plan

### 10.1 RoomServiceTest
- `createRoom_Success` — Tạo room, assert: OWNER role created + channel "general" created
- `createRoom_EmptyName_ThrowsValidation` — Validation failed
- `createRoom_AutoGeneralChannel` — Verify channel "general" TEXT tự động được tạo
- `getRoomsByUser_Success` — Trả danh sách room user tham gia
- `deleteRoom_NotOwner_ThrowsForbidden` — Chỉ OWNER mới xóa được

### 10.2 MembershipServiceTest
- `addMember_Success` — Thêm member mới
- `addMember_AlreadyExists_ThrowsConflict` — Duplicate membership
- `removeMember_ByAdmin_Success` — Admin xóa member
- `removeMember_AdminRemoveAdmin_ThrowsForbidden` — Admin không xóa được admin
- `changeRole_ByOwner_Success` — Đổi role thành công
- `changeRole_ByMember_ThrowsForbidden` — Member không có quyền
- `leaveRoom_OwnerBlocked` — OWNER không thể rời nhóm

### 10.3 ChannelServiceTest
- `createChannel_Success` — Tạo channel TEXT
- `createChannel_NotAdmin_ThrowsForbidden` — Không phải OWNER/ADMIN
- `deleteChannel_LastChannel_ThrowsBadRequest` — Room phải có ít nhất 1 channel

### 10.4 SecurityHeaderFilterTest
- `request_WithoutXUserId_Returns401` — Thiếu header → 401
- `request_WithXUserId_PassesThrough` — Có header → cho qua

---

## 11. Verification Plan

### 11.1 Unit Test
```bash
cd backend/group-channel-service
mvn clean test
```

### 11.2 Integration Test (Docker)
```bash
cd backend
docker compose up --build discovery-server user-service api-gateway group-channel-service
```

### 11.3 API Test (curl)
```bash
# Tạo room (auto tạo channel "general")
curl -X POST http://localhost:8080/api/rooms \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","type":"GROUP"}'

# Lấy danh sách rooms
curl -X GET http://localhost:8080/api/rooms \
  -H "Authorization: Bearer <JWT>"

# Thêm member
curl -X POST http://localhost:8080/api/rooms/{roomId}/members \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<target-uuid>"}'
```

---

## 12. Thứ tự triển khai (Task Order)

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| 1 | Entity + Enum | Room, RoomParticipant, Channel, RoomRole, RoomType | — |
| 2 | Repository | RoomRepository, RoomParticipantRepository, ChannelRepository | Step 1 |
| 3 | DTO | CreateRoomRequest, UpdateRoomRequest, RoomResponse, AddMemberRequest, ChannelRequest, MemberResponse | Step 1 |
| 4 | Config | SecurityHeaderFilter (**strict 401**), RabbitMQConfig | — |
| 5 | Exception | GlobalExceptionHandler, RoomNotFoundException | — |
| 6 | Service | RoomService (+ auto "general"), MembershipService (GROUP only), ChannelService | Step 1-5 |
| 7 | Event | RoomEventPublisher (`@TransactionalEventListener(AFTER_COMMIT)`) | Step 4, 6 |
| 8 | Controller | RoomController, ChannelController | Step 6-7 |
| 9 | Docker | Xóa `ports` expose, dùng `expose` only | — |
| 10 | Unit Test | RoomServiceTest, MembershipServiceTest, ChannelServiceTest, SecurityHeaderFilterTest | Step 6-8 |
| 11 | E2E | Build + test từ Gateway (qua internal network) | Step 8-10 |

---

## 13. Liên kết với Gateway (Đã sẵn sàng)

Gateway route đã cấu hình từ P1B:
```yaml
- id: group-channel-service
  uri: lb://group-channel-service
  predicates:
    - Path=/api/rooms/**, /api/channels/**
```

`JwtAuthFilter` đã tự động gắn header `X-User-Id` cho mọi request authenticated → `group-channel-service` chỉ cần đọc header này qua `SecurityHeaderFilter`.

---

## 14. Quyết định thiết kế đã chốt (Từ Review)

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| Q1 | Dangling Data (OWNER bị xóa) | Event-driven async, defer đến phase cuối | Tránh coupling giữa services |
| Q2 | Dual-Write (DB + RabbitMQ) | `@TransactionalEventListener(AFTER_COMMIT)` | Đảm bảo consistency mà không cần Outbox pattern phức tạp |
| Q3 | X-User-Id Spoofing | Xóa port expose + Filter strict 401 | Defense-in-depth (2 lớp bảo vệ) |
| Q4 | Enum vs Dynamic Roles | Giữ Enum cứng (OWNER/ADMIN/MEMBER) | Đáp ứng 90% use case, tránh over-engineering |
| R1 | Default Channel | Auto tạo "general" TEXT khi createRoom | UX chuẩn Discord — room luôn có chỗ chat |
| R2 | DM Leave Logic | Skip trong P2, chỉ xử lý GROUP | DM cần logic "Hide" (is_visible), defer |
| R3 | SecurityHeaderFilter strictness | Reject 401 ngay nếu thiếu X-User-Id | Chống truy cập trái phép |
