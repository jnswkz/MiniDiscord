# 📘 MiniDiscord — Báo Cáo Chi Tiết Tiến Trình DevOps

> **Tài liệu giải thích chuyên sâu** toàn bộ code và quyết định kỹ thuật trong quá trình deploy Microservices lên DigitalOcean.
> Cập nhật: 2026-05-11

---

## Mục lục

1. [Tổng quan kiến trúc Deploy](#1-tổng-quan-kiến-trúc-deploy)
2. [Dockerfile — Multi-stage Build](#2-dockerfile--multi-stage-build)
3. [Docker Compose Production](#3-docker-compose-production)
4. [CI/CD Pipeline — GitHub Actions](#4-cicd-pipeline--github-actions)
5. [Spring Boot Production Config](#5-spring-boot-production-config)
6. [Nginx & SSL Termination](#6-nginx--ssl-termination)
7. [Bảo mật hạ tầng](#7-bảo-mật-hạ-tầng)
8. [Sự cố & Bài học kinh nghiệm](#8-sự-cố--bài-học-kinh-nghiệm)

---

## 1. Tổng quan kiến trúc Deploy

### Luồng request từ trình duyệt đến Database

```
Browser (User)
    │
    ▼
Vercel CDN ── Next.js SSR (Frontend)
    │
    │  HTTPS request đến api.tuelord.site
    ▼
┌─── DigitalOcean Droplet (139.59.240.137) ───────────────┐
│                                                          │
│  Nginx (port 443)                                       │
│  ├── SSL Termination (Let's Encrypt certificate)        │
│  └── proxy_pass → 127.0.0.1:8080                       │
│         │                                                │
│  ┌── Docker Network (minidiscord-net) ──────────────┐   │
│  │                                                    │   │
│  │  API Gateway (:8080)                              │   │
│  │  ├── CorsWebFilter → kiểm tra Origin             │   │
│  │  ├── JwtAuthFilter → xác thực token              │   │
│  │  ├── RateLimitFilter → giới hạn request          │   │
│  │  └── lb://user-service → Eureka lookup           │   │
│  │         │                                          │   │
│  │  Eureka Server (:8761) ← service registry         │   │
│  │         │                                          │   │
│  │  User Service (:8081)                              │   │
│  │  └── Supabase PostgreSQL (external)               │   │
│  │                                                    │   │
│  │  Redis (:6379) ← rate limit cache                 │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Tại sao chọn kiến trúc này?**

| Quyết định | Lý do kỹ thuật |
|-----------|---------------|
| Nginx đứng trước Docker | SSL termination tách biệt khỏi Java app, giảm tải CPU cho Gateway |
| Gateway bind `127.0.0.1` | Vá lỗ hổng Docker-UFW bypass (giải thích chi tiết ở [Mục 7](#7-bảo-mật-hạ-tầng)) |
| Eureka thay Direct URL | Droplet IP cố định → Eureka hoạt động ổn định (Heroku thay đổi IP liên tục nên phải tắt) |
| Redis local container | Cùng Docker network → latency ~0ms, tiết kiệm $7/tháng so với Upstash |

---

## 2. Dockerfile — Multi-stage Build

Mỗi microservice sử dụng **Multi-stage Docker Build** gồm 2 giai đoạn: Build và Runtime. Lấy Eureka làm ví dụ phân tích chi tiết:

### Stage 1: Build (Maven)

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
```

- `FROM maven:3.9-eclipse-temurin-17` — Base image chứa sẵn Maven 3.9 + JDK 17. Chỉ dùng trong quá trình build, **không có mặt** trong image cuối cùng.
- `AS builder` — Đặt tên cho stage này để stage sau tham chiếu khi copy file.

```dockerfile
# Layer 1: Copy tất cả pom.xml
COPY pom.xml .
COPY common-lib/pom.xml ./common-lib/pom.xml
COPY discovery-server/pom.xml ./discovery-server/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
# ... (các module khác)
```

**Tại sao copy pom.xml trước?** Đây là kỹ thuật **Docker Layer Caching**:
- Docker cache mỗi lệnh `RUN`/`COPY` thành 1 layer
- Nếu `pom.xml` không thay đổi → layer tiếp theo (`dependency:go-offline`) được cache → **tiết kiệm 3-5 phút** mỗi lần build
- Chỉ khi sửa dependencies trong `pom.xml`, Docker mới download lại

```dockerfile
# Layer 2: Download dependencies
RUN mvn -pl common-lib,discovery-server -am dependency:go-offline -q -B
```

| Flag | Ý nghĩa |
|------|---------|
| `-pl common-lib,discovery-server` | Chỉ build 2 module cần thiết (Project List) |
| `-am` | Also Make — build cả dependencies (common-lib) |
| `dependency:go-offline` | Tải toàn bộ JAR dependencies về local cache |
| `-q` | Quiet — giảm log output |
| `-B` | Batch mode — không hỏi interactive |

```dockerfile
# Layer 3: Copy source code
COPY common-lib/src ./common-lib/src
COPY discovery-server/src ./discovery-server/src

# Layer 4: Build JAR
RUN mvn -pl common-lib,discovery-server -am clean package -DskipTests -q
```

**Source code thay đổi thường xuyên hơn pom.xml**, nên đặt ở layer sau để tận dụng cache ở Layer 1-2.

### Stage 2: Runtime (JRE only)

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
```

| Dòng | Giải thích |
|------|-----------|
| `eclipse-temurin:17-jre-alpine` | Chỉ chứa JRE (không có JDK/Maven) → image nhỏ ~180MB thay vì ~800MB |
| `--from=builder` | Copy file JAR từ stage 1, bỏ lại toàn bộ source code và Maven cache |
| `EXPOSE 8761` | Metadata cho Docker biết port (không tự mở port) |
| `ENTRYPOINT [...]` | Exec form — process Java chạy trực tiếp (PID 1), nhận signal SIGTERM đúng cách |

### So sánh kích thước image

| Cách build | Kích thước |
|-----------|-----------|
| Single-stage (JDK + source) | ~800 MB |
| Multi-stage (JRE-alpine only) | ~180 MB |
| **Tiết kiệm** | **~77%** |

---

## 3. Docker Compose Production

### Phân tích từng service

#### 3.1 Redis — Rate Limit Cache

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
  deploy:
    resources:
      limits:
        memory: 96M
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 3s
    retries: 3
```

| Config | Giải thích |
|--------|-----------|
| `redis:7-alpine` | Alpine Linux base → image chỉ ~30MB |
| `--maxmemory 64mb` | Redis tự giới hạn bộ nhớ data ở 64MB |
| `--maxmemory-policy allkeys-lru` | Khi đầy 64MB → xóa key ít dùng nhất (Least Recently Used) |
| `memory: 96M` | Docker giới hạn tổng process ở 96MB (64MB data + 32MB overhead) |
| `redis-cli ping` | Healthcheck đơn giản: gửi PING, mong đợi PONG |

#### 3.2 Eureka — Service Registry

```yaml
discovery-server:
  image: ghcr.io/phatnguyentt2/minidiscord-eureka:latest
  expose:
    - "8761"
  healthcheck:
    test: ["CMD-SHELL", "wget --spider -q http://localhost:8761/actuator/health || exit 1"]
    start_period: 45s
```

| Config | Giải thích |
|--------|-----------|
| `expose` (vs `ports`) | Chỉ mở port **trong Docker network**, không mở ra host machine |
| `start_period: 45s` | Java Spring Boot cần ~30-45s để khởi động → không check health trong khoảng này |
| `wget --spider` | Chỉ kiểm tra HTTP status code, không download body → nhẹ nhàng |

**Tại sao Eureka quan trọng?** Eureka là "danh bạ điện thoại" của Microservices. Mỗi service khi khởi động sẽ đăng ký tên + IP vào Eureka. Gateway dùng `lb://user-service` để tra cứu IP thực tế, không cần hardcode URL.

#### 3.3 API Gateway — Điểm vào duy nhất

```yaml
api-gateway:
  ports:
    - "127.0.0.1:8080:8080"  # ⚠️ CHỈ bind localhost
  env_file:
    - .env.prod
  environment:
    - SPRING_PROFILES_ACTIVE=prod
    - EUREKA_URL=http://discovery-server:8761/eureka/
    - REDIS_HOST=redis
  depends_on:
    discovery-server:
      condition: service_healthy
    redis:
      condition: service_healthy
```

| Config | Giải thích |
|--------|-----------|
| `127.0.0.1:8080:8080` | **Quan trọng nhất!** Chỉ localhost trên host machine mới gọi được port 8080. Nginx proxy vào đây. Internet KHÔNG truy cập trực tiếp được |
| `env_file: .env.prod` | Load biến môi trường từ file (DB password, JWT secret, ...) |
| `SPRING_PROFILES_ACTIVE=prod` | Kích hoạt file `application-prod.yml` thay vì `application.yml` |
| `EUREKA_URL` | Dùng tên container `discovery-server` làm hostname (Docker DNS tự resolve) |
| `REDIS_HOST=redis` | Tương tự, tên container `redis` tự resolve thành IP nội bộ |
| `condition: service_healthy` | **Khởi động tuần tự** — Gateway chỉ start KHI Eureka và Redis đã healthy |

#### 3.4 User Service — Business Logic

```yaml
user-service:
  expose:
    - "8081"
  deploy:
    resources:
      limits:
        memory: 512M
  depends_on:
    discovery-server:
      condition: service_healthy
```

| Config | Giải thích |
|--------|-----------|
| `expose` (không phải `ports`) | User Service KHÔNG bao giờ được truy cập trực tiếp từ bên ngoài. Mọi request phải đi qua Gateway |
| `memory: 512M` | Được ưu tiên RAM cao nhất vì gánh kết nối Database + xử lý Auth logic |

#### 3.5 Docker Network

```yaml
networks:
  minidiscord-net:
    driver: bridge
```

Tất cả container cùng network → gọi nhau bằng tên container (Docker DNS). Ví dụ: Gateway gọi `http://redis:6379` thay vì `http://172.18.0.2:6379`.

---

## 4. CI/CD Pipeline — GitHub Actions

### Phân tích workflow `deploy-backend.yml`

#### Trigger Events

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:
```

| Trigger | Khi nào chạy |
|---------|-------------|
| `push → main + paths` | Chỉ khi thay đổi file trong `backend/` hoặc file workflow. Sửa `frontend/` → KHÔNG trigger |
| `workflow_dispatch` | Cho phép chạy thủ công từ tab Actions trên GitHub |

#### Environment Variables

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/phatnguyentt2
```

**⚠️ Bài học quan trọng:** Ban đầu dùng `ghcr.io/${{ github.repository_owner }}` nhưng GitHub trả về `PhatNguyenTT2` (chữ hoa). Docker **bắt buộc** tag phải lowercase → build fail. Fix: hardcode `phatnguyentt2`.

#### Job 1: Build & Push Images

```yaml
build-and-push:
  permissions:
    contents: read      # Đọc source code
    packages: write     # Ghi image lên GHCR
  steps:
    - uses: actions/checkout@v4

    - name: Login to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
```

| Dòng | Giải thích |
|------|-----------|
| `permissions` | Giới hạn quyền token theo nguyên tắc Least Privilege |
| `GITHUB_TOKEN` | Token tự động do GitHub cấp — không cần tạo PAT riêng |

```yaml
    - name: Build & Push Eureka
      run: |
        docker build -f backend/discovery-server/Dockerfile \
          -t $IMAGE_PREFIX/minidiscord-eureka:latest \
          -t $IMAGE_PREFIX/minidiscord-eureka:${{ github.sha }} \
          backend/
        docker push $IMAGE_PREFIX/minidiscord-eureka --all-tags
```

| Flag | Giải thích |
|------|-----------|
| `-f backend/discovery-server/Dockerfile` | Chỉ định Dockerfile cụ thể (không dùng mặc định `./Dockerfile`) |
| `-t ...:latest` | Tag image là `latest` → docker-compose.prod.yml luôn pull bản mới nhất |
| `-t ...:${{ github.sha }}` | Tag bằng commit SHA → **rollback chính xác** về bất kỳ version nào |
| `backend/` | Build context = thư mục `backend/` → Dockerfile COPY tương đối từ đây |
| `--all-tags` | Push cả 2 tag (`latest` + SHA) trong 1 lệnh |

#### Job 2: Deploy via SSH

```yaml
deploy:
  needs: build-and-push    # Chờ Job 1 hoàn thành
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

| Lệnh SSH | Giải thích |
|----------|-----------|
| `docker compose pull` | Tải image mới nhất từ GHCR về Droplet |
| `docker compose up -d` | Khởi động/cập nhật container. Docker Compose so sánh image mới vs cũ → chỉ restart container có image thay đổi |
| `docker image prune -f` | Xóa image cũ không dùng → tiết kiệm disk (quan trọng với 50GB SSD) |
| `docker compose ps` | In trạng thái container → xuất hiện trong log GitHub Actions để verify |

### Luồng Rollback

```bash
# Trên Droplet: quay về commit cũ bằng SHA tag
cd /opt/minidiscord
# Sửa docker-compose.prod.yml: image: ...eureka:latest → image: ...eureka:<old-sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Spring Boot Production Config

### API Gateway — `application-prod.yml`

```yaml
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
```

| Config | Giải thích |
|--------|-----------|
| `locator.enabled: true` | Gateway tự phát hiện service từ Eureka và tạo route tự động |
| `lower-case-service-id: true` | Chuyển tên service về lowercase khi tra cứu Eureka |
| `uri: lb://user-service` | `lb://` = Load Balanced — Spring Cloud tra cứu Eureka để tìm IP thực tế của `user-service`, hỗ trợ load balancing nếu có nhiều instance |
| `Path=/api/auth/**, /api/users/**` | Chỉ route các request match pattern này sang User Service |

```yaml
  data:
    redis:
      host: ${REDIS_HOST:redis}
      ssl:
        enabled: false
```

| Config | Giải thích |
|--------|-----------|
| `${REDIS_HOST:redis}` | Cú pháp SpEL: đọc env var `REDIS_HOST`, nếu không có thì dùng giá trị mặc định `redis` (tên container) |
| `ssl.enabled: false` | Redis container cùng Docker network → traffic không ra Internet → không cần mã hóa TLS |

```yaml
eureka:
  client:
    enabled: true
    service-url:
      defaultZone: ${EUREKA_URL:http://discovery-server:8761/eureka/}
```

Gateway đăng ký bản thân vào Eureka Server. `discovery-server` là tên container trong Docker Compose → Docker DNS tự resolve thành IP nội bộ.

**⚠️ Bài học DuplicateKeyException:** YAML **không cho phép** 2 key cùng tên ở cùng cấp độ. Ban đầu file có 2 block `spring:` riêng biệt → Spring Boot crash ngay khi khởi động. Fix: gom tất cả config con (`cloud.gateway` và `data.redis`) vào 1 block `spring:` duy nhất.

### User Service — `application-prod.yml`

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
```

| Config | Giải thích |
|--------|-----------|
| `${SPRING_DATASOURCE_URL}` | Không có giá trị mặc định → **bắt buộc** phải có trong `.env.prod` trên server |
| `ddl-auto: update` | Hibernate tự tạo/cập nhật bảng trong DB khi khởi động (phù hợp MVP, production thật nên dùng Flyway migration) |

### CORS Config — `CorsConfig.java`

```java
@Bean
@Order(Ordered.HIGHEST_PRECEDENCE)
public CorsWebFilter corsWebFilter() {
    CorsConfiguration corsConfig = new CorsConfiguration();

    if (allowedOrigins != null && allowedOrigins.length > 0 && !allowedOrigins[0].isEmpty()) {
        corsConfig.setAllowedOrigins(List.of(allowedOrigins));
    }
```

| Code | Giải thích |
|------|-----------|
| `@Order(HIGHEST_PRECEDENCE)` | Filter CORS chạy **ĐẦU TIÊN** trước mọi filter khác (JWT, RateLimit). Nếu CORS fail → trả 403 ngay, không cần xử lý tiếp |
| `!allowedOrigins[0].isEmpty()` | Guard clause: env var `CORS_ORIGINS` rỗng (`""`) vẫn tạo ra mảng 1 phần tử rỗng → check thêm điều kiện này |
| `setAllowedOriginPatterns` | Hỗ trợ wildcard `https://*.vercel.app` → match tất cả Vercel Preview URLs |
| `setAllowCredentials(true)` | Cho phép gửi cookie/JWT header cross-origin |
| `setMaxAge(3600L)` | Browser cache kết quả preflight OPTIONS request 1 giờ → giảm số request CORS |

---

## 6. Nginx & SSL Termination

```nginx
server {
    listen 80;
    server_name api.tuelord.site;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

| Directive | Giải thích |
|-----------|-----------|
| `proxy_pass http://127.0.0.1:8080` | Forward request đến API Gateway container (đã bind localhost) |
| `X-Real-IP` | Truyền IP thật của client cho Gateway (dùng trong Rate Limiting) |
| `X-Forwarded-For` | Chuỗi IP đã đi qua (client → proxy1 → proxy2) |
| `X-Forwarded-Proto` | Cho Spring Boot biết request gốc là HTTPS (dù Nginx forward HTTP nội bộ) |
| `Upgrade` + `Connection` | Hỗ trợ WebSocket upgrade (cho messaging-service tương lai) |
| `proxy_read_timeout 86400s` | Giữ kết nối WebSocket tối đa 24 giờ |

**Certbot tự động thêm block SSL:**
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/api.tuelord.site/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.tuelord.site/privkey.pem;
```

Certbot cũng tạo cron job tự renew certificate mỗi 90 ngày.

---

## 7. Bảo mật hạ tầng

### 7.1 Lỗ hổng Docker-UFW Bypass

**Vấn đề:** Trên Ubuntu, Docker thao tác trực tiếp với `iptables` và **bỏ qua hoàn toàn** UFW firewall rules.

```
UFW rule: DENY 8080 ← Nghĩ rằng đã chặn
Docker:   iptables -A DOCKER ... -p tcp --dport 8080 -j ACCEPT ← Mở lại!
```

Nếu dùng `ports: "8080:8080"` (không có `127.0.0.1`), Docker mở port 8080 ra **toàn thế giới**, bất chấp UFW đang block.

**Giải pháp:** Bind port về localhost:
```yaml
ports:
  - "127.0.0.1:8080:8080"  # Chỉ process trên host machine (Nginx) mới gọi được
```

### 7.2 Phân lớp Network

```
Internet ──→ UFW (port 443) ──→ Nginx ──→ 127.0.0.1:8080 ──→ Gateway
                                                                  │
                                                          Docker Network
                                                                  │
                                                          User Service
                                                          (expose, không ports)
```

- **User Service, Eureka, Redis**: Dùng `expose` → chỉ visible trong Docker network
- **Gateway**: Dùng `ports` nhưng bind `127.0.0.1` → chỉ Nginx truy cập
- **Kết quả**: Không có service nào trực tiếp đón traffic từ Internet

---

## 8. Sự cố & Bài học kinh nghiệm

### Sự cố 1: Invalid Docker Tag (Chữ hoa)

| | Chi tiết |
|---|---------|
| **Lỗi** | `invalid tag "ghcr.io/PhatNguyenTT2/...": repository name must be lowercase` |
| **Nguyên nhân** | `${{ github.repository_owner }}` trả về `PhatNguyenTT2` (giữ nguyên case từ GitHub username) |
| **Fix** | Hardcode `IMAGE_PREFIX: ghcr.io/phatnguyentt2` trong workflow |
| **Bài học** | Docker registry specification (OCI) **bắt buộc** lowercase cho repository name |

### Sự cố 2: DuplicateKeyException (YAML)

| | Chi tiết |
|---|---------|
| **Lỗi** | `DuplicateKeyException: found duplicate key 'spring' in 'reader', line 22` |
| **Nguyên nhân** | File `application-prod.yml` có 2 block `spring:` ở root level (1 cho gateway, 1 cho redis) |
| **Fix** | Gom `data.redis` vào cùng block `spring:` với `cloud.gateway` |
| **Bài học** | YAML spec **cấm** duplicate key tại cùng cấp. Spring Boot strict mode sẽ crash ngay lập tức |

### Sự cố 3: CORS trên Heroku (Đã fix khi migrate)

| | Chi tiết |
|---|---------|
| **Lỗi** | `No 'Access-Control-Allow-Origin' header is present` khi gọi Google OAuth |
| **Nguyên nhân** | CORS config dùng `setAllowedOrigins()` cứng, không cover Vercel Preview URLs |
| **Fix** | Thêm `setAllowedOriginPatterns("https://*.vercel.app")` + đọc từ env vars |
| **Bài học** | Luôn dùng Origin Patterns cho PaaS có dynamic subdomains |

---

## Phụ lục: Tham chiếu file

| File | Đường dẫn | Vai trò |
|------|----------|---------|
| Docker Compose | `backend/docker-compose.prod.yml` | Định nghĩa toàn bộ stack production |
| Env Template | `backend/.env.prod.example` | Template biến môi trường (không chứa secret thật) |
| CI/CD | `.github/workflows/deploy-backend.yml` | Pipeline tự động build + deploy |
| Gateway Config | `backend/api-gateway/src/main/resources/application-prod.yml` | Eureka, Redis, CORS, routing |
| User Config | `backend/user-service/src/main/resources/application-prod.yml` | Database, Eureka |
| CORS Filter | `backend/api-gateway/.../config/CorsConfig.java` | Xử lý cross-origin requests |
| Eureka Dockerfile | `backend/discovery-server/Dockerfile` | Multi-stage build Eureka Server |
| Gateway Dockerfile | `backend/api-gateway/Dockerfile` | Multi-stage build API Gateway |
| User Dockerfile | `backend/user-service/Dockerfile` | Multi-stage build User Service |
