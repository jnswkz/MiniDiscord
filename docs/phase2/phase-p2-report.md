# Báo Cáo Chi Tiết: Phase P2 (Group & Channel Service)

Báo cáo này phân tích chi tiết tiến độ và giải thích sâu toàn bộ mã nguồn của các file được triển khai trong Phase P2 của dự án MiniDiscord.

## 1. Đánh giá Tiến Độ Hiện Tại

Dựa trên file `phase-p2.md`, tiến độ hiện tại đang ở trạng thái:
- **Code**: Đã hoàn thành 100% logic nghiệp vụ.
- **Unit Test**: Đã hoàn thành và pass 100% (`RoomServiceTest`, `SecurityHeaderFilterTest`).
- **Cấu trúc**: Tuân thủ kiến trúc microservices, áp dụng Event-Driven Architecture với RabbitMQ, Transactional Outbox pattern (thông qua `@TransactionalEventListener`), và bảo mật chặt chẽ ở tầng API.

---

## 2. Phân Tích Mã Nguồn Chi Tiết

Dưới đây là giải thích sâu cho các thành phần code quan trọng trong `group-channel-service`.

### Phần 1: Tầng Entity & DTO (Domain Layer)

#### 1. `Room.java` & `RoomParticipant.java` & `Channel.java`
**Tác dụng:** Map các thực thể phòng chat, thành viên, và kênh chat với CSDL PostgreSQL.
- **`Room.java`:** 
  - Khai báo `@Entity`, `@Id` kiểu UUID tự sinh (`GenerationType.UUID`).
  - `@Version private Long version`: Kích hoạt cơ chế Optimistic Locking của JPA để ngăn ngừa race condition khi cập nhật thông tin phòng.
- **`RoomParticipant.java`:**
  - Định nghĩa `@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "room_id"}))`: Đảm bảo một user không thể join một phòng nhiều lần ở cấp độ CSDL.
  - Sử dụng `@Enumerated(EnumType.STRING)` cho trường `role` (`OWNER`, `ADMIN`, `MEMBER`) để dễ đọc trong CSDL.
- **`Channel.java`:**
  - Có trường `position` (`@Builder.Default private Integer position = 0;`) để sắp xếp thứ tự kênh chat trên UI.

#### 2. Các file DTO (`CreateRoomRequest.java`, `RoomResponse.java`,...)
**Tác dụng:** Chuẩn hóa dữ liệu đầu vào và đầu ra.
- Sử dụng các annotation `@NotBlank`, `@NotNull` với message validation bằng tiếng Anh (VD: `message = "Room name cannot be empty"`) tuân thủ nghiêm ngặt quy tắc không hardcode tiếng Việt.
- `RoomResponse` sử dụng nested static class `ChannelDto` để gộp thông tin các kênh chat trả về cùng một payload, giúp giảm số lần gọi API từ Frontend.

---

### Phần 2: Tầng Config, Filter & Exception

#### 3. `SecurityHeaderFilter.java`
**Tác dụng:** Tấm khiên bảo vệ nội bộ, từ chối mọi request giả mạo không thông qua API Gateway.
- Lớp này implement interface `Filter` của Jakarta Servlet.
- `@Order(Ordered.HIGHEST_PRECEDENCE)`: Đảm bảo filter này chạy đầu tiên trước khi vào Controller.
- **Logic kiểm tra:** Cho phép các request bắt đầu bằng `/actuator` (cho Healthcheck của Docker). Lấy header `X-User-Id`, nếu null hoặc rỗng thì lập tức chặn bằng lệnh `response.setStatus(HttpServletResponse.SC_UNAUTHORIZED)` và trả về JSON lỗi 401.

#### 4. `GlobalExceptionHandler.java`
**Tác dụng:** Xử lý lỗi tập trung.
- Bắt `MethodArgumentNotValidException` để trích xuất các lỗi của DTO, gom lại thành Map `errors` và truyền cho `ApiResponse.error(...)` (đã fix lỗi tương thích argument để build pass).
- Bắt `BaseException` để trả về đúng HTTP Status Code do exception quy định.

---

### Phần 3: Tầng Service (Nghiệp vụ cốt lõi)

#### 5. `RoomService.java`
**Tác dụng:** Nơi chứa logic khởi tạo phòng chat phức tạp nhất.
- **`createRoom`:** Được đánh dấu `@Transactional`. Đảm bảo chuỗi 3 hành động: Tạo Room -> Gán quyền OWNER cho người tạo -> Tạo Channel mặc định "general". Nếu 1 trong 3 lỗi, toàn bộ thao tác sẽ bị rollback.
- Tự động lấy `ownerId` từ controller (vốn được extract từ `X-User-Id` header) và gọi `eventPublisher.publishEvent()` để phát tín hiệu tạo phòng.

#### 6. `MembershipService.java`
**Tác dụng:** Xử lý việc thêm bớt thành viên và phân quyền.
- **`validateAdminOrOwner`**: Hàm kiểm tra quyền lợi tái sử dụng. Query DB xem user có nằm trong nhóm không, và Role có thỏa mãn `!= MEMBER` không. Nếu vi phạm, ném lỗi 403 Forbidden.
- **`addMember`**: Tương tự, dùng `@Transactional` và bảo vệ kỹ càng thông qua việc gọi hàm validate trên.

#### 7. `ChannelService.java`
**Tác dụng:** Quản lý các kênh chat con bên trong Room.
- Khi tạo mới một channel, service sẽ query toàn bộ channel hiện có, và set thuộc tính `position` của channel mới bằng `position` của channel cuối cùng cộng 1.

---

### Phần 4: Tầng Event-Driven (RabbitMQ)

#### 8. `RabbitMQConfig.java`
**Tác dụng:** Cấu hình kết nối và format message cho RabbitMQ.
- Đăng ký `TopicExchange` với tên `room.events`.
- Cung cấp `Jackson2JsonMessageConverter` để tự động parse Object Java thành JSON khi gửi qua MQ, thay vì gửi kiểu byte code mặc định.

#### 9. `RoomEventPublisher.java`
**Tác dụng:** Tách biệt logic gửi event khỏi logic xử lý Database.
- Thay vì gửi event trực tiếp từ `RoomService`, hệ thống dùng sự kiện nội bộ của Spring (ApplicationEvent).
- Sử dụng `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`: Đây là tính năng cốt lõi. Spring sẽ "treo" việc thực thi hàm này cho đến khi khối `@Transactional` ở `RoomService` đã thực sự **Commit thành công** vào PostgreSQL. Điều này giúp loại bỏ vĩnh viễn rủi ro "Dữ liệu ma" (Gửi event báo tạo phòng thành công, nhưng DB lại báo lỗi và rollback).

---

### Phần 5: Tầng Controller

#### 10. `RoomController.java` & `ChannelController.java`
**Tác dụng:** Điểm đón request RESTful.
- Các hàm như `createRoom` sử dụng `@RequestHeader("X-User-Id") UUID userId` để trích xuất ngay định danh user mà API Gateway đã chuyển xuống. Không cần phải decode JWT lại một lần nữa.
- Gọi tầng Service xử lý và bọc kết quả lại bằng `ApiResponse.ok(...)` của thư viện `common-lib` để trả về HTTP Status phù hợp (200 OK, 201 Created).

---

## 3. Tổng Kết Kiến Trúc Phase 2

- **Bảo mật tuyệt đối cấp độ mạng:** Docker-compose đã loại bỏ lệnh expose port thẳng ra máy host (Xóa `ports: - "8082:8082"`), kết hợp `SecurityHeaderFilter` tạo thành lớp phòng ngự 2 lớp.
- **Tính nhất quán dữ liệu:** Toàn bộ logic chéo bảng (Room - Participant - Channel) được bọc Transaction chặt chẽ.
- **Event-Driven Architecture an toàn:** Việc kết hợp `@TransactionalEventListener` đảm bảo hệ thống bất đồng bộ không bao giờ gặp lỗi inconsistency giữa DB và Message Broker.

**Trạng thái hiện tại:** Mọi dòng code đã sẵn sàng để tích hợp diện rộng thông qua End-to-End Test bằng Docker Compose.
