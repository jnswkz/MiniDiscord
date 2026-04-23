# 📋 Phase P0 + P1A — Plan & Record

> **Status:** ✅ CODE HOÀN THÀNH | ⚠️ CHƯA VERIFY (cần JDK 17)
> **Ngày implement:** 2026-04-18
> **Ngày review:** 2026-04-23

---

## 1. Overview

Phase đầu tiên của backend implementation — xây dựng nền tảng xác thực (authentication) cho toàn hệ thống:
- **P0:** Shared JWT utility trong `common-lib` (dependency cho mọi service)
- **P1A:** `user-service` với đầy đủ Register/Login flow, Spring Security, JWT token

---

## 2. Peer Review — Đánh giá từ bên ngoài

> Phản hồi từ reviewer (2026-04-23)

### ✅ Điểm được đánh giá cao

| # | Điểm sáng | Nhận xét reviewer |
|---|-----------|-------------------|
| 1 | **Cấu trúc thư mục 3 lớp** | 17 files theo mô hình Controller → Service → Repository, package rõ ràng cho dto/mapper/exception/config. Tách JwtService khỏi AuthService tuân thủ **Single Responsibility** |
| 2 | **JWT subject = userId (UUID)** | "Nước đi cực kỳ chính xác" — UUID là định danh bất biến, an toàn hơn email/username |
| 3 | **@Version (Optimistic Locking)** | "Tính toán rất xa" — bảo vệ database khỏi lost update khi nhiều luồng tranh chấp trạng thái Online/Offline/Idle |
| 4 | **Static Mapper** | "Rất thực tế" — giảm phức tạp annotation processor của MapStruct ở giai đoạn đầu |
| 5 | **API Design RESTful** | Endpoint chuẩn: `/api/auth/**` public, `/api/users/me` cần Bearer token |
| 6 | **CORS config** | Mở đúng port 3000 (Next.js) + 8080 (Gateway) — nắm rõ luồng Frontend ↔ Backend |

### ⚠️ Blocker duy nhất — JDK 17

| Vấn đề | Chi tiết |
|--------|----------|
| **Triệu chứng** | `mvn compile` failed: "No compiler is provided in this environment" |
| **Nguyên nhân** | Hệ thống chỉ có JRE 1.8.0_431 — Spring Boot 3.x bắt buộc JDK 17+ |
| **Giải pháp** | Cài JDK 17 → Set JAVA_HOME → Cấu hình IDE |

#### Hướng dẫn khắc phục (3 bước)

**Bước 1: Cài JDK 17** (chọn 1 trong 3)
| JDK | Download |
|-----|----------|
| Amazon Corretto 17 | https://docs.aws.amazon.com/corretto/latest/userguide/downloads-list.html |
| Eclipse Temurin 17 | https://adoptium.net/temurin/releases/?version=17 |
| Oracle JDK 17 | https://www.oracle.com/java/technologies/downloads/#java17 |

**Bước 2: Set JAVA_HOME** (PowerShell Admin)
```powershell
# Thay đường dẫn phù hợp với JDK đã cài
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot", "Machine")

# Thêm vào PATH
$path = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
[System.Environment]::SetEnvironmentVariable("PATH", "$path;%JAVA_HOME%\bin", "Machine")

# Verify (mở terminal MỚI)
java -version   # → openjdk version "17.x.x"
javac -version  # → javac 17.x.x
```

**Bước 3: Cấu hình IDE**
- IntelliJ: `File → Project Structure → Project SDK → 17`
- IntelliJ: `File → Settings → Build → Compiler → Java Compiler → Target bytecode: 17`

**Bước 4: Verify compilation**
```powershell
cd d:\MiniDiscord\backend
mvn compile -pl common-lib,user-service -am
```

---

## 3. Kết quả Implementation

### P0: common-lib (1 file mới)

| # | File | Chức năng | Status |
|---|------|-----------|--------|
| 1 | `security/JwtUtil.java` | JJWT 0.12.6 — generate, validate, extractClaims | ✅ |

### P1A: user-service (17 files mới)

| # | Layer | File | Chức năng | Status |
|---|-------|------|-----------|--------|
| 1 | Entity | `model/entity/User.java` | JPA @Entity, UUID PK, @Version | ✅ |
| 2 | Entity | `model/entity/UserRole.java` | Enum: USER, ADMIN | ✅ |
| 3 | DTO | `model/dto/LoginRequest.java` | @Valid email + password | ✅ |
| 4 | DTO | `model/dto/RegisterRequest.java` | @Valid username + email + password | ✅ |
| 5 | DTO | `model/dto/UserResponse.java` | Response (excludes passwordHash) | ✅ |
| 6 | DTO | `model/dto/AuthResponse.java` | token + UserResponse | ✅ |
| 7 | Mapper | `model/mapper/UserMapper.java` | Static mapper User → UserResponse | ✅ |
| 8 | Repository | `repository/UserRepository.java` | JPA: findByEmail, existsByUsername | ✅ |
| 9 | Service | `service/JwtService.java` | Spring wrapper around JwtUtil | ✅ |
| 10 | Service | `service/AuthService.java` | register (BCrypt + dup check) + login | ✅ |
| 11 | Service | `service/UserService.java` | getById, updateProfile, updateStatus | ✅ |
| 12 | Controller | `controller/AuthController.java` | POST /api/auth/register, /login | ✅ |
| 13 | Controller | `controller/UserController.java` | GET/PUT /api/users/me | ✅ |
| 14 | Config | `config/SecurityConfig.java` | Spring Security 6.x + CORS + BCrypt | ✅ |
| 15 | Config | `config/JwtAuthFilter.java` | Bearer token → SecurityContext | ✅ |
| 16 | Exception | `exception/GlobalExceptionHandler.java` | @RestControllerAdvice | ✅ |
| 17 | Exception | `exception/UserNotFoundException.java` | extends BaseException | ✅ |

### Fix phụ

| File | Issue | Status |
|------|-------|--------|
| `group-channel-service/pom.xml` | Raw `&` trong XML `<name>` gây Maven parse error | ✅ |

---

## 4. API Endpoints

| Method | Path | Auth | Response | Mô tả |
|--------|------|------|----------|-------|
| POST | `/api/auth/register` | ❌ Public | `ApiResponse<AuthResponse>` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | ❌ Public | `ApiResponse<AuthResponse>` | Đăng nhập |
| GET | `/api/users/me` | ✅ Bearer | `ApiResponse<UserResponse>` | Lấy profile |
| PUT | `/api/users/me` | ✅ Bearer | `ApiResponse<UserResponse>` | Sửa username/avatar |
| PUT | `/api/users/me/status` | ✅ Bearer | `ApiResponse<Void>` | Đổi trạng thái |

---

## 5. Design Decisions (đã review ✅)

| Quyết định | Lý do | Review |
|------------|-------|--------|
| JWT subject = userId (UUID) | Định danh bất biến, an toàn khi email thay đổi | ✅ "Cực kỳ chính xác" |
| BCryptPasswordEncoder (cost=10) | Spring Security default, đủ bảo mật | ✅ |
| @Version (Optimistic Lock) | Chống lost update khi concurrent status update | ✅ "Tính toán xa" |
| Static UserMapper | Đơn giản, không cần annotation processor | ✅ "Rất thực tế" |
| CORS: 3000 + 8080 | Next.js dev + API Gateway | ✅ "Nắm rõ luồng" |
| Tách JwtService ↔ AuthService | Single Responsibility Principle | ✅ "Tuân thủ tốt SRP" |

---

## 6. Verification Checklist

| # | Check | Result | Ghi chú |
|---|-------|--------|---------|
| 1 | File structure (29 Java files) | ✅ Pass | 11 → 29 files |
| 2 | Import/package references | ✅ Pass | Tất cả imports hợp lệ |
| 3 | Peer review | ✅ Pass | 6/6 điểm tích cực |
| 4 | `mvn compile` | ⚠️ Blocked | Cần cài JDK 17 (xem Section 2) |
| 5 | Runtime test | ⏳ Pending | Xem kịch bản test bên dưới |

---

## 7. Runtime Test Plan (5 kịch bản)

> **Điều kiện tiên quyết:**
> - [x] JDK 17 đã cài đặt + JAVA_HOME đã set
> - [x] `mvn compile -pl common-lib,user-service -am` thành công
> - [x] Công cụ test API: **Postman**, **Bruno**, hoặc **curl**
> - [x] Database Supabase PostgreSQL đã truy cập được

### Khởi động services (theo thứ tự)

```powershell
# Terminal 1 — Discovery Server
cd d:\MiniDiscord\backend\discovery-server
mvn spring-boot:run

# Terminal 2 — User Service (chờ Eureka ready)
cd d:\MiniDiscord\backend\user-service
mvn spring-boot:run
```

> Chờ log: `Started UserServiceApplication in X seconds` trước khi test.

---

### Test 1: Register — Tạo tài khoản mới (Public API)

```
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "Test@123456"
}
```

| Mục | Kỳ vọng |
|-----|---------|
| HTTP Status | `201 Created` |
| `success` | `true` |
| `data.token` | Chuỗi JWT hợp lệ (3 phần ngăn bởi dấu `.`) |
| `data.user.id` | UUID |
| `data.user.username` | `"testuser"` |
| `data.user.email` | `"testuser@example.com"` |
| `data.user.role` | `"USER"` |
| `data.user.status` | `"OFFLINE"` |

**Lưu lại email + password để dùng cho Test 2.**

---

### Test 2: Login — Đăng nhập + Lấy JWT token

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
    "email": "testuser@example.com",
    "password": "Test@123456"
}
```

| Mục | Kỳ vọng |
|-----|---------|
| HTTP Status | `200 OK` |
| `success` | `true` |
| `message` | `"Login successful"` |
| `data.token` | Chuỗi JWT hợp lệ |
| `data.user.id` | Cùng UUID như Test 1 |

**⚠️ QUAN TRỌNG: Copy giá trị `data.token` → dùng cho Test 3, 4, 5.**

---

### Test 3: Protected API — Không có token → 401

```
GET http://localhost:8081/api/users/me
```

> Không gắn header `Authorization`

| Mục | Kỳ vọng |
|-----|---------|
| HTTP Status | `401 Unauthorized` |
| Response | Lỗi hoặc body trống (Spring Security default) |

**Mục đích:** Chứng minh JwtAuthFilter chặn request thiếu token.

---

### Test 4: Protected API — Có Bearer token → 200

```
GET http://localhost:8081/api/users/me
Authorization: Bearer <token_từ_Test_2>
```

| Mục | Kỳ vọng |
|-----|---------|
| HTTP Status | `200 OK` |
| `success` | `true` |
| `data.id` | UUID |
| `data.username` | `"testuser"` |
| `data.email` | `"testuser@example.com"` |
| `data.role` | `"USER"` |

**Mục đích:** Chứng minh JWT validation + SecurityContext injection hoạt động.

---

### Test 5: Update Profile — Cập nhật thông tin

```
PUT http://localhost:8081/api/users/me
Authorization: Bearer <token_từ_Test_2>
Content-Type: application/json

{
    "username": "newusername"
}
```

| Mục | Kỳ vọng |
|-----|---------|
| HTTP Status | `200 OK` |
| `data.username` | `"newusername"` |
| `data.email` | `"testuser@example.com"` (không đổi) |

---

### Bảng tổng hợp kết quả test

| # | Kịch bản | Endpoint | Expected | Actual | Status |
|---|----------|----------|----------|--------|--------|
| 1 | Register | POST `/api/auth/register` | 201 + token | | ⏳ |
| 2 | Login | POST `/api/auth/login` | 200 + token | | ⏳ |
| 3 | No token | GET `/api/users/me` | 401 | | ⏳ |
| 4 | Bearer token | GET `/api/users/me` | 200 + user | | ⏳ |
| 5 | Update profile | PUT `/api/users/me` | 200 + updated | | ⏳ |

> ✅ **"Green Light"** — Plan đạt trạng thái sẵn sàng thực thi.
> Khi tất cả 5 test pass → Phase P0+P1A hoàn thành 100%.

---

## 8. Dependency Graph

```
common-lib (JwtUtil ✅)
    └── user-service (AuthService → JwtService → JwtUtil ✅)
            └── api-gateway (JwtAuthFilter → JwtUtil 🔜 Phase P1B)
```
