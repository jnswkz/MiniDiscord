# Hướng Dẫn Kiểm Thử Tự Động (Test Guide) - Phase 1B

Tài liệu này hướng dẫn chi tiết cách chạy và diễn giải các Testcase cho các thành phần Gateway và User Service, tuân thủ nguyên tắc "Clean Code" và "Testing Pyramid" đã đề ra trong `GEMINI.md`.

## 1. Mục Tiêu Kiểm Thử
- Đảm bảo tính toàn vẹn của mã nguồn trước khi deploy hoặc chuyển sang phase tiếp theo.
- Xác minh các edge case (Lỗi nhập liệu, sai token, lỗi hệ thống) được handle một cách graceful (Trả về JSON có ý nghĩa thay vì stack trace).
- Cam kết không có code rác, các lỗi cấu hình (như secret key sai định dạng) đã được loại bỏ.

## 2. Môi trường Yêu Cầu
- Java JDK 17
- Maven 3.8+
- Docker (Tùy chọn, để test E2E)

---

## 3. Hướng Dẫn Chạy Test Cho User Service

User service chịu trách nhiệm về Authentication và OAuth.

### 3.1 Chạy Unit Tests

Chạy lệnh sau tại thư mục `backend/user-service`:
```bash
mvn clean test
```

### 3.2 Các kịch bản Test Chính (AuthServiceTest)

Các test được đặt trong `com.discordmini.user.service.AuthServiceTest`:

- **`login_Success()`**: Giả lập thông tin đăng nhập đúng. Cần assert kết quả trả về `AuthResponse` chứa JWT.
- **`login_UserNotFound_ThrowsException()`**: Giả lập truyền vào một email không tồn tại. Xác nhận `BadCredentialsException` được ném ra.
- **`login_InvalidPassword_ThrowsException()`**: Giả lập password không khớp với hash BCrypt trong database. Xác nhận ném `BadCredentialsException`.
- **`login_InactiveUser_ThrowsException()`**: Giả lập đăng nhập tài khoản bị khóa (`isActive = false`). Kiểm tra ném `BaseException` với thông báo phù hợp.

> **Lưu ý (Theo lỗi đã sửa):** Trước đây test bị fail do cấu hình mock ném `BaseException` chung chung. Quy tắc: *Mọi kịch bản Invalid Credentials (dù là user not found hay sai password) đều phải trả về `BadCredentialsException` theo chuẩn Spring Security để chống User Enumeration Attack.*

---

## 4. Hướng Dẫn Chạy Test Cho API Gateway

API Gateway chịu trách nhiệm định tuyến, JWT Filtering.

### 4.1 Chạy Unit Tests

Chạy lệnh sau tại thư mục `backend/api-gateway`:
```bash
mvn clean test
```

### 4.2 Các kịch bản Test Chính (JwtAuthFilterTest)

Các test được đặt trong `com.discordmini.gateway.filter.JwtAuthFilterTest`:

- **`testFilter_ValidToken_AllowsRequest()`**: Mock một chuỗi token hợp lệ do `JwtUtil` tạo ra. Xác nhận `chain.filter()` được gọi (Request được cho phép đi tiếp), đồng thời kiểm tra header `X-User-Id` được gắn vào request gốc.
- **`testFilter_MissingToken_RejectsRequest()`**: Không gửi header `Authorization`. Xác nhận phương thức trả về mã HTTP 401 (Unauthorized) thông qua `FilterErrorHandler`.
- **`testFilter_InvalidToken_RejectsRequest()`**: Gửi token giả, token hết hạn hoặc token có định dạng sai. Xác nhận request bị chặn và trả về lỗi 401.

> **Lưu ý (Theo lỗi đã sửa):** Trong Unit Test của JwtAuthFilter, biến `JWT_SECRET` giả lập phải là **chuỗi Base64 hợp lệ đủ độ dài** (ví dụ: chuỗi 64 ký tự đã mã hóa). Nếu truyền chuỗi thuần túy như "dummy_secret_key", JJWT library sẽ ném `DecodingException`.

---

## 5. Hướng Dẫn Kích Hoạt Script Final Checks (Theo GEMINI.md)

Như yêu cầu trong protocol `GEMINI.md`, trước khi kết thúc một Phase, bạn có thể chạy các công cụ tự động kiểm tra dự án.

Nếu có script Python trong `.agent/scripts/`, hãy dùng lệnh:
```bash
python .agent/scripts/checklist.py .
```

Trong hệ thống Backend Java thuần túy, bạn sử dụng lệnh maven bao quát:
```bash
mvn clean verify
```
Lệnh này sẽ chạy:
1. Compile code.
2. Chạy toàn bộ Unit Tests (Surefire Plugin).
3. Package application thành file `.jar`.
4. (Nếu có) Chạy Integration tests (Failsafe Plugin).

Nếu kết quả terminal hiển thị `BUILD SUCCESS`, codebase của bạn đã vượt qua toàn bộ quy trình kiểm thử.

---

## 6. Lời Khuyên Dành Cho Các Developer

1. **AAA Pattern**: Tất cả testcase đều viết theo cấu trúc Arrange - Act - Assert.
2. **Không kết nối DB thật**: Trong Unit Test, luôn luôn dùng `@Mock` và `@InjectMocks` (Mockito) để giả lập Repository (như `UserRepository`). Không yêu cầu bật DB Docker khi chạy `mvn test`.
3. **Cập nhật Test**: Nếu trong tương lai thêm tính năng như Two-Factor Authentication, hãy viết test cho tính năng đó trước (Test-Driven Development) rồi mới viết logic nghiệp vụ.
