# 🚀 MiniDiscord — Deployment Guide

> **Tài liệu tổng kết toàn bộ quy trình triển khai Production**
> Cập nhật: 2026-05-11

---

## 📌 Tổng quan hệ thống Production

| Thành phần | Platform | URL |
|-----------|----------|-----|
| **Frontend** | Vercel (Free) | https://minidiscord.vercel.app |
| **API Gateway** | Heroku Eco ($5/tháng) | https://minidiscord-gateway-bbc581926938.herokuapp.com |
| **User Service** | Heroku Eco ($5/tháng) | https://minidiscord-user-9b155a4891e0.herokuapp.com |
| **Database** | Supabase PostgreSQL | `ap-southeast-2` region |
| **Cache/Rate Limit** | Upstash Redis | TLS enabled |
| **CI/CD** | GitHub Actions | Auto-deploy on push to `main` |

### Kiến trúc Production

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCTION FLOW                           │
│                                                                 │
│  [Browser]                                                      │
│     │                                                           │
│     ▼                                                           │
│  [Vercel CDN] ── Next.js SSR ── minidiscord.vercel.app         │
│     │                                                           │
│     │  NEXT_PUBLIC_API_URL                                      │
│     ▼                                                           │
│  [Heroku] ── API Gateway ── minidiscord-gateway-*.herokuapp.com│
│     │    ├── CORS Filter (@Order HIGHEST_PRECEDENCE)            │
│     │    ├── JWT Auth Filter (whitelist /api/auth/**)            │
│     │    └── Rate Limit Filter (Redis, fail-open)               │
│     │                                                           │
│     │  Direct URL routing (NO Eureka)                           │
│     ▼                                                           │
│  [Heroku] ── User Service ── minidiscord-user-*.herokuapp.com  │
│     │    ├── Auth: Register / Login / Google OAuth               │
│     │    └── User: CRUD profile                                 │
│     │                                                           │
│     ▼                                                           │
│  [Supabase] PostgreSQL    [Upstash] Redis                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Frontend — Vercel

### Cấu hình

- **Platform:** Vercel (Free tier)
- **Framework:** Next.js (auto-detected)
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build` (auto)
- **Auto Deploy:** Mỗi push lên `main` → Vercel tự build & deploy

### Environment Variables (Vercel Dashboard)

| Variable | Giá trị | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | `https://minidiscord-gateway-bbc581926938.herokuapp.com/api` | Production & Preview |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `905392681989-...` (Google OAuth) | Production & Preview |

> ⚠️ **QUAN TRỌNG:** `NEXT_PUBLIC_*` được nhúng vào static files lúc build. Sau khi đổi giá trị env var trên Vercel Dashboard, **BẮT BUỘC phải Redeploy** (Deployments → chọn bản mới nhất → ⋮ → Redeploy) để thay đổi có hiệu lực.

---

## ☁️ Backend — Heroku

### Thông tin chung

| Thuộc tính | Chi tiết |
|-----------|---------|
| **Gói** | Eco Dynos — $5/tháng, 1000 giờ chung toàn account |
| **Sleep** | Tự sleep sau 30 phút idle |
| **Cold start** | ~10-20 giây (chấp nhận được cho MVP) |
| **Deploy method** | Docker Container (GitHub Actions build → push → release) |
| **Heroku CLI app name** | `minidiscord-user`, `minidiscord-gateway` (KHÔNG có hash) |
| **Public URL** | Có hash suffix (tự động bởi Heroku) |

> ⚠️ **Phân biệt App Name vs Public URL:**
> - CLI commands (`--app`): dùng tên **KHÔNG** hash → `minidiscord-user`
> - Public URL / Code config: dùng URL **CÓ** hash → `minidiscord-user-9b155a4891e0.herokuapp.com`

### Config Vars — User Service (`minidiscord-user`)

| Variable | Mô tả |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://...` (Supabase) |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | JWT signing key (**phải giống gateway**) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |

### Config Vars — API Gateway (`minidiscord-gateway`)

| Variable | Mô tả |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `USER_SERVICE_URL` | `https://minidiscord-user-9b155a4891e0.herokuapp.com` |
| `JWT_SECRET` | JWT signing key (**phải giống user-service**) |
| `CORS_ORIGINS` | `https://minidiscord.vercel.app` |
| `CORS_ORIGIN_PATTERNS` | `https://*.vercel.app` |
| `SPRING_DATA_REDIS_HOST` | Upstash Redis host |
| `SPRING_DATA_REDIS_PORT` | `6379` |
| `SPRING_DATA_REDIS_PASSWORD` | Upstash Redis password |

### Quyết định kiến trúc

| Quyết định | Lý do |
|-----------|-------|
| **Loại bỏ Eureka** | Heroku Common Runtime thay đổi IP Dyno liên tục → Eureka không hoạt động đúng. Dùng Direct URL qua env vars, tiết kiệm 1 Dyno. |
| **Loại bỏ RequestRateLimiter built-in** | Thiếu `KeyResolver` bean → deny ALL requests (403). Custom `RateLimitFilter.java` (IP-based, fail-open) đã xử lý. |
| **Custom Health Check** | `spring-boot-starter-actuator` chiếm hàng chục MB RAM, làm chậm cold-start. Dùng controller siêu nhẹ trả `{"status":"UP"}`. |

---

## 🔄 CI/CD — GitHub Actions

### Pipeline: Deploy Backend

**File:** `.github/workflows/deploy-backend.yml`

**Trigger:** Push lên `main` khi thay đổi:
- `backend/api-gateway/**`
- `backend/user-service/**`
- `backend/common-lib/**`
- `.github/workflows/deploy-backend.yml`

Hoặc kích hoạt thủ công qua `workflow_dispatch`.

**Luồng chạy:**

```
Push to main
    │
    ▼
┌─────────────────────────────────────┐
│  Job: deploy-user-service           │
│  1. Checkout code                   │
│  2. Setup JDK 17 (Temurin)          │
│  3. Maven build common-lib + user   │
│  4. Install Heroku CLI              │
│  5. Set stack → container           │
│  6. Docker build → push → release   │
└─────────────────┬───────────────────┘
                  │ needs (chờ hoàn thành)
                  ▼
┌─────────────────────────────────────┐
│  Job: deploy-api-gateway            │
│  1. Checkout code                   │
│  2. Setup JDK 17 (Temurin)          │
│  3. Maven build common-lib + gw     │
│  4. Install Heroku CLI              │
│  5. Set stack → container           │
│  6. Docker build → push → release   │
└─────────────────────────────────────┘
```

**Thời gian trung bình:** ~5-7 phút

### GitHub Secrets

| Secret | Nguồn |
|--------|-------|
| `HEROKU_API_KEY` | Heroku Dashboard → Account Settings → API Key |

### Dockerfile (Được tạo inline trong workflow)

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY backend/<service>/target/*.jar app.jar
CMD java -Dspring.profiles.active=prod -Dserver.port=$PORT -jar app.jar
```

---

## 🛡️ Health Check

### Endpoints

| Service | URL | Response |
|---------|-----|----------|
| API Gateway | `https://minidiscord-gateway-bbc581926938.herokuapp.com/actuator/health` | `{"status":"UP","service":"api-gateway"}` |
| User Service | `https://minidiscord-user-9b155a4891e0.herokuapp.com/actuator/health` | `{"status":"UP","service":"user-service"}` |

### Giải pháp kỹ thuật

Custom `HealthController.java` siêu nhẹ (không dùng `spring-boot-starter-actuator`):

```java
@RestController
public class HealthController {
    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "<service-name>"
        ));
    }
}
```

**Lý do:** Heroku Eco Dynos giới hạn 512MB RAM. Actuator kích hoạt hệ thống đo lường JVM/Threads ngầm, chiếm thêm hàng chục MB và kéo dài cold-start.

---

## 📊 Monitoring — UptimeRobot

### Chiến lược Quota

Heroku Eco cấp **1000 giờ/tháng** chung toàn account:
- `2 apps × 24h × 30 ngày = 1440 giờ` → **VƯỢ QUÁ QUOTA**
- Nếu ping 24/7, hệ thống sẽ sập vào tuần thứ 3

### Quy tắc sử dụng

| Tình huống | Hành động |
|-----------|---------|
| **Ngày thường** | ❌ KHÔNG bật UptimeRobot. Để Dynos tự sleep. Chấp nhận cold-start ~15s |
| **Trước demo 1 giờ** | ✅ Bật monitor (ping mỗi 25 phút) |
| **Sau demo** | ❌ Tắt ngay lập tức |
| **Giờ làm việc** | ⚠️ Có thể ping 8:00-22:00 (14h × 2 dynos × 30 ngày = 840h ≤ 1000h) |

### Cấu hình UptimeRobot

1. Tạo tài khoản tại https://uptimerobot.com
2. Monitor 1: `https://minidiscord-gateway-bbc581926938.herokuapp.com/actuator/health` — HTTP(s), 25 phút
3. Monitor 2: `https://minidiscord-user-9b155a4891e0.herokuapp.com/actuator/health` — HTTP(s), 25 phút
4. **Mặc định: PAUSE cả 2 monitors**

---

## 🔐 Bảo mật

### CORS

- **Config:** Đọc động từ env vars `CORS_ORIGINS` và `CORS_ORIGIN_PATTERNS`
- **Production:** Chỉ cho phép `https://minidiscord.vercel.app` và `https://*.vercel.app`
- **Filter priority:** `@Order(Ordered.HIGHEST_PRECEDENCE)` — chạy TRƯỚC tất cả filter khác
- **Preflight cache:** 1 giờ (`maxAge: 3600`)

### JWT Authentication

- **Global filter:** `JwtAuthFilter` chạy trên mọi request
- **Whitelist (không cần JWT):**
  - `/api/auth/**` (login, register, Google OAuth)
  - `/actuator/**` (health check)
  - `/ws/**` (WebSocket)
- **Header injection:** Sau xác thực, filter thêm `X-User-Id` vào request header

### Rate Limiting

- **Custom `RateLimitFilter`:** IP-based khi chưa đăng nhập, User-ID-based khi đã đăng nhập
- **Giới hạn:** 20 requests / 10 giây
- **Fail-open:** Nếu Redis down → cho phép request đi qua (không block user)
- **Response headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Secrets Management

- `.gitignore` đã exclude: `.env`, `**/.env`, `.env.*`, `**/.env.*`
- Tất cả credentials nằm trong Heroku Config Vars và Vercel Environment Variables
- Không commit bất kỳ secret nào vào repository

### Google OAuth

- **Frontend:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Google Login button
- **Backend:** `GOOGLE_CLIENT_ID` → `GoogleIdTokenVerifier` xác thực ID token
- **Google Console:** Đã thêm `https://minidiscord.vercel.app` vào Authorized JavaScript Origins

---

## 🔍 Troubleshooting

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| **CORS blocked** | Frontend gọi từ domain không có trong `CORS_ORIGINS` | Thêm domain vào env var `CORS_ORIGINS` trên Heroku Gateway |
| **403 Forbidden** | `RequestRateLimiter` built-in thiếu `KeyResolver` | Đã fix: xóa built-in filter, dùng custom `RateLimitFilter` |
| **404 Not Found** | `NEXT_PUBLIC_API_URL` thiếu `/api` ở cuối | Set đúng: `https://...herokuapp.com/api` → Redeploy Vercel |
| **App not found (CLI)** | Dùng tên có hash cho Heroku CLI | CLI dùng tên KHÔNG hash: `minidiscord-user` |
| **Cold start chậm** | Dyno đã sleep sau 30p idle | Bình thường. Bật UptimeRobot trước demo |
| **Google OAuth fail** | Thiếu domain trong Google Console | Thêm Vercel domain vào Authorized Origins |
| **Env var không nhận (Vercel)** | `NEXT_PUBLIC_*` cần rebuild | Redeploy trên Vercel sau khi đổi env var |

### Lệnh debug hữu ích

```bash
# Xem logs real-time
heroku logs --tail -a minidiscord-gateway
heroku logs --tail -a minidiscord-user

# Kiểm tra config vars
heroku config -a minidiscord-gateway
heroku config -a minidiscord-user

# Restart dyno
heroku restart -a minidiscord-gateway
heroku restart -a minidiscord-user

# Kiểm tra trạng thái dyno
heroku ps -a minidiscord-gateway

# Test health check
curl -s https://minidiscord-gateway-bbc581926938.herokuapp.com/actuator/health
curl -s https://minidiscord-user-9b155a4891e0.herokuapp.com/actuator/health

# Test auth flow qua gateway
curl -X POST https://minidiscord-gateway-bbc581926938.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📋 Checklist Verification (Post-Deploy)

- [ ] Mở https://minidiscord.vercel.app → Trang login hiển thị
- [ ] Đăng ký tài khoản mới → Redirect dashboard
- [ ] Đăng nhập → Dashboard hiển thị user info
- [ ] Logout → Redirect về login
- [ ] Google OAuth Login → Hoạt động
- [ ] Refresh page → Session persist (JWT trong localStorage)
- [ ] Health check Gateway: `https://minidiscord-gateway-bbc581926938.herokuapp.com/actuator/health` → `{"status":"UP"}`
- [ ] Health check User: `https://minidiscord-user-9b155a4891e0.herokuapp.com/actuator/health` → `{"status":"UP"}`
- [ ] Cold start test: Đợi 35 phút → gửi request → verify wakeup < 20s
