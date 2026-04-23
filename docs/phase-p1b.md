# 📋 Phase P1B — API Gateway: JWT Filter + CORS + Rate Limiting

> **Status:** 🔜 CHƯA BẮT ĐẦU | **Ưu tiên:** Critical
> **Mục tiêu:** Biến API Gateway thành cổng bảo mật duy nhất — xác thực JWT, kiểm soát CORS, giới hạn request rate
> **Dependency:** P0 (common-lib JwtUtil) ✅, P1A (user-service) ✅

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

### Mục tiêu Phase P1B

Sau khi hoàn thành, Gateway sẽ:
1. **Xác thực JWT** ở tầng Gateway (trước khi forward đến downstream services)
2. **Cho phép CORS** từ frontend (localhost:3000 dev + production domain)
3. **Rate Limit** requests bằng Redis (Upstash) để chống spam
4. **Truyền userId** qua header `X-User-Id` để downstream services biết ai gọi

---

## 2. Tech Stack & Dependencies hiện có

| Dependency trong pom.xml | Dùng cho |
|--------------------------|----------|
| `spring-cloud-starter-gateway` | WebFlux-based gateway (reactive) |
| `spring-cloud-starter-netflix-eureka-client` | Service discovery |
| `spring-boot-starter-data-redis-reactive` | Rate limiting (Redis reactive) |
| `common-lib` | JwtUtil, ApiResponse, BaseException |

> ⚠️ **LƯU Ý QUAN TRỌNG:** Spring Cloud Gateway dùng **WebFlux (reactive)**, KHÔNG phải Spring MVC.
> Tất cả filter phải dùng `GatewayFilter` / `GlobalFilter`, KHÔNG dùng `OncePerRequestFilter`.

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
                        │  user-service        │
                        │  group-channel       │
                        │  chat-history        │
                        │  messaging (WS)      │
                        │  file-service        │
                        └─────────────────────┘
```

---

## 4. Files cần tạo / sửa

### 4.1 Files mới (4 files)

| # | File | Chức năng | Ước lượng |
|---|------|-----------|-----------|
| 1 | `config/CorsConfig.java` | Global CORS cho WebFlux gateway | 15 phút |
| 2 | `filter/JwtAuthFilter.java` | GlobalFilter — validate Bearer token, inject X-User-Id | 30 phút |
| 3 | `filter/RateLimitFilter.java` | GatewayFilter — Redis-based rate limiting (5 req/sec/user) | 30 phút |
| 4 | `config/FilterErrorHandler.java` | Xử lý lỗi trong filter chain (JSON response cho 401/429) | 15 phút |

### 4.2 Files cần sửa (2 files)

| # | File | Thay đổi |
|---|------|----------|
| 5 | `ApiGatewayApplication.java` | Thêm `@EnableDiscoveryClient` |
| 6 | `application.yml` | Thêm Redis config, CORS config, JWT config, rate-limit config |

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
        // 3. Validate JWT
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
| `/api/auth/**` | Register + Login (chưa có token) |
| `/actuator/**` | Health check, monitoring |
| `/ws/**` | WebSocket upgrade (auth xử lý riêng trong messaging-service) |

**VERIFY:**
- Request không có token → `401 {"success": false, "message": "Missing token"}`
- Request có token hợp lệ → Forward + header `X-User-Id: <uuid>`
- Request có token hết hạn → `401 {"success": false, "message": "Token expired"}`

---

### Task 4: `filter/RateLimitFilter.java` — Rate Limiting

**INPUT:** Mọi authenticated request

**OUTPUT:** GatewayFilter dùng Redis (Upstash) để:
1. Key pattern: `rate:api:{userId}` hoặc `rate:api:{clientIP}` (nếu chưa auth)
2. Sliding window: **20 requests / 10 giây** (cho API chung)
3. Return `429 Too Many Requests` nếu vượt limit

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
    }
    
    @Override
    public int getOrder() { return -90; } // Run after JwtAuthFilter
}
```

**VERIFY:**
- 20 requests trong 10 giây → OK
- Request thứ 21 → `429 {"success": false, "message": "Rate limit exceeded"}`
- Response headers có `X-RateLimit-Remaining`

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

### Task 6: Cập nhật `application.yml`

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
      ssl:
        enabled: ${REDIS_SSL:false}

jwt:
  secret: ${JWT_SECRET:default-secret-change-me}

gateway:
  rate-limit:
    max-requests: 20
    window-seconds: 10
```

**Cập nhật `.env`:**
```
# Thêm Redis (Upstash) cho rate limiting
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-token>
REDIS_SSL=true
```

**VERIFY:** Gateway đọc được Redis config từ env vars

---

## 6. Dependency Graph

```
                 common-lib (JwtUtil) ← đã có ✅
                        │
                ┌───────┼───────────┐
                ▼       ▼           ▼
          user-service  │     api-gateway
          (P1A ✅)      │     (P1B 🔜)
                        │
                        ▼
                  Upstash Redis
                  (rate limiting)
```

### Execution Order (trong Phase P1B)

```
Task 1 (fix annotation)      ← no dependency
Task 5 (error handler)       ← no dependency  
Task 2 (CORS config)         ← no dependency
Task 6 (update yml)          ← no dependency
──────── parallel ↑ ──────────
Task 3 (JWT filter)          ← depends on: Task 5, Task 6
Task 4 (Rate limit filter)   ← depends on: Task 5, Task 6, Redis config
```

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebFlux vs MVC confusion | Filter không compile | Dùng `GlobalFilter`, KHÔNG dùng `OncePerRequestFilter` |
| Redis (Upstash) connection | Rate limiting fail | Graceful fallback — pass-through nếu Redis unavailable |
| JWT secret mismatch | Token luôn invalid | Dùng CÙNG `JWT_SECRET` env var giữa user-service và gateway |
| WebSocket qua gateway | STOMP upgrade bị block | Whitelist `/ws/**` khỏi JWT filter |
| JDK 17 chưa cài | Không compile được | Cài JDK 17 trước khi verify |

---

## 8. Verification Plan

### Automated (sau khi cài JDK 17)
```bash
mvn compile -pl api-gateway -am -q
```

### Manual Test Flow
```
1. Start discovery-server (8761)
2. Start user-service (8081)  
3. Start api-gateway (8080)

4. POST localhost:8080/api/auth/register → 201 (qua gateway, không cần JWT)
5. POST localhost:8080/api/auth/login → 200 + token
6. GET  localhost:8080/api/users/me (no token) → 401
7. GET  localhost:8080/api/users/me (Bearer token) → 200 + user data
8. Spam 25 requests → request 21+ → 429
9. OPTIONS localhost:8080/api/users/me → CORS headers present
```

---

## 9. Estimated Effort

| Task | Time |
|------|------|
| Task 1: Fix annotation | 2 phút |
| Task 2: CorsConfig | 15 phút |
| Task 3: JwtAuthFilter | 30 phút |
| Task 4: RateLimitFilter | 30 phút |
| Task 5: FilterErrorHandler | 15 phút |
| Task 6: Update yml + env | 10 phút |
| **TỔNG** | **~1.5 — 2 giờ** |
