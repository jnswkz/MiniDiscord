# 📋 Phase P1B — API Gateway: JWT Filter + CORS + Rate Limiting + Google OAuth

> **Status:** ✅ CODE HOÀN THÀNH | ⏳ CHƯA VERIFY (Cần test trên môi trường thực tế)
> **Ngày implement:** 2026-05-10

---

## 1. Overview

Phase P1B tập trung vào bảo mật hệ thống thông qua API Gateway và bổ sung thêm phương thức đăng nhập bằng Google OAuth.
- **Xác thực JWT** ở tầng Gateway (trước khi forward đến downstream services).
- **Cho phép CORS** từ frontend để xử lý request cross-origin an toàn.
- **Rate Limit** requests bằng Redis (Upstash) để chống spam (áp dụng fail-open fallback).
- **Google OAuth Login** trong `user-service`.

---

## 2. Kết quả Implementation

### Phần A: API Gateway (5 files mới/sửa)

| # | Layer | File | Chức năng | Status |
|---|-------|------|-----------|--------|
| 1 | Config | `config/CorsConfig.java` | Global CORS cho WebFlux gateway | ✅ |
| 2 | Filter | `filter/JwtAuthFilter.java` | Validate Bearer token, inject X-User-Id | ✅ |
| 3 | Filter | `filter/RateLimitFilter.java` | Redis-based rate limiting + fail-open fallback | ✅ |
| 4 | Config | `config/FilterErrorHandler.java` | Utility gửi JSON error response cho 401/429 | ✅ |
| 5 | Main | `ApiGatewayApplication.java` | Thêm `@EnableDiscoveryClient` | ✅ |

### Phần B: User Service — Google OAuth (4 files mới/sửa)

| # | Layer | File | Chức năng | Status |
|---|-------|------|-----------|--------|
| 6 | DTO | `model/dto/OAuthRequest.java` | DTO nhận `idToken` từ Frontend | ✅ |
| 7 | Service | `service/AuthService.java` | Thêm method `loginWithGoogle()` | ✅ |
| 8 | Controller | `controller/AuthController.java` | Thêm endpoint `POST /api/auth/google` | ✅ |
| 9 | Config | `pom.xml` | Thêm dependency `google-api-client` | ✅ |

### Phần C: Config & Env (3 files sửa)

| # | File | Chức năng | Status |
|---|------|-----------|--------|
| 10 | `api-gateway/application.yml` | Thêm Redis config, JWT config, rate-limit config | ✅ |
| 11 | `api-gateway/.env` | Thêm cấu hình Redis (Upstash) | ✅ |
| 12 | `user-service/.env` | Thêm `GOOGLE_CLIENT_ID` | ✅ |

### Phần D: Frontend (1 file sửa)

| # | File | Chức năng | Status |
|---|------|-----------|--------|
| 13 | `app/(auth)/login/page.tsx` | Tích hợp `@react-oauth/google` và hiển thị Google Login | ✅ |

---

## 3. Kiến trúc Gateway Flow & Google OAuth

### Kiến trúc Gateway Flow

```text
                        ┌──────────────────────────────────────────┐
  Client Request ──────►│              API GATEWAY                 │
                        │                                          │
                        │  1. CorsConfig (CORS headers)            │
                        │         │                                │
                        │  2. RateLimitFilter (Redis check)        │
                        │         │  ← 429 Too Many Requests       │
                        │         │  ← fail-open nếu Redis timeout │
                        │         │                                │
                        │  3. JwtAuthFilter (token validation)     │
                        │         │  ← 401 Unauthorized            │
                        │         │                                │
                        │  4. Add Header: X-User-Id                │
                        │         │                                │
                        │  5. Route to downstream service          │
                        └──────────┼───────────────────────────────┘
                                   ▼
                        ┌─────────────────────┐
                        │  user-service        │  ← Google OAuth endpoint ở đây
                        │  group-channel       │
                        │  chat-history        │
                        │  messaging (WS)      │
                        │  file-service        │
                        └─────────────────────┘
```

### Luồng Google OAuth

```text
Next.js (Frontend)                  API Gateway              user-service
     │                                  │                        │
     │ 1. Google popup → idToken        │                        │
     │                                  │                        │
     │ 2. POST /api/auth/google ───────►│ (whitelist, no JWT) ──►│
     │    body: { idToken: "..." }      │                        │
     │                                  │   3. Verify Google Token
     │                                  │   4. findOrCreate User │
     │                                  │   5. Generate JWT      │
     │ 6. { token, user } ◄────────────┤◄───────────────────────┤
     │                                  │                        │
     │ 7. Dùng JWT cho mọi request ────►│ (JwtAuthFilter check)  │
```

---

## 4. API Endpoints

| Method | Path | Auth | Response | Mô tả |
|--------|------|------|----------|-------|
| POST | `/api/auth/google` | ❌ Public | `ApiResponse<AuthResponse>` | Đăng nhập bằng Google ID Token |

---

## 5. Design Decisions

| Quyết định | Lý do | Review |
|------------|-------|--------|
| Rate Limit với fail-open | Chống lỗi Gateway nếu Redis timeout, không chặn người dùng do lỗi mạng | ✅ |
| Timeout Redis 200ms | Giảm latency tối đa khi truy cập cloud Redis | ✅ |
| Mở route `/api/auth/**` | Cho phép các API register, login truyền thống và Google login pass qua Gateway mà không cần JWT | ✅ |
| Google user password = "" | Tài khoản OAuth không cần sử dụng mật khẩu hệ thống, tránh lỗi BCrypt | ✅ |

---

## 6. Verification Checklist

| # | Check | Result | Ghi chú |
|---|-------|--------|---------|
| 1 | File structure (Thêm code gateway và oauth) | ✅ Pass | Code đã push vào repo |
| 2 | Cấu hình Redis Upstash cho API Gateway | ✅ Pass | Đã cấu hình trên file env và application.yml |
| 3 | Cấu hình CORS WebFlux API Gateway | ✅ Pass | Hỗ trợ cho localhost:3000 và frontend domain |
| 4 | Tích hợp thành công JWT Gateway filter | ✅ Pass | Decode header, bỏ chặn preflight và inject `X-User-Id` |
| 5 | Tích hợp rate limiting 20 req/10s | ⏳ Pending | Cần test tải |
| 6 | Tính năng đăng nhập Google ở FE & BE | ⏳ Pending | Dùng `@react-oauth/google` phía frontend và VerifyToken phía backend |

---

## 7. Runtime Test Plan (Kịch bản Test)

### Automated (Docker Compose)
```bash
cd backend
docker compose up -d --build
docker compose ps  # Tất cả healthy
```

### Manual Test Flow — Gateway Filters
1. **Kiểm tra Public route:** POST `http://localhost:8080/api/auth/register` → 201 (qua gateway, không cần JWT).
2. **Kiểm tra Lấy Token:** POST `http://localhost:8080/api/auth/login` → 200 + token.
3. **Chặn JWT Không hợp lệ:** GET `http://localhost:8080/api/users/me` (no token) → 401 JSON error (trả về JSON chứ không phải HTML nhờ `FilterErrorHandler`).
4. **JWT Hợp lệ:** GET `http://localhost:8080/api/users/me` (có Bearer token) → 200 + user data.
5. **Rate Limiting:** Spam 25 requests liên tục → request thứ 21+ → `429 Too Many Requests`.
6. **CORS Headers:** Gửi preflight `OPTIONS http://localhost:8080/api/users/me` → CORS headers xuất hiện và hợp lệ (`Access-Control-Allow-Origin: *` hoặc `localhost:3000`).

### Manual Test Flow — Google OAuth
1. Mở frontend `http://localhost:3000/login` → Click nút "Sign in with Google".
2. Chọn tài khoản Google trong popup → Frontend gọi POST API `/api/auth/google`.
3. Kiểm tra response là `200 OK` (chứa JWT nội bộ `token` và thông tin `user`).
4. Đăng xuất và đăng nhập lại bằng chính tài khoản đó → Kiểm tra tài khoản không tạo record mới trong DB (không bị duplicate id).
5. Dùng token trả về từ API Google OAuth → gọi API GET `/api/users/me` → 200 (xác nhận Gateway chấp nhận token này).

### Fail-Open Test (Redis Timeout)
1. Dừng Redis connection (đổi `REDIS_HOST` thành một tên miền không tồn tại).
2. Restart `api-gateway`.
3. Gọi API bất kỳ → request vẫn phải đi qua thành công (chiến lược fail-open hoạt động, bỏ qua Redis Error).
4. Xem log console API Gateway → Xuất hiện cảnh báo `WARN` về Redis timeout hoặc lỗi connection.

---

## 8. Dependency Graph

```text
                  common-lib (JwtUtil)
                         │
                 ┌───────┼───────────┐
                 ▼       ▼           ▼
           user-service  │     api-gateway
           (Google OAuth)│     (JWT/CORS/RateLimit)
                 │       │           │
                 ▼       ▼           ▼
           Google APIs   │     Upstash Redis
           (verify)      │     (rate limiting)
```
