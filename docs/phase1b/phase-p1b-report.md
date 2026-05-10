# Báo Cáo Chi Tiết: Phase P1B (API Gateway & OAuth Integration)

Báo cáo này phân tích chi tiết tiến độ và giải thích sâu toàn bộ mã nguồn được triển khai trong Phase P1B của dự án MiniDiscord.

## 1. Đánh giá Tiến Độ Hiện Tại

Dựa trên mục tiêu của phase P1B, tiến độ hiện tại đã đạt **100%**:
- **Cấu hình API Gateway**: Đã hoàn tất các thiết lập cần thiết (Routes, CORS, Error Handling).
- **Xác thực và Bảo mật**: Đã tích hợp thành công `JwtAuthFilter` cho Gateway để kiểm tra JWT token hợp lệ và chuyển tiếp `X-User-Id` tới các downstream services.
- **Giới hạn tốc độ (Rate Limiting)**: Triển khai Redis Rate Limiting với cơ chế fallback (fail-open) trong trường hợp Redis gặp sự cố, đảm bảo gateway luôn sống sót.
- **OAuth 2.0 (Google)**: Tích hợp xác thực Google SignIn phía Backend trong `AuthService`, kiểm tra ID token và cấp phát JWT nội bộ thành công.
- **Microservices Deployment**: Đã tách riêng cấu hình docker cho Frontend và Backend, giảm tải RAM cho môi trường development. Sửa lỗi trùng lặp cấu hình CORS ở tầng `user-service`.

---

## 2. Phân Tích Mã Nguồn Chi Tiết (Line-by-Line)

### Phần 1: P1B - API Gateway

#### 1. `ApiGatewayApplication.java` (`com.discordmini.gateway`)
**Tác dụng:** Entry point của Spring Cloud Gateway. Đã được bổ sung `@EnableDiscoveryClient` để Gateway tự động đăng ký với Eureka Server.

#### 2. `JwtAuthFilter.java` (`com.discordmini.gateway.filter`)
**Tác dụng:** Bộ lọc trung tâm của Gateway, chặn tất cả request trước khi định tuyến.
- **`filter(...)`**: Lấy `Authorization` header. Nếu request yêu cầu xác thực nhưng không có token hoặc token không hợp lệ, trả về 401 Unauthorized.
- Tích hợp `JwtUtil` từ thư viện `common-lib` (đã test kỹ trong P1A) để parse và validate token.
- Sử dụng `ServerHttpRequest.Builder` để mutate request, thêm một header `X-User-Id` từ token payload, giúp các Microservice phía sau biết request này thuộc về user nào mà không cần tự parse JWT lại.

#### 3. `CorsConfig.java` (`com.discordmini.gateway.config`)
**Tác dụng:** Xử lý Cross-Origin Resource Sharing (CORS) cho toàn bộ hệ thống.
- Tập trung hóa cấu hình CORS ở API Gateway. Cấu hình cho phép các phương thức (GET, POST, PUT, DELETE, OPTIONS, PATCH), các header và origin `http://localhost:3000`.
- Thiết lập `UrlBasedCorsConfigurationSource` để áp dụng cấu hình này cho mọi endpoint `/**`.

#### 4. `FilterErrorHandler.java` (`com.discordmini.gateway.config`)
**Tác dụng:** Xử lý thống nhất các ngoại lệ phát sinh từ Gateway Filters (như 401 khi JWT sai, 429 khi Rate Limit).
- Trả về JSON theo đúng định dạng `ApiResponse` của hệ thống.
- Bổ sung `JavaTimeModule` cho `ObjectMapper` để giải quyết lỗi serialization kiểu `LocalDateTime`, giúp Gateway trả về thời gian chuẩn ISO mà không bị lỗi `500 Internal Server Error` ẩn.

#### 5. `RateLimitConfig.java` (`com.discordmini.gateway.config`)
**Tác dụng:** Khai báo cấu hình Request Rate Limiting dùng Redis.
- Khai báo KeyResolver `userKeyResolver` dựa trên IP address (`RemoteAddressResolver`).
- Cơ chế fail-open: Khi Redis down (timeout), Gateway vẫn cho qua thay vì block request.

#### 6. `RateLimitFilter.java` (`com.discordmini.gateway.filter`)
**Tác dụng:** Chặn spam/DDoS.
- Tùy chỉnh bộ đếm Redis, chặn các client vượt quá cấu hình `replenishRate` và `burstCapacity`.

---

### Phần 2: P1B - User Service (OAuth & Fixes)

#### 7. `AuthService.java` (`com.discordmini.user.service`)
**Tác dụng:** Xử lý xác thực người dùng bao gồm tính năng mới: Login bằng Google.
- Thêm method `loginWithGoogle(String credential)`: Sử dụng `GoogleIdTokenVerifier` từ thư viện Google API Client.
- Xác thực tính hợp lệ của token do Google cấp dựa trên `GOOGLE_CLIENT_ID`.
- Kiểm tra xem user có tồn tại dựa vào email từ Google Payload. Nếu chưa có, tiến hành **tạo mới tài khoản tự động** (JIT - Just In Time provisioning) với username ngẫu nhiên và password random (không dùng tới).
- Sinh ra JWT nội bộ của MiniDiscord và trả về cho client.

#### 8. `SecurityConfig.java` (`com.discordmini.user.config`)
**Tác dụng:** Sửa lỗi kiến trúc liên quan đến Double CORS.
- Ở phiên bản trước, `user-service` tự định nghĩa một bean CORS, kết hợp với CORS của API Gateway đã làm header `Access-Control-Allow-Origin` bị dán 2 lần vào response, gây lỗi trình duyệt.
- Đã loại bỏ hoàn toàn `.cors(...)` ở tầng này (`AbstractHttpConfigurer::disable`), nhường quyền quản lý toàn vẹn cho Gateway.

#### 9. Tests (`com.discordmini.user.service.AuthServiceTest` & `com.discordmini.gateway.filter.JwtAuthFilterTest`)
**Tác dụng:** Đảm bảo hệ thống đạt chuẩn test coverage.
- Sửa lỗi assertion sai class Exception (`BaseException` thay vì `BadCredentialsException` trong `AuthServiceTest`).
- Cập nhật secret base64 hợp lệ cho `JwtAuthFilterTest` tránh lỗi thư viện JJWT decode.

---

## 3. Tổng Kết
Phase P1B đã xây dựng một nền móng vững chắc cho hệ thống Microservices:
- API Gateway hoạt động đúng chuẩn một rào chắn bảo vệ, xử lý Auth, Rate Limit và CORS tại một điểm duy nhất.
- Hỗ trợ Google OAuth tạo sự tiện lợi tối đa cho người dùng cuối.
- Việc phân chia Docker compose độc lập chứng tỏ khả năng debug và quản lý tài nguyên linh hoạt của kiến trúc.

**Bước tiếp theo:** Hệ thống đã sẵn sàng cho Phase P2 (Group & Channels Service), nơi sẽ bắt đầu xử lý logic nhóm chat và áp dụng Event-Driven Architecture với RabbitMQ.
