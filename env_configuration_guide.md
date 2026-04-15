# 🔧 Hướng dẫn cấu hình `.env` — MiniDiscord Backend

> **Tình huống:** Dự án sử dụng cloud databases (Supabase PostgreSQL + MongoDB Atlas) thay vì Docker local.

---

## 📊 Tổng quan kiến trúc hiện tại

| Service | Port | Database | Cloud Provider |
|---------|------|----------|----------------|
| **Discovery Server** | 8761 | — | — |
| **Config Server** | 8888 | — | — |
| **API Gateway** | 8080 | — | — |
| **User Service** | 8081 | PostgreSQL | Supabase (ap-southeast-2) |
| **Group-Channel Service** | 8082 | PostgreSQL | Supabase (ap-northeast-1) |
| **Chat History Service** | 8083 | MongoDB | MongoDB Atlas |
| **Messaging Service** | 8084 | Redis | Local (Docker) |
| **File Service** | 8085 | MinIO | Local (Docker) |

### Mapping Database URLs

| Service | URL gốc (bạn cung cấp) | Dùng cho |
|---------|-------------------------|----------|
| ChatHistoryService | `mongodb+srv://fullstack:1235abzc@cluster0.dcbrknd.mongodb.net/ChatHistoryService` | MongoDB Atlas |
| UserService | `postgresql://postgres.wjczkrkbcqgkjpvupupb:nhincaidjtmemay123@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres` | Supabase PG |
| Group-Channel | `postgresql://postgres.ocowvsmaijwyjbrffxzr:nhincaidjtmemay123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres` | Supabase PG |

---

## 🗂️ Cách tổ chức file `.env`

### Phương án đề xuất: **Mỗi service có `.env` riêng** + **1 file `.env` tổng tại `docker/`**

```
backend/
├── docker/
│   └── .env                    ← Cho Docker Compose (Redis, RabbitMQ, MinIO)
├── user-service/
│   └── .env                    ← DB credentials cho User Service
├── group-channel-service/
│   └── .env                    ← DB credentials cho Group-Channel Service
├── chat-history-service/
│   └── .env                    ← DB credentials cho Chat History Service
├── messaging-service/
│   └── .env                    ← Redis/RabbitMQ credentials
├── api-gateway/
│   └── .env                    ← JWT secret (nếu gateway validate)
└── file-service/
    └── .env                    ← MinIO credentials
```

> [!IMPORTANT]
> **Tất cả file `.env` PHẢI được thêm vào `.gitignore`!** Không bao giờ commit credentials lên Git.

---

## 📝 Nội dung chi tiết từng file `.env`

### 1. `backend/docker/.env` — Docker Compose (local services)

> Chỉ cho Redis, RabbitMQ, MinIO (chạy local Docker). **KHÔNG cần PostgreSQL/MongoDB containers** vì đã dùng cloud.

```env
# ============================================
# Discord Mini — Docker Environment Variables
# Chỉ cho local infrastructure services
# ============================================

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Redis
REDIS_PASSWORD=

# MinIO (S3-compatible)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT (shared across services)
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026
```

---

### 2. `backend/user-service/.env`

```env
# ============================================
# User Service — Environment Variables
# Database: Supabase PostgreSQL (ap-southeast-2)
# ============================================

# PostgreSQL (Supabase)
DB_URL=jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
DB_USERNAME=postgres.wjczkrkbcqgkjpvupupb
DB_PASSWORD=nhincaidjtmemay123

# JWT
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

> [!WARNING]
> **JDBC URL khác với raw PostgreSQL URL!**
> - Raw: `postgresql://user:pass@host:5432/db`
> - JDBC: `jdbc:postgresql://host:5432/db` (username/password riêng biệt)
>
> Supabase sử dụng format `postgres.{project-ref}` cho username.

---

### 3. `backend/group-channel-service/.env`

```env
# ============================================
# Group-Channel Service — Environment Variables
# Database: Supabase PostgreSQL (ap-northeast-1)
# ============================================

# PostgreSQL (Supabase)
DB_URL=jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
DB_USERNAME=postgres.ocowvsmaijwyjbrffxzr
DB_PASSWORD=nhincaidjtmemay123

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

### 4. `backend/chat-history-service/.env`

```env
# ============================================
# Chat History Service — Environment Variables
# Database: MongoDB Atlas
# ============================================

# MongoDB Atlas
MONGODB_URI=mongodb+srv://fullstack:1235abzc@cluster0.dcbrknd.mongodb.net/ChatHistoryService?retryWrites=true&w=majority&appName=Cluster0

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

### 5. `backend/messaging-service/.env`

```env
# ============================================
# Messaging Service — Environment Variables
# Cache: Redis (local Docker)
# ============================================

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# JWT (để validate WebSocket connections)
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

### 6. `backend/api-gateway/.env`

```env
# ============================================
# API Gateway — Environment Variables
# ============================================

# JWT (để validate tokens tại gateway)
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

### 7. `backend/file-service/.env`

```env
# ============================================
# File Service — Environment Variables
# Storage: MinIO (local Docker)
# ============================================

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=discord-mini-files

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

## 🔄 Cập nhật `application.yml` — Sử dụng environment variables

Bạn **PHẢI** cập nhật `application.yml` của 3 service chính để đọc từ `.env`:

### user-service/src/main/resources/application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: user-service
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/discord_mini_users}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-change-in-production}
  expiration: 86400000  # 24 hours

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka/}
```

### group-channel-service/src/main/resources/application.yml

```yaml
server:
  port: 8082

spring:
  application:
    name: group-channel-service
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/discord_mini_groups}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka/}
```

### chat-history-service/src/main/resources/application.yml

```yaml
server:
  port: 8083

spring:
  application:
    name: chat-history-service
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/discord_mini_chat}
      auto-index-creation: true
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka/}
```

---

## ⚙️ Cách Spring Boot đọc `.env`

> [!NOTE]
> Spring Boot **KHÔNG tự động** đọc file `.env` như Node.js! Có 3 cách:

### Cách 1: ✅ Dùng IntelliJ IDEA Run Configuration (Khuyên dùng)

1. **Run → Edit Configurations** → chọn service application
2. Tab **Environment variables** → click icon folder
3. Chọn file `.env` tương ứng của service
4. Apply & Run

### Cách 2: Set environment variables trước khi chạy (PowerShell)

```powershell
# Load .env file vào session PowerShell
Get-Content .\user-service\.env | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

# Chạy service
cd user-service
mvn spring-boot:run
```

### Cách 3: Dùng `spring-dotenv` dependency

Thêm vào `pom.xml` của service:
```xml
<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>4.0.0</version>
</dependency>
```
→ Spring Boot tự động đọc `.env` file trong root directory của service.

---

## 🐳 Cập nhật Docker Compose (bỏ PostgreSQL & MongoDB containers)

Vì bạn dùng cloud databases, file `docker-compose.yml` chỉ cần giữ **Redis, RabbitMQ, MinIO**:

```yaml
services:
  # ============================================
  # Redis — Cache, Connection Manager, Pub/Sub
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: discord-mini-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # RabbitMQ — Message Broker
  # ============================================
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: discord-mini-rabbitmq
    ports:
      - "5672:5672"     # AMQP
      - "15672:15672"   # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-guest}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS:-guest}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # MinIO — S3-compatible Object Storage
  # ============================================
  minio:
    image: minio/minio:latest
    container_name: discord-mini-minio
    ports:
      - "9000:9000"     # API
      - "9001:9001"     # Console
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
  rabbitmq_data:
  minio_data:
```

---

## 🚀 Thứ tự khởi động services

```
1. docker compose up -d          ← Redis, RabbitMQ, MinIO
2. discovery-server  (port 8761) ← Eureka phải khởi động đầu tiên
3. config-server     (port 8888) ← Phụ thuộc Eureka
4. api-gateway       (port 8080) ← Phụ thuộc Eureka
5. user-service      (port 8081) ← Kết nối Supabase PG
6. group-channel-service (port 8082) ← Kết nối Supabase PG
7. chat-history-service  (port 8083) ← Kết nối MongoDB Atlas
8. messaging-service     (port 8084) ← Kết nối Redis local
9. file-service          (port 8085) ← Kết nối MinIO local
```

---

## 🔐 Lưu ý bảo mật

> [!CAUTION]
> **Credentials hiện tại đang ở dạng plaintext.** Hãy đảm bảo:
> 1. **Thêm `.env` vào `.gitignore`** ngay lập tức
> 2. **Không commit** file `.env` lên repository
> 3. **Đổi mật khẩu** database trước khi deploy production
> 4. **JWT_SECRET** phải >= 256 bits (32 ký tự) và đủ phức tạp

### Kiểm tra `.gitignore`

```gitignore
# Environment variables
.env
*.env
.env.*
!.env.example
```

---

## ✅ Checklist xác nhận

- [ ] Tạo file `.env` cho mỗi service
- [ ] Cập nhật `application.yml` để dùng `${ENV_VAR:default}`
- [ ] Thêm `.env` vào `.gitignore`
- [ ] Test kết nối Supabase PG từ user-service
- [ ] Test kết nối Supabase PG từ group-channel-service
- [ ] Test kết nối MongoDB Atlas từ chat-history-service
- [ ] Docker Compose up (Redis + RabbitMQ + MinIO)
- [ ] Khởi động Eureka → Config → Gateway → Services
