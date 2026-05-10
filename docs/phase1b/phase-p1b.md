# 📋 Phase P1B — API Gateway: JWT Filter + CORS + Rate Limiting + Google OAuth

> **Status:** 🔜 CHƯA BẮT ĐẦU | **Ưu tiên:** Critical
> **Mục tiêu:** Biến API Gateway thành cổng bảo mật duy nhất — xác thực JWT, kiểm soát CORS, giới hạn request rate. Đồng thời bổ sung xác thực Google OAuth ở user-service.
> **Dependency:** P0 (common-lib JwtUtil) ✅, P1A (user-service) ✅, Docker Compose ✅
> **Review Status:** 🟢 Đã cập nhật theo [reply.md](file:///e:/UIT/MiniDiscord/reply.md)

---

## 1. Overview

### Vấn đề hiện tại

API Gateway hiện chỉ có:
- ✅ `ApiGatewayApplication.java` — bare-bones, thiếu `@EnableDiscoveryClient`
- ✅ `application.yml` — 5 routes đã cấu hình (user/group/chat/ws/file)
- ✅ `.env` — JWT_SECRET + EUREKA_URL
- 🔴 **Không có JWT validation** → mọi request đều pass qua
- 🔴 **Không có CORS config** → frontend bị block
- 🔴 **Không có Rate Limiting** → dễ bị spam/DDoS
- 🔴 **Không có Google OAuth** → chỉ đăng nhập bằng email/password

### Mục tiêu Phase P1B

Sau khi hoàn thành, hệ thống sẽ:
1. **Xác thực JWT** ở tầng Gateway (trước khi forward đến downstream services)
2. **Cho phép CORS** từ frontend (localhost:3000 dev + production domain)
3. **Rate Limit** requests bằng Redis (Upstash) để chống spam — **có Redis timeout fallback (fail-open)**
4. **Truyền userId** qua header `X-User-Id` để downstream services biết ai gọi
5. **Google OAuth Login** — Frontend lấy Google ID Token → user-service verify → cấp JWT nội bộ

---

## 2. Tech Stack & Dependencies

### API Gateway (hiện có)

| Dependency trong pom.xml | Dùng cho |
|--------------------------|----------|
| `spring-cloud-starter-gateway` | WebFlux-based gateway (reactive) |
| `spring-cloud-starter-netflix-eureka-client` | Service discovery |
| `spring-boot-starter-data-redis-reactive` | Rate limiting (Redis reactive) |
| `common-lib` | JwtUtil, ApiResponse, BaseException |

> ⚠️ **LƯU Ý QUAN TRỌNG:** Spring Cloud Gateway dùng **WebFlux (reactive)**, KHÔNG phải Spring MVC.
> Tất cả filter phải dùng `GatewayFilter` / `GlobalFilter`, KHÔNG dùng `OncePerRequestFilter`.

### User Service (cần bổ sung cho Google OAuth)

| Dependency mới | Dùng cho |
|----------------|----------|
| `google-api-client:2.2.0` | Verify Google ID Token server-side |

---

## 3. Kiến trúc Gateway Flow

```
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

```
Next.js (Frontend)                  API Gateway              user-service
     │                                  │                        │
     │ 1. Google popup → idToken        │                        │
     │                                  │                        │
     │ 2. POST /api/auth/google ───────►│ (whitelist, no JWT) ──►│
     │    body: { idToken: "..." }      │                        │
     │                                  │                        │
     │                                  │   3. GoogleIdTokenVerifier.verify()
     │                                  │      → email, name, picture
     │                                  │                        │
     │                                  │   4. findOrCreate User │
     │                                  │   5. Generate JWT      │
     │                                  │                        │
     │ 6. { token, user } ◄────────────┤◄───────────────────────┤
     │                                  │                        │
     │ 7. Dùng JWT cho mọi request ────►│ (JwtAuthFilter check) │
```

---

## 4. Files cần tạo / sửa

### Phần A: API Gateway (4 files mới + 2 files sửa)

| # | File | Chức năng | Ước lượng |
|---|------|-----------|-----------| 
| 1 | `config/CorsConfig.java` | Global CORS cho WebFlux gateway | 15 phút |
| 2 | `filter/JwtAuthFilter.java` | GlobalFilter — validate Bearer token, inject X-User-Id | 30 phút |
| 3 | `filter/RateLimitFilter.java` | GlobalFilter — Redis-based rate limiting + **fail-open fallback** | 30 phút |
| 4 | `config/FilterErrorHandler.java` | Utility gửi JSON error response cho 401/429 | 15 phút |
| 5 | `ApiGatewayApplication.java` | Thêm `@EnableDiscoveryClient` | 2 phút |
| 6 | `application.yml` | Thêm Redis config, JWT config, rate-limit config | 10 phút |

### Phần B: User Service — Google OAuth (4 files mới/sửa)

| # | File | Chức năng | Ước lượng |
|---|------|-----------|-----------| 
| 7 | `model/dto/OAuthRequest.java` | DTO nhận `idToken` từ Frontend | 5 phút |
| 8 | `service/AuthService.java` | Thêm method `loginWithGoogle()` | 20 phút |
| 9 | `controller/AuthController.java` | Thêm endpoint `POST /api/auth/google` | 5 phút |
| 10 | `user-service/pom.xml` | Thêm dependency `google-api-client` | 2 phút |

### Phần C: Config & Env (3 files sửa)

| # | File | Chức năng | Ước lượng |
|---|------|-----------|-----------| 
| 11 | `api-gateway/.env` | Thêm Redis (Upstash) vars | 2 phút |
| 12 | `user-service/.env` | Thêm `GOOGLE_CLIENT_ID` | 2 phút |
| 13 | `docker-compose.yml` | Cập nhật env cho api-gateway (Redis) | 5 phút |

---

## 5. Task Breakdown chi tiết

### Task 1: Fix `ApiGatewayApplication.java`

- **INPUT:** Hiện tại chỉ có `@SpringBootApplication`
- **OUTPUT:** Thêm `@EnableDiscoveryClient`
- **VERIFY:** Annotation có mặt trong source

---

### Task 2: `config/CorsConfig.java` — CORS Configuration

**INPUT:** Frontend ở `localhost:3000` bị CORS block

**OUTPUT:** WebFlux CorsWebFilter bean

```java
// Pseudo-code
@Configuration
public class CorsConfig {
    @Bean
    public CorsWebFilter corsWebFilter() {
        // Allowed origins: localhost:3000 (dev), production domain
        // Allowed methods: GET, POST, PUT, DELETE, OPTIONS
        // Allowed headers: *, Authorization, Content-Type
        // Allow credentials: true
        // Max age: 3600s
    }
}
```

**VERIFY:** OPTIONS preflight request trả về đúng CORS headers

> ⚠️ Dùng `CorsWebFilter` (WebFlux), KHÔNG dùng `CorsConfigurationSource` (MVC)

---

### Task 3: `filter/JwtAuthFilter.java` — JWT Validation

**INPUT:** Request có header `Authorization: Bearer <token>`

**OUTPUT:** GlobalFilter thực hiện:
1. Kiểm tra route có cần auth không (whitelist: `/api/auth/**`, `/actuator/**`)
2. Extract Bearer token từ `Authorization` header
3. Validate token bằng `JwtUtil` (từ common-lib)
4. Inject `X-User-Id` header vào request đi xuống downstream
5. Return `401 Unauthorized` nếu token invalid/missing

```java
// Pseudo-code
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {
    
    private final JwtUtil jwtUtil;
    private final List<String> openPaths = List.of("/api/auth/");
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1. Check if path is open (no auth needed)
        // 2. Extract Authorization header
        // 3. Validate JWT via jwtUtil.extractSubject() + isTokenExpired()
        // 4. Mutate request: add X-User-Id header
        // 5. Continue chain
    }
    
    @Override
    public int getOrder() { return -100; } // Run before other filters
}
```

**Auth Whitelist (không cần JWT):**

| Path Pattern | Lý do |
|-------------|-------|
| `/api/auth/**` | Register + Login + Google OAuth (chưa có token) |
| `/actuator/**` | Health check, monitoring |
| `/ws/**` | WebSocket upgrade (auth xử lý riêng trong messaging-service) |

> ✅ **Review đã xác nhận:** Path `/api/auth/google` nằm trong whitelist `/api/auth/**` → Gateway tự động cho phép Google OAuth request đi qua mà không cần sửa code filter.

**VERIFY:**
- Request không có token → `401 {"success": false, "message": "Missing token"}`
- Request có token hợp lệ → Forward + header `X-User-Id: <uuid>`
- Request có token hết hạn → `401 {"success": false, "message": "Token expired"}`

---

### Task 4: `filter/RateLimitFilter.java` — Rate Limiting + Fail-Open Fallback

**INPUT:** Mọi request qua Gateway

**OUTPUT:** GlobalFilter dùng Redis (Upstash) để:
1. Key pattern: `rate:api:{userId}` hoặc `rate:api:{clientIP}` (nếu chưa auth)
2. Sliding window: **20 requests / 10 giây** (cho API chung)
3. Return `429 Too Many Requests` nếu vượt limit

> [!IMPORTANT]
> **Cải tiến từ Review:** Do Upstash Redis chạy trên cloud, có thể gặp độ trễ mạng (network latency). Cần cấu hình:
> - **Redis command timeout:** 200ms (nếu Redis không phản hồi trong 200ms → bỏ qua)
> - **Fail-open strategy:** Nếu Redis timeout hoặc unavailable → **cho phép request đi qua** (không block user vì lỗi Redis)
> - Ghi log `WARN` khi xảy ra fail-open để monitoring phát hiện sớm

```java
// Pseudo-code — sử dụng ReactiveRedisTemplate (đã có dependency)
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {
    
    private final ReactiveRedisTemplate<String, String> redis;
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1. Get userId from X-User-Id header (set by JwtAuthFilter)
        //    or clientIP if unauthenticated
        // 2. Redis key: "rate:api:{identifier}"
        // 3. INCR + EXPIRE (atomic)
        // 4. If count > limit → 429
        // 5. Add response headers: X-RateLimit-Remaining, X-RateLimit-Limit
        // 6. *** FAIL-OPEN: .onErrorResume() → log WARN, chain.filter() ***
    }
    
    @Override
    public int getOrder() { return -90; } // Run after JwtAuthFilter
}
```

**Redis Timeout Config (application.yml):**
```yaml
spring:
  data:
    redis:
      timeout: 200ms  # Command timeout — fail-open nếu vượt
```

**VERIFY:**
- 20 requests trong 10 giây → OK
- Request thứ 21 → `429 {"success": false, "message": "Rate limit exceeded"}`
- Response headers có `X-RateLimit-Remaining`
- **Tắt Redis** → request vẫn đi qua bình thường (fail-open) + log WARN xuất hiện

---

### Task 5: `config/FilterErrorHandler.java` — Error Response Handler

**INPUT:** Filter chain throw exception (401, 429)

**OUTPUT:** Utility class để filter gửi JSON error response (không phải HTML)

```java
// Pseudo-code
public class FilterErrorHandler {
    public static Mono<Void> sendError(ServerWebExchange exchange, 
                                        HttpStatus status, 
                                        String message, 
                                        String errorCode) {
        // Set content-type: application/json
        // Write ApiResponse.error() as JSON body
        // Set HTTP status
    }
}
```

**VERIFY:** Tất cả error responses từ gateway đều là JSON, không phải HTML

---

### Task 6: Cập nhật `application.yml` & `.env`

**INPUT:** Hiện tại chỉ có routes + eureka

**OUTPUT:** Thêm:

```yaml
# Thêm vào application.yml hiện tại:

spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 200ms              # ← Review: fail-open timeout
      ssl:
        enabled: ${REDIS_SSL:false}

jwt:
  secret: ${JWT_SECRET:default-secret-change-me}

gateway:
  rate-limit:
    max-requests: 20
    window-seconds: 10
```

**Cập nhật `api-gateway/.env`:**
```
# Thêm Redis (Upstash) — dùng chung instance với messaging-service
REDIS_HOST=up-primate-97930.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=gQAAAAAAAX6KAAIncDIyMTY4MmFmNmVjYmI0YjBhYTlhMGU1MDZiNWViODM0ZHAyOTc5MzA
REDIS_SSL=true
```

**Cập nhật `docker-compose.yml`:**
Thêm env override cho `api-gateway` container.

**VERIFY:** Gateway đọc được Redis config từ env vars

---

### Task 7: Google OAuth — `model/dto/OAuthRequest.java` (user-service)

```java
@Data
public class OAuthRequest {
    @NotBlank(message = "Token không được để trống")
    private String idToken;
}
```

---

### Task 8: Google OAuth — `AuthService.loginWithGoogle()` (user-service)

**Luồng xử lý:**
1. Nhận `idToken` từ Frontend
2. Dùng `GoogleIdTokenVerifier` (server-side) verify token với Google servers
3. Nếu hợp lệ → extract `email`, `name`, `picture` từ payload
4. Tìm User theo email → Nếu chưa có → Auto-register (tạo User mới, **passwordHash = ""** vì OAuth user không cần password)
5. Cấp JWT nội bộ của MiniDiscord

```java
// Pseudo-code bổ sung vào AuthService hiện có
public AuthResponse loginWithGoogle(OAuthRequest request) throws Exception {
    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
        new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(googleClientId))
            .build();

    GoogleIdToken idToken = verifier.verify(request.getIdToken());
    if (idToken == null) {
        throw new BaseException("Google Token không hợp lệ", HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN");
    }

    GoogleIdToken.Payload payload = idToken.getPayload();
    String email = payload.getEmail();
    String name = (String) payload.get("name");
    String pictureUrl = (String) payload.get("picture");

    // Find or Create user
    User user = userRepository.findByEmail(email)
        .orElseGet(() -> {
            User newUser = User.builder()
                .email(email)
                .username(name.replaceAll("\\s+", "").toLowerCase() + "_" + UUID.randomUUID().toString().substring(0, 5))
                .passwordHash("")  // OAuth user — no system password
                .avatarUrl(pictureUrl)
                .build();
            return userRepository.save(newUser);
        });

    String token = jwtService.generateToken(user.getId().toString(), user.getEmail(), user.getRole().name());
    return AuthResponse.builder().token(token).user(UserMapper.toResponse(user)).build();
}
```

**Config cần thêm:**
- `user-service/.env`: `GOOGLE_CLIENT_ID=905392681989-uun3otevkfu4mi3i11meckemp9gh2udp.apps.googleusercontent.com`
- `user-service/application.yml`: `google.client.id: ${GOOGLE_CLIENT_ID}`

---

### Task 9: Google OAuth — `AuthController` endpoint (user-service)

```java
@PostMapping("/google")
public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
        @Valid @RequestBody OAuthRequest request) throws Exception {
    AuthResponse result = authService.loginWithGoogle(request);
    return ResponseEntity.ok(ApiResponse.ok("Đăng nhập Google thành công", result));
}
```

> ✅ Path `/api/auth/google` nằm trong whitelist `/api/auth/**` của JwtAuthFilter → **không cần sửa code Gateway**.

---

### Task 10: Frontend — Google Login Button (Next.js)

**Dependency cần cài:**
```bash
npm install @react-oauth/google --legacy-peer-deps
```

**Tích hợp:**
```tsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Bọc App (hoặc Login page) với GoogleOAuthProvider
<GoogleOAuthProvider clientId="905392681989-...apps.googleusercontent.com">
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      const res = await axios.post('http://localhost:8080/api/auth/google', {
        idToken: credentialResponse.credential
      });
      const { token, user } = res.data.data;
      login(token, user); // Lưu JWT vào localStorage/Zustand
    }}
    onError={() => console.log('Login Failed')}
  />
</GoogleOAuthProvider>
```

---

## 6. Dependency Graph

```
                 common-lib (JwtUtil) ← đã có ✅
                        │
                ┌───────┼───────────┐
                ▼       ▼           ▼
          user-service  │     api-gateway
          (P1A ✅)      │     (P1B 🔜)
          + Google OAuth│
               │        │           │
               ▼        ▼           ▼
          Google APIs   │     Upstash Redis
          (verify)      │     (rate limiting)
```

### Execution Order (trong Phase P1B)

```
──── Parallel Group 1 (no dependency) ────
Task 1  (fix annotation)
Task 5  (error handler)       
Task 2  (CORS config)         
Task 6  (update yml + env)    
Task 7  (OAuthRequest DTO)    
Task 10 (user-service pom.xml + dependency)
──────────────────────────────────────────
──── Parallel Group 2 (depends on Group 1) ────
Task 3  (JWT filter)          ← depends on: Task 5, Task 6
Task 4  (Rate limit filter)   ← depends on: Task 5, Task 6, Redis config
Task 8  (AuthService Google)  ← depends on: Task 7, Task 10
──────────────────────────────────────────
──── Sequential Group 3 ────
Task 9  (AuthController Google) ← depends on: Task 8
Task 11 (Frontend Google Login) ← depends on: Task 9
──────────────────────────────────────────
```

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebFlux vs MVC confusion | Filter không compile | Dùng `GlobalFilter`, KHÔNG dùng `OncePerRequestFilter` |
| Redis (Upstash) connection | Rate limiting fail | **Fail-open + 200ms timeout** — pass-through nếu Redis unavailable |
| Redis network latency | Rate limiting chậm | **200ms command timeout** — nếu vượt → fail-open, log WARN |
| JWT secret mismatch | Token luôn invalid | Đã đồng bộ CÙNG `JWT_SECRET` ở Phase Docker (✅) |
| WebSocket qua gateway | STOMP upgrade bị block | Whitelist `/ws/**` khỏi JWT filter |
| Google OAuth token expired | Verify thất bại | `GoogleIdTokenVerifier` tự xử lý clock skew (±5 phút) |
| OAuth user trùng username | DB unique constraint | Nối UUID suffix: `name_abc12` |
| OAuth user không có password | Login thường thất bại | `passwordHash = ""` → BCrypt.matches("", "") = false → OK |

---

## 8. Verification Plan

### Automated (Docker Compose)
```bash
cd backend
docker compose up -d --build
docker compose ps  # Tất cả healthy
```

### Manual Test Flow — Gateway Filters
```
1. docker compose up -d --build (đã chạy sẵn từ Phase Docker)

2. POST localhost:8080/api/auth/register → 201 (qua gateway, không cần JWT)
3. POST localhost:8080/api/auth/login → 200 + token
4. GET  localhost:8080/api/users/me (no token) → 401 JSON
5. GET  localhost:8080/api/users/me (Bearer token) → 200 + user data
6. Spam 25 requests → request 21+ → 429
7. OPTIONS localhost:8080/api/users/me → CORS headers present
```

### Manual Test Flow — Google OAuth
```
8. Mở http://localhost:3000/login → Click nút "Sign in with Google"
9. Popup Google → chọn tài khoản
10. POST localhost:8080/api/auth/google (tự động qua frontend)
    → 200 + { token, user } (user mới được auto-register)
11. Thử login Google lần 2 với cùng tài khoản
    → 200 + { token, user } (user cũ, không tạo mới)
12. Dùng token từ Google OAuth → GET /api/users/me → 200 (JWT hoạt động bình thường)
```

### Fail-Open Test (Redis)
```
13. Dừng Redis connection (đổi REDIS_HOST thành giá trị sai)
14. Restart api-gateway
15. Gọi API bình thường → request vẫn đi qua (fail-open)
16. Kiểm tra logs → WARN "Redis rate limit unavailable, fail-open applied"
```

---

## 9. Estimated Effort

| Task | Mô tả | Time |
|------|--------|------|
| Task 1 | Fix annotation | 2 phút |
| Task 2 | CorsConfig | 15 phút |
| Task 3 | JwtAuthFilter | 30 phút |
| Task 4 | RateLimitFilter + fail-open | 35 phút |
| Task 5 | FilterErrorHandler | 15 phút |
| Task 6 | Update yml + env | 10 phút |
| Task 7 | OAuthRequest DTO | 5 phút |
| Task 8 | AuthService.loginWithGoogle() | 20 phút |
| Task 9 | AuthController endpoint | 5 phút |
| Task 10 | user-service pom.xml + config | 5 phút |
| Task 11 | Frontend Google Login | 15 phút |
| **TỔNG** | | **~2.5 — 3 giờ** |
