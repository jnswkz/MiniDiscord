# 🚀 MiniDiscord — Deployment Report

> **Tài liệu tổng kết toàn bộ kiến trúc và quy trình triển khai Production**
> Cập nhật: 2026-05-11 | Platform: **DigitalOcean** (migrated from Heroku)

---

## 📌 Tổng quan hệ thống Production

| Thành phần | Platform | URL / Specs |
|-----------|----------|-------------|
| **Frontend** | Vercel (Free) | https://minidiscord.vercel.app |
| **Backend** | DigitalOcean Droplet ($12/tháng) | `139.59.240.137` — 1vCPU / 2GB RAM / 50GB SSD |
| **Domain** | Namecheap | `api.tuelord.site` → A Record → `139.59.240.137` |
| **SSL** | Let's Encrypt (Certbot) | Auto-renew via Nginx plugin |
| **Database** | Supabase PostgreSQL | `ap-southeast-1` region |
| **Cache** | Redis 7 (Docker container) | Local network, không TLS |
| **Registry** | GitHub Container Registry | `ghcr.io/phatnguyentt2/minidiscord-*` |
| **CI/CD** | GitHub Actions | Auto build → push GHCR → SSH deploy |

---

## 🏗️ Kiến trúc Production (DigitalOcean)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION FLOW                               │
│                                                                      │
│  [Browser]                                                           │
│     │                                                                │
│     ▼                                                                │
│  [Vercel CDN] ── Next.js SSR ── minidiscord.vercel.app              │
│     │                                                                │
│     │  NEXT_PUBLIC_API_URL = https://api.tuelord.site/api           │
│     ▼                                                                │
│  ┌─── DO Droplet 139.59.240.137 (1vCPU/2GB RAM+2GB Swap) ────────┐ │
│  │                                                                 │ │
│  │  [Nginx] ── SSL Termination (Let's Encrypt)                    │ │
│  │     │          api.tuelord.site:443 → localhost:8080            │ │
│  │     ▼                                                           │ │
│  │  ┌── Docker Compose (minidiscord-net) ──────────────────────┐  │ │
│  │  │                                                           │  │ │
│  │  │  [Redis] ── Rate Limit Cache (96MB, LRU eviction)        │  │ │
│  │  │     │                                                     │  │ │
│  │  │  [Eureka Server] ── Service Registry (256MB)              │  │ │
│  │  │     │    ↕ register/heartbeat                             │  │ │
│  │  │  [API Gateway] ── 127.0.0.1:8080 (300MB)                 │  │ │
│  │  │     │    ├── CORS Filter (Origin Patterns)                │  │ │
│  │  │     │    ├── JWT Auth Filter (whitelist /api/auth/**)     │  │ │
│  │  │     │    ├── Rate Limit Filter (IP/User-ID, fail-open)   │  │ │
│  │  │     │    └── lb://user-service (Eureka routing)          │  │ │
│  │  │     ▼                                                     │  │ │
│  │  │  [User Service] ── port 8081 (512MB)                     │  │ │
│  │  │     ├── Auth: Register / Login / Google OAuth             │  │ │
│  │  │     └── User: CRUD profile                               │  │ │
│  │  │                                                           │  │ │
│  │  └───────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│     │                                                                │
│     ▼                                                                │
│  [Supabase] PostgreSQL (External, ap-southeast-1)                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Thay đổi kiến trúc so với Heroku

| Hạng mục | Heroku (cũ) | DigitalOcean (hiện tại) |
|----------|-------------|-------------------------|
| **Service Discovery** | ❌ Tắt Eureka, Direct URL | ✅ Eureka Server, `lb://` routing |
| **Redis** | Upstash (external, TLS) | Docker container (local, không TLS) |
| **SSL** | Heroku tự cấp | Let's Encrypt + Certbot (tự renew) |
| **Gateway exposure** | Public Internet (Heroku URL) | `127.0.0.1:8080` — chỉ Nginx truy cập |
| **Cold start** | ~15s sau 30p idle | ❌ Không có — container chạy 24/7 |
| **Chi phí** | $10/tháng (2 Eco Dynos) | $12/tháng (1 Droplet gánh tất cả) |
| **Quota giới hạn** | 1000h/tháng (dễ hết) | Unlimited uptime |

---

## ⚡ RAM Budget (2GB Droplet)

| Container | Memory Limit | Ngưỡng an toàn |
|-----------|-------------|----------------|
| Redis | 96 MB | < 64 MB |
| Eureka Server | 256 MB | < 200 MB |
| API Gateway | 300 MB | < 250 MB |
| User Service | 512 MB | < 400 MB |
| **Tổng containers** | **1164 MB** | |
| OS + Nginx | ~150-200 MB | |
| **Tổng thực tế** | **~1350 MB** | **< 2048 MB ✅** |
| **Dư RAM** | **~700 MB** | Buffer cho GC spikes |
| **Swap (safety net)** | 2 GB | Chỉ dùng khi peak load |

---

## 🌐 Frontend — Vercel

| Thuộc tính | Chi tiết |
|-----------|---------| 
| **Platform** | Vercel (Free tier) |
| **Framework** | Next.js (auto-detected) |
| **Root Directory** | `frontend/` |
| **Auto Deploy** | Mỗi push lên `main` → Vercel tự build & deploy |

### Environment Variables (Vercel Dashboard)

| Variable | Giá trị | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.tuelord.site/api` | Production & Preview |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `905392681989-...` (Google OAuth) | Production & Preview |

> ⚠️ `NEXT_PUBLIC_*` được nhúng vào static files lúc build. Sau khi đổi giá trị, **BẮT BUỘC Redeploy** trên Vercel.

---

## ☁️ Backend — DigitalOcean Droplet

### Thông tin Droplet

| Thuộc tính | Chi tiết |
|-----------|---------| 
| **IP** | `139.59.240.137` |
| **Specs** | 1 vCPU / 2 GB RAM / 50 GB SSD |
| **Region** | Singapore (SGP1) |
| **OS** | Ubuntu 24.04 |
| **Domain** | `api.tuelord.site` (Namecheap A Record) |
| **Resize** | ⚠️ One-way — không thể hạ về gói 1GB/25GB |

### Docker Compose Services

| Service | Image | Port | Memory |
|---------|-------|------|--------|
| `redis` | `redis:7-alpine` | internal | 96M |
| `discovery-server` | `ghcr.io/phatnguyentt2/minidiscord-eureka` | 8761 (internal) | 256M |
| `api-gateway` | `ghcr.io/phatnguyentt2/minidiscord-gateway` | `127.0.0.1:8080` | 300M |
| `user-service` | `ghcr.io/phatnguyentt2/minidiscord-user` | 8081 (internal) | 512M |

### Environment Variables (`.env.prod` trên server)

| Variable | Dùng bởi | Mô tả |
|----------|----------|-------|
| `SPRING_DATASOURCE_URL` | User Service | JDBC URL Supabase (có `?sslmode=require`) |
| `SPRING_DATASOURCE_USERNAME` | User Service | DB username |
| `SPRING_DATASOURCE_PASSWORD` | User Service | DB password |
| `JWT_SECRET` | Gateway + User Service | **Phải giống nhau** giữa 2 service |
| `CORS_ORIGINS` | Gateway | `https://minidiscord.vercel.app` |
| `CORS_ORIGIN_PATTERNS` | Gateway | `https://*.vercel.app` |
| `GOOGLE_CLIENT_ID` | User Service | Google OAuth Client ID |

### Quyết định kiến trúc

| Quyết định | Lý do |
|-----------|-------|
| **Khôi phục Eureka** | DigitalOcean Droplet có IP cố định → Eureka hoạt động ổn định, không như Heroku thay đổi IP Dyno liên tục |
| **Redis local container** | Cùng Docker network → latency ~0ms, không cần TLS, không tốn tiền Upstash |
| **Gateway bind 127.0.0.1** | Vá lỗ hổng Docker-UFW bypass — cổng 8080 chỉ Nginx mới truy cập được |
| **Swap 2GB** | Safety net cho Java GC spikes và peak traffic, không phải điều kiện sống còn nhờ 2GB RAM |

---

## 🔄 CI/CD — GitHub Actions

### Pipeline: Deploy Backend to DigitalOcean

**File:** `.github/workflows/deploy-backend.yml`

**Trigger:** Push lên `main` khi thay đổi `backend/**` hoặc workflow file. Hỗ trợ `workflow_dispatch`.

**Luồng chạy:**

```
Push to main
    │
    ▼
┌─────────────────────────────────────────────────┐
│  Job: build-and-push                            │
│  1. Checkout code                               │
│  2. Login GHCR (GITHUB_TOKEN)                   │
│  3. Docker build Eureka → push ghcr.io          │
│  4. Docker build User Service → push ghcr.io    │
│  5. Docker build API Gateway → push ghcr.io     │
│  Tags: latest + commit SHA                      │
└────────────────────┬────────────────────────────┘
                     │ needs (chờ hoàn thành)
                     ▼
┌─────────────────────────────────────────────────┐
│  Job: deploy (SSH → Droplet)                    │
│  1. docker compose pull                         │
│  2. docker compose up -d                        │
│  3. docker image prune -f                       │
│  4. docker compose ps (verify)                  │
└─────────────────────────────────────────────────┘
```

**Thời gian trung bình:** ~3-5 phút

### GitHub Secrets

| Secret | Mô tả |
|--------|-------|
| `DO_HOST` | `139.59.240.137` |
| `DO_SSH_KEY` | Private key SSH để connect vào Droplet |

### Image Registry

| Image | URL |
|-------|-----|
| Eureka | `ghcr.io/phatnguyentt2/minidiscord-eureka` |
| User Service | `ghcr.io/phatnguyentt2/minidiscord-user` |
| API Gateway | `ghcr.io/phatnguyentt2/minidiscord-gateway` |

> ⚠️ **Docker tag phải lowercase.** `github.repository_owner` trả về `PhatNguyenTT2` (có chữ hoa) → hardcode `phatnguyentt2` trong workflow.

### Rollback Strategy

```bash
# Trên Droplet SSH — rollback về commit SHA cũ
cd /opt/minidiscord
# Sửa tag trong docker-compose.prod.yml từ :latest → :<commit-sha-cũ>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 🛡️ Bảo mật

### Network Security

| Lớp | Cơ chế |
|-----|--------|
| **Firewall** | UFW chỉ mở port 22, 80, 443 |
| **Docker binding** | Gateway bind `127.0.0.1:8080` — không lộ ra public |
| **SSL** | Let's Encrypt auto-renew qua Certbot Nginx plugin |

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
- Credentials nằm trong `.env.prod` trên server và Vercel Environment Variables
- Không commit bất kỳ secret nào vào repository

---

## 🔍 Troubleshooting

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| **DuplicateKeyException** | 2 block `spring:` trong YAML | Gom tất cả config con vào 1 block `spring:` duy nhất |
| **Invalid Docker tag** | `github.repository_owner` có chữ hoa | Hardcode lowercase trong `IMAGE_PREFIX` |
| **CORS blocked** | Frontend gọi từ domain không có trong `CORS_ORIGINS` | Thêm domain vào env var trên `.env.prod` |
| **502 Bad Gateway** | Docker container chưa ready | Chờ healthcheck pass: `docker ps` xem trạng thái |
| **Connection refused** | Nginx chưa chạy hoặc port 443 bị chặn | `systemctl status nginx` + `ufw status` |
| **Google OAuth fail** | Thiếu domain trong Google Console | Thêm `https://api.tuelord.site` vào Authorized Origins |
| **Env var không nhận (Vercel)** | `NEXT_PUBLIC_*` cần rebuild | Redeploy trên Vercel sau khi đổi env var |

### Lệnh debug hữu ích

```bash
# Xem logs real-time toàn hệ thống
cd /opt/minidiscord
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Lọc lỗi User Service
docker logs minidiscord-user 2>&1 | grep -i "error\|exception"

# Lọc lỗi Gateway
docker logs minidiscord-gateway 2>&1 | grep -i "error\|exception"

# Health check Eureka (internal)
docker exec -it minidiscord-eureka wget -qO- http://localhost:8761/actuator/health

# Test mạng nội bộ Docker
docker exec -it minidiscord-gateway ping -c 3 user-service

# Xem RAM từng container
docker stats --no-stream

# Xem RAM tổng thể server
free -h

# Health check từ bên ngoài
curl -s https://api.tuelord.site/actuator/health

# Test auth flow qua gateway
curl -X POST https://api.tuelord.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Restart toàn bộ
cd /opt/minidiscord
docker compose -f docker-compose.prod.yml restart

# Rebuild và deploy lại
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 📋 Post-Deploy Verification Checklist

- [ ] `https://minidiscord.vercel.app` → Trang login hiển thị
- [ ] Đăng ký tài khoản mới → Redirect dashboard
- [ ] Đăng nhập → Dashboard hiển thị user info
- [ ] Logout → Redirect về login
- [ ] Google OAuth Login → Hoạt động
- [ ] Refresh page → Session persist (JWT trong localStorage)
- [ ] `curl https://api.tuelord.site/actuator/health` → `{"status":"UP"}`
- [ ] `docker ps` trên Droplet → 4 container đều Up/healthy
- [ ] `docker stats --no-stream` → Tổng RAM < 1.5 GB
- [ ] `free -h` → Swap used < 500 MB
