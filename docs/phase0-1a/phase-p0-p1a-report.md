# Báo Cáo Chi Tiết: Phase P0 & P1A (Authentication & User Service)

Báo cáo này phân tích chi tiết tiến độ và giải thích sâu toàn bộ mã nguồn của 18 file được triển khai trong Phase P0 (common-lib) và P1A (user-service) của dự án MiniDiscord.

## 1. Đánh giá Tiến Độ Hiện Tại

Dựa trên file `phase-p0-p1a.md`, tiến độ hiện tại đang ở trạng thái:
- **Code**: Đã hoàn thành 100% (18 file mới được tạo ở cả common-lib và user-service).
- **Cấu trúc**: Tuân thủ tốt thiết kế 3 lớp (Controller - Service - Repository), áp dụng các best practices bảo mật như UUID định danh, Optimistic Locking, BCrypt hash.
- **Tình trạng Compile/Build**: Đang bị **BLOCKED** do môi trường máy tính chưa cài đặt JDK 17 (chỉ có JRE 1.8), dẫn đến `mvn compile` thất bại. Cần hoàn tất cài đặt JDK 17 và set `JAVA_HOME` để tiếp tục.

---

## 2. Phân Tích Mã Nguồn Chi Tiết (Line-by-Line)

Dưới đây là giải thích sâu cho từng dòng code quan trọng của tất cả các file trong phase này.

### Phần 1: P0 - common-lib

#### 1. `JwtUtil.java` (`com.discordmini.common.security`)
**Tác dụng:** Cung cấp các hàm utility dùng chung cho toàn bộ microservices để xử lý JWT (Tạo, Giải mã, Kiểm tra tính hợp lệ).

- **Dòng 14-17:** Khai báo class và 2 biến immutable: `signingKey` (khóa ký mã hóa) và `expirationMs` (thời gian sống của token).
- **Dòng 19-22 (Constructor):** Nhận vào `secret` (chuỗi Base64) và giải mã bằng `Decoders.BASE64.decode()`, sau đó dùng `Keys.hmacShaKeyFor()` để tạo mã bí mật an toàn (HMAC-SHA) cho việc ký JWT.
- **Dòng 24-32 (`generateToken`):**
  - Dùng `Jwts.builder()` của thư viện JJWT.
  - `.claims(extraClaims)`: Gắn thêm các payload tùy chỉnh (ví dụ: role, email).
  - `.subject(subject)`: Đặt chủ thể của token (thường là User ID kiểu UUID).
  - `.issuedAt(...)` & `.expiration(...)`: Thiết lập thời gian tạo và thời gian hết hạn (hiện tại + `expirationMs`).
  - `.signWith(signingKey)`: Ký token bằng khóa HMAC-SHA bí mật.
  - `.compact()`: Đóng gói thành chuỗi JWT string.
- **Dòng 38-48 (`extract...`):** Các hàm phụ trợ lấy `Subject`, `Expiration` bằng cách truyền tham chiếu phương thức (`Claims::getSubject`) vào hàm `extractClaim`.
- **Dòng 50-57 (`isTokenValid`):** Kiểm tra token có khớp với subject dự kiến và chưa hết hạn hay không. Bắt `JwtException` để trả về `false` nếu token bị can thiệp trái phép.
- **Dòng 63-69 (`extractAllClaims`):** Parse chuỗi token string, xác minh bằng `signingKey`. Nếu chữ ký bị sửa, hàm `verifyWith()` sẽ ném lỗi ngay lập tức.

---

### Phần 2: P1A - user-service (Tầng Entity & DTO)

#### 2. `User.java` (`com.discordmini.user.model.entity`)
**Tác dụng:** Map class Java với bảng `users` trong cơ sở dữ liệu qua JPA/Hibernate.

- **Dòng 11-18:** Các annotations `@Entity` (báo JPA đây là thực thể), `@Table(name="users")`, và các annotation Lombok (`@Getter`, `@Setter`, `@Builder`,...) để tự động sinh getter/setter/constructor.
- **Dòng 20-22:** `@Id` đánh dấu khóa chính. `@GeneratedValue(strategy = GenerationType.UUID)` giúp Hibernate tự tạo UUID ngẫu nhiên và an toàn cho người dùng mới.
- **Dòng 24-34:** Các cột `username`, `email` (`unique = true` chống trùng lặp), `passwordHash` lưu mật khẩu đã băm, `avatarUrl`.
- **Dòng 36-38:** `status` có độ dài tối đa 20, mặc định là `"OFFLINE"` qua `@Builder.Default`.
- **Dòng 40-43:** `role` dùng Enum. `@Enumerated(EnumType.STRING)` ép Hibernate lưu dạng String (`"USER"`, `"ADMIN"`) thay vì số nguyên (0, 1), giúp DB dễ đọc hơn.
- **Dòng 45-51:** `@CreationTimestamp` và `@UpdateTimestamp` tự động lưu thời điểm Insert và Update bản ghi. Cột `created_at` không được update (`updatable=false`).
- **Dòng 56-58:** `isActive` đánh dấu tài khoản có bị khóa hay không (Soft Delete/Ban).
- **Dòng 60-61:** `@Version private Long version;` là một nước đi cực kỳ xuất sắc. Nó áp dụng **Optimistic Locking**: Khi có 2 request đồng thời cập nhật User, Hibernate sẽ so sánh version. Request thứ 2 sẽ bị từ chối (ném ra OptimisticLockException), ngăn chặn hiện tượng "Lost Update" (ghi đè mất dữ liệu).

#### 3. `UserRole.java` (`com.discordmini.user.model.entity`)
**Tác dụng:** Enum chứa các role hợp lệ.
- **Dòng 3-6:** Định nghĩa 2 quyền cơ bản là `USER` và `ADMIN`.

#### 4 & 5. `LoginRequest.java` và `RegisterRequest.java` (`model.dto`)
**Tác dụng:** Data Transfer Object để nhận dữ liệu JSON từ Frontend và Validate.
- Dùng `@NotBlank` (không được rỗng), `@Email` (phải đúng định dạng chuẩn), `@Size(min=6, max=100)` (kiểm soát độ dài). Khi Controller nhận các request này với tag `@Valid`, Spring sẽ tự chạy validation. Nếu sai, nó ném lỗi và `GlobalExceptionHandler` sẽ bắt lại để trả lỗi 400.

#### 6 & 7. `UserResponse.java` và `AuthResponse.java` (`model.dto`)
**Tác dụng:** DTO trả về Frontend.
- `UserResponse`: Ẩn đi `passwordHash`, chỉ chứa những thông tin an toàn.
- `AuthResponse`: Chứa chuỗi `token` JWT và `UserResponse` đi kèm (dùng khi login/register thành công, giúp Frontend vừa có token vừa có thông tin hiển thị UI).

#### 8. `UserMapper.java` (`model.mapper`)
**Tác dụng:** Chuyển đổi Entity `User` thành DTO `UserResponse`.
- **Dòng 10-21:** Static function dùng `Builder` pattern để copy từng field một cách thủ công nhưng an toàn, đảm bảo password hash tuyệt đối không bao giờ rò rỉ.

---

### Phần 3: P1A - user-service (Tầng Repository & Exception)

#### 9. `UserRepository.java` (`repository`)
**Tác dụng:** Interface thao tác với DB bảng `users`.
- **Dòng 11:** Kế thừa `JpaRepository<User, UUID>`. Spring Data JPA sẽ tự tạo implementation lúc runtime, cho phép gọi `save()`, `findById()`, v.v.
- **Dòng 13-19:** Định nghĩa các custom query: `findByEmail`, `existsByEmail`, `existsByUsername`. Hibernate tự động dịch tên hàm ra câu lệnh SQL như `SELECT count(*) FROM users WHERE email = ?`.

#### 10 & 11. `GlobalExceptionHandler.java` và `UserNotFoundException.java` (`exception`)
**Tác dụng:** Đón tất cả lỗi ném ra từ Controller/Service và format thành JSON chuẩn.
- **Dòng 16 (`@RestControllerAdvice`):** Chỉ định class này là một AOP (Aspect-Oriented Programming), lắng nghe mọi exception.
- **Dòng 19-24 (`handleBaseException`):** Bắt các lỗi domain (lỗi logic nghiệp vụ dự án).
- **Dòng 26-31 (`handleBadCredentials`):** Bắt lỗi đăng nhập sai email/mật khẩu, trả về 401 Unauthorized thay vì 500.
- **Dòng 33-51 (`handleValidation`):** Khi DTO vi phạm `@NotBlank` hoặc `@Email`, nó lấy toàn bộ `FieldError`, map thành JSON dạng key-value (VD: `{"email": "Invalid email format"}`) và trả về HTTP 400 Bad Request.

---

### Phần 4: P1A - user-service (Tầng Service)

#### 12. `JwtService.java` (`service`)
**Tác dụng:** Bean của Spring chịu trách nhiệm đọc Config và khởi tạo `JwtUtil`.
- **Dòng 14-18 (Constructor Injection):** Đọc giá trị `jwt.secret` và `jwt.expiration` từ `application.yml` bằng `@Value`. Truyền cho `JwtUtil`.
- **Dòng 20-25 (`generateToken`):** Bọc lại logic sinh token, nhét sẵn cấu trúc claims gồm `email` và `role` để các service khác khi giải mã token không cần gọi lại DB.

#### 13. `AuthService.java` (`service`)
**Tác dụng:** Logic nghiệp vụ chính cho việc Đăng ký và Đăng nhập.
- **Dòng 25-26 (`@Transactional`):** Đảm bảo tính toàn vẹn. Nếu xảy ra lỗi giữa chừng, mọi thao tác ghi DB sẽ bị rollback.
- **Dòng 27-32:** Kiểm tra email/username đã tồn tại chưa bằng `userRepository.exists...`. Nếu có, ném `BaseException` (HTTP 409).
- **Dòng 34-40:** Tạo Entity `User`. Quan trọng nhất là `passwordEncoder.encode(request.getPassword())` dùng BCrypt để băm mật khẩu 1 chiều, sau đó `save(user)`.
- **Dòng 54-76 (`login`):**
  - Tìm User theo email. Không thấy -> ném lỗi sai mật khẩu.
  - Kiểm tra `!user.getIsActive()` -> ném lỗi nếu tài khoản bị khóa.
  - Chạy `passwordEncoder.matches(nhập_vào, hash_trong_db)` để verify. Tuyệt đối không hash password nhập vào để so sánh vì BCrypt mỗi lần hash ra một chuỗi khác nhau nhờ cơ chế Salt. Phải dùng `.matches()`.
  - Sinh JWT và bọc vào `AuthResponse`.

#### 14. `UserService.java` (`service`)
**Tác dụng:** Các logic xoay quanh profile user.
- **Dòng 23-27 (`getUserById`):** Dùng UUID lấy từ JWT để query DB. Nếu không có, ném `UserNotFoundException`. Sau đó bọc qua Mapper.
- **Dòng 29-47 (`updateProfile`):** Cho phép đổi Username và Avatar. Đặc biệt ở Dòng 34-39, nếu đổi Username thì phải check xem Username mới đã bị ai lấy chưa để tránh DuplicateKey DB.
- **Dòng 49-57 (`updateStatus`):** Cho phép cập nhật trạng thái hoạt động và `LastSeenAt`. `save(user)` ở đây sẽ kích hoạt `@Version` trong entity để tránh conflict dữ liệu nếu gọi dồn dập.

---

### Phần 5: P1A - user-service (Tầng Config & Controller)

#### 15. `JwtAuthFilter.java` (`config`)
**Tác dụng:** Middleware (Filter) chặn từng request gửi đến để kiểm tra token.
- **Dòng 23 (`OncePerRequestFilter`):** Đảm bảo filter chỉ chạy 1 lần cho mỗi HTTP Request.
- **Dòng 34-39:** Lấy header `Authorization`. Nếu không có hoặc không bắt đầu bằng `Bearer ` -> Bỏ qua cho đi tiếp (đến Spring Security, nó sẽ từ chối nếu route đó cần bảo vệ).
- **Dòng 41:** Cắt lấy chuỗi token (bỏ 7 ký tự `Bearer `).
- **Dòng 44-55:** Lấy `userId`. Nếu chưa có ai đăng nhập trong Context hiện tại -> Xác minh token.
  - Token hợp lệ -> Lấy User từ DB.
  - Khởi tạo `UsernamePasswordAuthenticationToken` gán `userId` làm Principal và gán Role lấy từ DB (VD: `ROLE_USER`).
  - Gắn vào `SecurityContextHolder`. Các Controller sau đó dùng hàm `auth.getName()` sẽ lấy được chính `userId` này.
- **Dòng 58-60 (`catch`):** Nếu token rác, hết hạn, hay sai chữ ký, bắt lỗi rồi lờ đi. Người dùng sẽ bị coi là chưa xác thực.

#### 16. `SecurityConfig.java` (`config`)
**Tác dụng:** Tấm khiên bảo vệ hệ thống của Spring Security.
- **Dòng 30-40 (`securityFilterChain`):**
  - `.csrf(disable)`: Tắt chống CSRF vì ta dùng token, không dùng cookie-session (nên không bị CSRF).
  - `.cors(...)`: Kích hoạt CORS từ config.
  - `.sessionManagement(...STATELESS)`: Báo Spring không tạo HTTP Session, mỗi request đứng độc lập.
  - `.authorizeHttpRequests(...)`: Quy định route `/api/auth/**` được truy cập public (permitAll). Còn lại (`anyRequest()`) bắt buộc phải có context hợp lệ (`authenticated()`).
  - `.addFilterBefore(...)`: Chèn `JwtAuthFilter` của chúng ta đứng trước `UsernamePasswordAuthenticationFilter` mặc định của Spring để chặn và parse token sớm.
- **Dòng 43-46:** Cung cấp bean `BCryptPasswordEncoder` để `AuthService` sử dụng hash mật khẩu.
- **Dòng 48-60 (`corsConfigurationSource`):** Cho phép các origin `localhost:3000` (Frontend) và `localhost:8080` (Gateway) được gọi API bằng mọi Method (GET, POST...).

#### 17. `AuthController.java` (`controller`)
**Tác dụng:** Cửa ngõ gọi API đăng ký, đăng nhập.
- **Dòng 17-20:** `@RestController` = `@Controller` + `@ResponseBody` (để trả về JSON). Route mặc định là `/api/auth`.
- **Dòng 24-31 (`register`):** Hứng POST. Dùng `@Valid` để ép dữ liệu chạy qua luật validation trong `RegisterRequest`. Trả về 201 Created. `ApiResponse` là chuẩn giao tiếp thống nhất cho hệ thống.
- **Dòng 33-38 (`login`):** Hứng POST. Trả về 200 OK.

#### 18. `UserController.java` (`controller`)
**Tác dụng:** Cửa ngõ lấy và sửa thông tin user hiện tại (chỉ được gọi khi có token).
- **Dòng 21-26 (`getCurrentUser`):** Injection biến `Authentication auth`. Lấy ra chuỗi `userId` (được Filter nhét vào lúc nãy) bằng `auth.getName()`. Chuyển về UUID và gọi service lấy dữ liệu.
- **Dòng 28-39 (`updateProfile`):** Hứng PUT `/me`, update thông tin và trả về.
- **Dòng 41-48 (`updateStatus`):** Hứng PUT `/me/status`. Cập nhật trạng thái trực tuyến của user.

---

## 3. Tổng Kết
Bộ mã nguồn triển khai đạt chất lượng cao:
- **Bảo mật mạnh:** UUID chống lộ ID tăng tiến, BCrypt băm mật khẩu, JWT ký HMAC an toàn, CORS hạn chế khắt khe origin, tắt Session chống CSRF.
- **Khả năng mở rộng (Scalability):** Dùng JWT Stateless thay vì Session bám dính (Sticky Session) giúp có thể scale ngang (chạy nhiều bản sao) của user-service mà không cần chia sẻ bộ nhớ.
- **Độ tin cậy dữ liệu:** Bắt trọn vẹn lỗi, validation đầu vào kỹ lượng, phòng chống concurrent update hiệu quả qua Hibernate `@Version`.

**Next step:** Cài đặt JDK 17 cho môi trường, compile lại (`mvn compile -pl common-lib,user-service -am`) và chạy thử 5 kịch bản test như được liệt kê trong file plan.
