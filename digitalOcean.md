# 🚀 MiniDiscord — Master Migration Plan: Heroku → DigitalOcean

> **Mục tiêu**: Di chuyển Backend từ Heroku sang **DigitalOcean Droplet** chạy Docker Compose. Khôi phục Eureka Service Discovery, HTTPS via Let's Encrypt, chuẩn bị sẵn cho k8s.

---

## 📋 Quyết định đã xác nhận

| Câu hỏi | Quyết định | Lý do |
|----------|-----------|-------|
| **Frontend** | ✅ Giữ Vercel | SSR tối ưu, CDN miễn phí, tiết kiệm RAM Droplet |
| **HTTPS** | ✅ Bắt buộc từ đầu | Mixed Content Policy chặn HTTP từ trang HTTPS |
| **Domain** | ✅ `tuelord.site` (Namecheap) | Đã có sẵn, dùng subdomain `api.tuelord.site` cho backend |
| **Deploy scope** | ✅ Core only | Eureka + Gateway + User + Redis (MVP) |
| **Database** | ✅ Giữ Supabase | Không cần migrate data, quản lý sẵn |
| **Redis** | ✅ Container local | Cùng mạng Docker, nhanh hơn, không cần TLS |
| **Droplet** | ✅ `139.59.240.137` | 1 vCPU / **2GB RAM** / 50GB Disk / Singapore |

---

## Kiến trúc mục tiêu

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION (DigitalOcean)                         │
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
│  │  ┌── Docker Compose Network (minidiscord-net) ───────────────┐ │ │
│  │  │                                                            │ │ │
│  │  │  [Eureka Server] :8761 ◄── Service Registry               │ │ │
│  │  │     ▲         ▲                                            │ │ │
│  │  │     │         │  register                                  │ │ │
│  │  │     │         │                                            │ │ │
│  │  │  [API Gateway] :8080           [User Service] :8081        │ │ │
│  │  │     │   lb://user-service          │                       │ │ │
│  │  │     │   CORS, JWT, RateLimit       │                       │ │ │
│  │  │     │                              ▼                       │ │ │
│  │  │  [Redis] :6379              [Supabase PostgreSQL]          │ │ │
│  │  │   (rate limit cache)         (external, giữ nguyên)        │ │ │
│  │  │                                                            │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Phần cứng & RAM Budget

| Thành phần | Specs |
|-----------|-------|
| **Droplet IP** | `139.59.240.137` |
| **vCPU** | 1 core |
| **RAM vật lý** | **2 GB** (đã nâng cấp từ 1GB) |
| **Disk** | 50 GB SSD |
| **Swap (vẫn tạo)** | 2 GB |
| **Tổng bộ nhớ khả dụng** | **4 GB** |
| **DNS** | `api.tuelord.site` → `139.59.240.137` ✅ Verified |

### RAM Budget Analysis

| Container | Memory Limit | Ghi chú |
|-----------|-------------|--------|
| Redis | 96 MB | Rate limit cache, LRU eviction |
| Eureka Server | 256 MB | Service registry |
| API Gateway | 300 MB | CORS, JWT, routing |
| User Service | **512 MB** | Auth, CRUD, DB connection (↑ tăng nhờ 2GB RAM) |
| **Tổng containers** | **1164 MB** | |
| OS + Nginx | ~150-200 MB | Ubuntu + Nginx |
| **Tổng thực tế** | **~1350 MB** | **< 2048 MB RAM → ✅ Thoải mái!** |
| **Dư RAM** | **~700 MB** | Buffer cho GC spikes, future services |

> [!TIP]
> **2GB RAM thay đổi cục diện!** Tổng memory (1350MB) giờ đã nằm thoải mái trong 2048MB RAM vật lý. Swap 2GB vẫn giữ làm **lớp bảo vệ thêm** (safety net cho GC spikes và peak load), nhưng không còn là điều kiện sống còn nữa. User Service được nâng lên 512MB để tận dụng RAM dư.

### 🛡️ 3 Lớp bảo hiểm thiết kế

| # | Cơ chế | Tác dụng |
|---|--------|--------|
| 1 | **Swap 2GB** (Bước 1.2) | Safety net cho GC spikes và peak traffic |
| 2 | **Build offload** (Phase 4) | Maven/Docker build chạy trên GitHub Actions, KHÔNG trên Droplet |
| 3 | **Khởi động tuần tự** (Phase 3) | `depends_on: service_healthy` → CPU 1 core không bị bottleneck |

---

## Proposed Changes

### Phase 1: Cấu hình DNS + Setup Droplet 🌍

#### Bước 1.1: Cấu hình DNS trên Namecheap

Trên trang **Advanced DNS** của `tuelord.site` (như ảnh bạn gửi), thực hiện:

| Hành động | Type | Host | Value | TTL |
|-----------|------|------|-------|-----|
| **Thêm mới** | A Record | `api` | `139.59.240.137` | Automatic |

> [!NOTE]
> Chỉ cần thêm **1 record** duy nhất. Subdomain `api.tuelord.site` sẽ trỏ đến Droplet. Bạn giữ nguyên các record `@` và `www` hiện có — chúng không ảnh hưởng.

#### Bước 1.2: SSH vào Droplet & Thiết lập cơ bản

```bash
# SSH vào Droplet
ssh root@139.59.240.137

# Update system
apt update && apt upgrade -y

# Verify Docker đã có sẵn (Marketplace image)
docker --version
docker compose version

# === TẠO SWAP 2GB (CỨU MẠNG cho Droplet 1GB RAM) ===
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify swap
free -h
# Expected: Swap total = 2.0G

# === TẠO THƯ MỤC PROJECT ===
mkdir -p /opt/minidiscord
```

#### Bước 1.3: Cấu hình Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP (Nginx + Certbot challenge)
ufw allow 443/tcp   # HTTPS (Nginx SSL)
ufw --force enable
ufw status
```

> [!IMPORTANT]
> Port `8080`, `8081`, `8761` KHÔNG mở ra ngoài Internet — chỉ Nginx reverse proxy mới giao tiếp với các container qua mạng Docker nội bộ. Đây là lớp bảo mật cơ bản nhất.

#### Bước 1.4: Cài đặt Nginx + Certbot

```bash
# Cài Nginx
apt install -y nginx

# Cài Certbot (Let's Encrypt)
apt install -y certbot python3-certbot-nginx

# Tạo file config cho API subdomain
cat > /etc/nginx/sites-available/api.tuelord.site << 'EOF'
server {
    listen 80;
    server_name api.tuelord.site;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (cho messaging-service tương lai)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeout cho các request lâu
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/api.tuelord.site /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test & reload Nginx
nginx -t && systemctl reload nginx
```

#### Bước 1.5: Lấy chứng chỉ SSL (Chạy SAU khi DNS đã propagate — ~5-15 phút)

```bash
# Verify DNS đã trỏ đúng
dig api.tuelord.site +short
# Expected: 139.59.240.137

# Lấy SSL certificate miễn phí
certbot --nginx -d api.tuelord.site --non-interactive --agree-tos -m <YOUR_EMAIL>

# Verify auto-renewal
certbot renew --dry-run
```

> [!NOTE]
> Certbot sẽ tự động sửa file Nginx config để thêm block `listen 443 ssl` và redirect HTTP → HTTPS. Chứng chỉ tự renew mỗi 90 ngày.

---

### Phase 2: Khôi phục Eureka & Sửa Codebase 🔄

> Phục hồi kiến trúc Service Discovery đã bị Heroku ép phải loại bỏ.

#### [MODIFY] [application-prod.yml](file:///e:/UIT/MiniDiscord/backend/api-gateway/src/main/resources/application-prod.yml)

Viết lại hoàn toàn — bật Eureka, dùng `lb://` routing, Redis local:

```yaml
# === PRODUCTION PROFILE (DigitalOcean) ===
# Eureka enabled — Load-balanced routing via Service Discovery
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/auth/**, /api/users/**

eureka:
  client:
    enabled: true
    service-url:
      defaultZone: ${EUREKA_URL:http://discovery-server:8761/eureka/}

spring.data.redis:
  host: ${REDIS_HOST:redis}
  port: ${REDIS_PORT:6379}
  password: ${REDIS_PASSWORD:}
  ssl:
    enabled: false  # Redis container cùng mạng Docker, không cần TLS

server:
  port: ${PORT:8080}

jwt:
  secret: ${JWT_SECRET}

app:
  cors:
    allowed-origins: ${CORS_ORIGINS:https://minidiscord.vercel.app}
    allowed-origin-patterns: ${CORS_ORIGIN_PATTERNS:https://*.vercel.app}
```

#### [MODIFY] [application-prod.yml](file:///e:/UIT/MiniDiscord/backend/user-service/src/main/resources/application-prod.yml)

Bật lại Eureka client:

```yaml
# === PRODUCTION PROFILE (DigitalOcean) ===
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update

eureka:
  client:
    enabled: true
    service-url:
      defaultZone: ${EUREKA_URL:http://discovery-server:8761/eureka/}

server:
  port: ${PORT:8081}
```

#### [MODIFY] [CorsConfig.java](file:///e:/UIT/MiniDiscord/backend/api-gateway/src/main/java/com/discordmini/gateway/config/CorsConfig.java)

Khôi phục lại logic CORS chi tiết (thay vì wildcard `*` dùng tạm cho Heroku):

```java
// Khôi phục đọc origin từ env vars
if (allowedOrigins != null && allowedOrigins.length > 0 && !allowedOrigins[0].isEmpty()) {
    corsConfig.setAllowedOrigins(List.of(allowedOrigins));
}
if (allowedOriginPatterns != null && allowedOriginPatterns.length > 0 && !allowedOriginPatterns[0].isEmpty()) {
    corsConfig.setAllowedOriginPatterns(List.of(allowedOriginPatterns));
}
```

---

### Phase 3: Docker Compose Production 🐳

> Tạo file `docker-compose.prod.yml` riêng cho production.

#### [NEW] [docker-compose.prod.yml](file:///e:/UIT/MiniDiscord/backend/docker-compose.prod.yml)

```yaml
services:
  # ─── Infrastructure ──────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: minidiscord-redis
    restart: always
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          memory: 96M
    networks:
      - minidiscord-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  discovery-server:
    image: ghcr.io/phatnguyentt2/minidiscord-eureka:latest
    container_name: minidiscord-eureka
    restart: always
    expose:
      - "8761"
    environment:
      - EUREKA_HOSTNAME=discovery-server
    deploy:
      resources:
        limits:
          memory: 256M
    networks:
      - minidiscord-net
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://localhost:8761/actuator/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 45s

  # ─── Core Services ──────────────────────────────
  api-gateway:
    image: ghcr.io/phatnguyentt2/minidiscord-gateway:latest
    container_name: minidiscord-gateway
    restart: always
    ports:
      - "127.0.0.1:8080:8080"  # ⚠️ Chỉ bind localhost — Nginx proxy vào, không expose ra Internet
    env_file:
      - .env.prod
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - EUREKA_URL=http://discovery-server:8761/eureka/
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    deploy:
      resources:
        limits:
          memory: 300M
    depends_on:
      discovery-server:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - minidiscord-net

  user-service:
    image: ghcr.io/phatnguyentt2/minidiscord-user:latest
    container_name: minidiscord-user
    restart: always
    expose:
      - "8081"
    env_file:
      - .env.prod
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - EUREKA_URL=http://discovery-server:8761/eureka/
    deploy:
      resources:
        limits:
          memory: 512M   # ↑ Tăng từ 400M nhờ Droplet 2GB RAM
    depends_on:
      discovery-server:
        condition: service_healthy
    networks:
      - minidiscord-net

networks:
  minidiscord-net:
    driver: bridge
```

> [!NOTE]
> **Giải thích thiết kế:**
> - `127.0.0.1:8080:8080` — Gateway chỉ nhận kết nối từ Nginx (localhost), **không expose ra Internet** (fix lỗ hổng Docker bypass UFW)
> - User Service + Eureka chỉ dùng `expose` (chỉ nhìn thấy trong mạng Docker nội bộ)
> - Redis giới hạn 64MB RAM, dùng chính sách LRU eviction cho rate limit cache
> - `restart: always` đảm bảo container tự khởi động lại khi Droplet reboot

> [!WARNING]
> **Docker bypass UFW!** Trên Ubuntu, Docker thao tác trực tiếp với `iptables` và **bỏ qua hoàn toàn** các rule UFW. Nếu dùng `ports: "8080:8080"` (không có `127.0.0.1`), Docker sẽ mở toang port 8080 ra toàn cầu, bất chấp UFW đang block. Luôn dùng `127.0.0.1:` prefix khi chỉ muốn expose cho localhost.

#### [NEW] [.env.prod.example](file:///e:/UIT/MiniDiscord/backend/.env.prod.example)

Template cho file `.env.prod` trên server (KHÔNG commit giá trị thật):

```env
# === Database (Supabase - giữ nguyên) ===
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.xxxxx
SPRING_DATASOURCE_PASSWORD=your-supabase-password

# === JWT (phải giống nhau giữa Gateway và User Service) ===
JWT_SECRET=v8A3rS5pU9dG3zX9W6v8A3rS5pU9dG3zX9W6v8A3rS4=

# === CORS ===
CORS_ORIGINS=https://minidiscord.vercel.app
CORS_ORIGIN_PATTERNS=https://*.vercel.app

# === Google OAuth ===
GOOGLE_CLIENT_ID=905392681989-xxx.apps.googleusercontent.com
```

---

### Phase 4: CI/CD — GitHub Actions → DigitalOcean 🚀

> Thay thế hoàn toàn luồng Heroku. Build Docker Images → Push GHCR → SSH deploy.

#### [MODIFY] [deploy-backend.yml](file:///e:/UIT/MiniDiscord/.github/workflows/deploy-backend.yml)

Viết lại hoàn toàn pipeline:

```yaml
name: Deploy Backend to DigitalOcean

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Eureka
        run: |
          docker build -f backend/discovery-server/Dockerfile \
            -t $IMAGE_PREFIX/minidiscord-eureka:latest \
            -t $IMAGE_PREFIX/minidiscord-eureka:${{ github.sha }} \
            backend/
          docker push $IMAGE_PREFIX/minidiscord-eureka --all-tags

      - name: Build & Push User Service
        run: |
          docker build -f backend/user-service/Dockerfile \
            -t $IMAGE_PREFIX/minidiscord-user:latest \
            -t $IMAGE_PREFIX/minidiscord-user:${{ github.sha }} \
            backend/
          docker push $IMAGE_PREFIX/minidiscord-user --all-tags

      - name: Build & Push API Gateway
        run: |
          docker build -f backend/api-gateway/Dockerfile \
            -t $IMAGE_PREFIX/minidiscord-gateway:latest \
            -t $IMAGE_PREFIX/minidiscord-gateway:${{ github.sha }} \
            backend/
          docker push $IMAGE_PREFIX/minidiscord-gateway --all-tags

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DO_HOST }}
          username: root
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /opt/minidiscord
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker image prune -f
            echo "=== Deployment complete ==="
            docker compose -f docker-compose.prod.yml ps
```

> [!NOTE]
> **Tính năng mới so với Heroku pipeline:**
> - **SHA tagging**: Mỗi image được tag cả `latest` và `commit SHA` → rollback dễ dàng bằng cách chỉ định SHA cụ thể
> - **GHCR miễn phí**: GitHub Container Registry cho public repos hoàn toàn miễn phí
> - **Atomic deploy**: `docker compose pull` + `up -d` thay thế container với zero-downtime (Eureka + healthcheck đảm bảo)

#### GitHub Secrets cần cấu hình

| Secret | Giá trị | Cách lấy |
|--------|--------|----------|
| `DO_HOST` | `139.59.240.137` | DigitalOcean Dashboard |
| `DO_SSH_KEY` | Private SSH Key | `cat ~/.ssh/id_rsa` (hoặc key bạn dùng SSH vào Droplet) |
| ~~`HEROKU_API_KEY`~~ | **Xoá** | Không còn dùng |

---

### Phase 5: Cập nhật Google OAuth + Vercel 🌐

#### Bước 5.1: Google Cloud Console

Vào [Google Cloud Console](https://console.cloud.google.com) → OAuth Client, thêm:
- **Authorized JavaScript Origins**: `https://api.tuelord.site`
- **Authorized redirect URIs**: `https://api.tuelord.site`

(Giữ nguyên các entry `https://minidiscord.vercel.app` và `http://localhost:3000`)

#### Bước 5.2: Vercel Environment Variables

| Variable | Giá trị cũ | Giá trị mới |
|----------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://minidiscord-gateway-*.herokuapp.com/api` | `https://api.tuelord.site/api` |

> [!WARNING]
> Sau khi đổi env var trên Vercel, **BẮT BUỘC Redeploy** (Deployments → chọn bản mới nhất → ⋮ → Redeploy).

---

### Phase 6: First Deploy & Verification ✅

#### Bước 6.1: Upload file lên Droplet (Lần đầu — thủ công)

```bash
# Từ máy local, copy file lên Droplet
scp backend/docker-compose.prod.yml root@139.59.240.137:/opt/minidiscord/

# SSH vào Droplet
ssh root@139.59.240.137

# Tạo file .env.prod (copy từ .env.prod.example, điền giá trị thật)
nano /opt/minidiscord/.env.prod
```

#### Bước 6.2: Cho phép Droplet pull image từ GHCR

**Cách 1 (Khuyến nghị — Repo Public):**

Sau khi GitHub Actions chạy thành công lần đầu, vào GitHub → Profile → **Packages** → chọn từng image (`minidiscord-eureka`, `minidiscord-gateway`, `minidiscord-user`) → **Package Settings** → đổi **Visibility** thành **Public**.

→ Droplet có thể `docker compose pull` thoải mái mà **không cần `docker login`**!

**Cách 2 (Repo Private):**

```bash
# Tạo Personal Access Token trên GitHub (scope: read:packages)
# https://github.com/settings/tokens/new
echo "<YOUR_GITHUB_PAT>" | docker login ghcr.io -u PhatNguyenTT2 --password-stdin
```

#### Bước 6.3: Khởi động hệ thống

```bash
cd /opt/minidiscord
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Theo dõi logs real-time
docker compose -f docker-compose.prod.yml logs -f
```

#### Bước 6.4: Health Check

```bash
# Eureka Dashboard (từ trong Droplet)
curl -s http://localhost:8761/actuator/health
# Expected: {"status":"UP"}

# Gateway Health (từ bên ngoài)
curl -s https://api.tuelord.site/actuator/health
# Expected: {"status":"UP","service":"api-gateway"}

# Test Auth Flow
curl -X POST https://api.tuelord.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## Rollback Plan

| Tình huống | Hành động |
|-----------|----------|
| Container crash | `docker compose logs <service>` → fix → `docker compose up -d` |
| Deploy mới lỗi | Rollback bằng SHA: sửa `image: ghcr.io/.../...:` thành SHA cũ → `up -d` |
| Droplet sập hoàn toàn | Đổi `NEXT_PUBLIC_API_URL` về Heroku URL cũ trên Vercel → Redeploy |

---

## Checklist tổng quan

| Phase | Thời gian | Task |
|-------|-----------|------|
| **Phase 1** | 20 phút | DNS (Namecheap) + Droplet setup (swap, firewall, nginx, SSL) |
| **Phase 2** | 10 phút | Sửa `application-prod.yml` (bật Eureka) + CorsConfig |
| **Phase 3** | 10 phút | Tạo `docker-compose.prod.yml` + `.env.prod` |
| **Phase 4** | 15 phút | Viết lại GitHub Actions + thêm Secrets |
| **Phase 5** | 5 phút | Google Console + Vercel env vars |
| **Phase 6** | 15 phút | First deploy + E2E testing |
| **Tổng** | **~1.5 giờ** | |
