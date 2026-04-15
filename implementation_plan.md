# 🔧 Chuyển đổi MiniDiscord Backend sang 100% Cloud Infrastructure

Chuyển toàn bộ local infrastructure (Redis, RabbitMQ, MinIO) sang cloud providers. Tạo `.env` riêng cho từng microservice. Loại bỏ Docker Compose. Cập nhật `application.yml` tương ứng.

---

## User Review Required

> [!IMPORTANT]
> **Backblaze B2 + MinIO SDK:** Backblaze B2 tương thích S3 API, nên MinIO SDK hiện tại trong `file-service` có thể giữ nguyên — chỉ thay endpoint sang B2 S3-compatible URL (`s3.us-west-004.backblazeb2.com`). **Không cần đổi dependency.**

> [!WARNING]
> **CloudAMQP (RabbitMQ):** URL `amqps://` sử dụng **TLS/SSL trên port 5671** (khác với local port 5672). Cần cấu hình `spring.rabbitmq.ssl.enabled=true` cho tất cả services dùng RabbitMQ.

> [!WARNING]
> **Upstash Redis:** URL `rediss://` sử dụng **TLS/SSL trên port 6379**. Cần cấu hình `spring.data.redis.ssl.enabled=true`.

---

## Proposed Changes

### Tổng quan kiến trúc mới (100% Cloud)

| Service | Port | Database/Infra | Cloud Provider |
|---------|------|----------------|----------------|
| **Discovery Server** | 8761 | — | — (local) |
| **Config Server** | 8888 | — | — (local) |
| **API Gateway** | 8080 | — | — (local) |
| **User Service** | 8081 | PostgreSQL | **Supabase** (ap-southeast-2) |
| **Group-Channel Service** | 8082 | PostgreSQL + RabbitMQ | **Supabase** (ap-northeast-1) + **CloudAMQP** |
| **Chat History Service** | 8083 | MongoDB + RabbitMQ | **MongoDB Atlas** + **CloudAMQP** |
| **Messaging Service** | 8084 | Redis + RabbitMQ | **Upstash** + **CloudAMQP** |
| **File Service** | 8085 | Object Storage | **Backblaze B2** (S3-compatible) |

---

### Component 1: File `.env` cho từng Microservice

#### [NEW] `backend/user-service/.env`
```env
# PostgreSQL (Supabase)
DB_URL=jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
DB_USERNAME=postgres.wjczkrkbcqgkjpvupupb
DB_PASSWORD=nhincaidjtmemay123

# JWT
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

#### [NEW] `backend/group-channel-service/.env`
```env
# PostgreSQL (Supabase)
DB_URL=jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
DB_USERNAME=postgres.ocowvsmaijwyjbrffxzr
DB_PASSWORD=nhincaidjtmemay123

# RabbitMQ (CloudAMQP)
RABBITMQ_HOST=cougar.rmq.cloudamqp.com
RABBITMQ_PORT=5671
RABBITMQ_USER=yztwyspi
RABBITMQ_PASS=qpUhpt_APE2My5U-9GdMGxiVGQyz0wpp
RABBITMQ_VHOST=yztwyspi
RABBITMQ_SSL=true

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

#### [NEW] `backend/chat-history-service/.env`
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://fullstack:1235abzc@cluster0.dcbrknd.mongodb.net/ChatHistoryService?retryWrites=true&w=majority&appName=Cluster0

# RabbitMQ (CloudAMQP)
RABBITMQ_HOST=cougar.rmq.cloudamqp.com
RABBITMQ_PORT=5671
RABBITMQ_USER=yztwyspi
RABBITMQ_PASS=qpUhpt_APE2My5U-9GdMGxiVGQyz0wpp
RABBITMQ_VHOST=yztwyspi
RABBITMQ_SSL=true

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

#### [NEW] `backend/messaging-service/.env`
```env
# Redis (Upstash)
REDIS_HOST=up-primate-97930.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=gQAAAAAAAX6KAAIncDIyMTY4MmFmNmVjYmI0YjBhYTlhMGU1MDZiNWViODM0ZHAyOTc5MzA
REDIS_SSL=true

# RabbitMQ (CloudAMQP)
RABBITMQ_HOST=cougar.rmq.cloudamqp.com
RABBITMQ_PORT=5671
RABBITMQ_USER=yztwyspi
RABBITMQ_PASS=qpUhpt_APE2My5U-9GdMGxiVGQyz0wpp
RABBITMQ_VHOST=yztwyspi
RABBITMQ_SSL=true

# JWT
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

#### [NEW] `backend/file-service/.env`
```env
# Backblaze B2 (S3-compatible)
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_KEY_ID=0061956ae3914be0000000001
B2_APP_KEY=K006CgWpBIKudVhPb+JUDsQMRS97UBg
B2_BUCKET_NAME=discord-mini-files

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

#### [NEW] `backend/api-gateway/.env`
```env
# JWT
JWT_SECRET=mY5uP3rS3cR3tK3yF0rJwT-Ch4ng3Th1s1nPr0duct10n-M1n1D1sc0rd2026

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

---

### Component 2: Cập nhật `application.yml`

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/user-service/src/main/resources/application.yml)
- `datasource.url` → `${DB_URL:...}`
- Thêm `${EUREKA_URL}` thay cho hardcoded URL

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/group-channel-service/src/main/resources/application.yml)
- `datasource.url` → `${DB_URL:...}`
- `rabbitmq` → dùng env vars + thêm `ssl.enabled`, `virtual-host`
- Thêm `${EUREKA_URL}`

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/chat-history-service/src/main/resources/application.yml)
- `mongodb.uri` → `${MONGODB_URI:...}`
- `rabbitmq` → dùng env vars + thêm `ssl.enabled`, `virtual-host`
- Thêm `${EUREKA_URL}`

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/messaging-service/src/main/resources/application.yml)
- `redis` → `${REDIS_HOST}`, `${REDIS_PORT}`, `${REDIS_PASSWORD}`, `ssl.enabled`
- `rabbitmq` → dùng env vars + thêm `ssl.enabled`, `virtual-host`
- Thêm `${EUREKA_URL}`

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/file-service/src/main/resources/application.yml)
- Thay config `minio.*` thành `b2.*` cho Backblaze B2
- Thêm `${EUREKA_URL}`

#### [MODIFY] [application.yml](file:///d:/MiniDiscord/backend/api-gateway/src/main/resources/application.yml)
- Thêm `${EUREKA_URL}`

---

### Component 3: Loại bỏ Docker Compose

#### [DELETE] [docker-compose.yml](file:///d:/MiniDiscord/backend/docker/docker-compose.yml)
#### [DELETE] [.env.example](file:///d:/MiniDiscord/backend/docker/.env.example)
#### [DELETE] [init-db.sql](file:///d:/MiniDiscord/backend/docker/init-db.sql)

> Toàn bộ thư mục `backend/docker/` sẽ bị xóa vì không còn local infrastructure.

---

### Component 4: Cập nhật `.gitignore`

#### [MODIFY] [.gitignore](file:///d:/MiniDiscord/.gitignore)
- Đảm bảo pattern `**/.env` bắt được `.env` trong các subdirectories
- Thêm `!**/.env.example` để giữ lại file example

---

### Component 5: Tạo `.env.example` tổng hợp

#### [NEW] `backend/.env.example`
- File template (không chứa credentials thực) để team member biết cần cấu hình gì

---

## Open Questions

> [!IMPORTANT]
> **Backblaze B2 Bucket:** Bạn đã tạo bucket `discord-mini-files` trên Backblaze B2 chưa? Bucket name cần được xác nhận trước khi cấu hình.

> [!IMPORTANT]
> **Backblaze B2 Region:** KeyID `0061956ae3914be0000000001` — tôi đang giả định region là `us-west-004`. Bạn có thể xác nhận region chính xác từ B2 Dashboard → Buckets → Endpoint URL?

---

## Verification Plan

### Automated Tests
1. Mỗi service khởi động thành công với `.env` mới
2. `user-service` kết nối được Supabase PG (kiểm tra `GET /actuator/health`)
3. `chat-history-service` kết nối được MongoDB Atlas
4. `messaging-service` kết nối được Upstash Redis + CloudAMQP
5. `file-service` kết nối được Backblaze B2

### Manual Verification
- Kiểm tra `.env` không xuất hiện trong `git status`
- Kiểm tra RabbitMQ Management UI qua CloudAMQP dashboard
- Upload 1 file test qua `file-service` → verify trên B2 dashboard
