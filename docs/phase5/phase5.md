# Phase P5 — File Service

> **Status:** 📋 PLANNING
> **Ngày lập kế hoạch:** 2026-05-14
> **Service:** `file-service` (port 8085)
> **Storage:** Backblaze B2 (S3-compatible) via MinIO SDK 8.5.14
> **Mục tiêu:** Upload/Download file (ảnh, tài liệu) lên Backblaze B2, trả về Public URL để embed vào message. Hỗ trợ file validation, size limiting, và MIME type filtering.

---

## 1. Overview

### Hiện trạng

`file-service` hiện chỉ có:
- ✅ `FileServiceApplication.java` — entry point + `@EnableDiscoveryClient`
- ✅ `application.yml` — cấu hình B2 endpoint, `max-file-size: 25MB`, Eureka
- ✅ `pom.xml` — dependencies: web, eureka-client, minio 8.5.14, common-lib
- ✅ `.env` — B2_ENDPOINT, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME
- ✅ `Dockerfile` — multi-stage build sẵn sàng
- ✅ `docker-compose.yml` — service đã cấu hình (profile `full`)
- ✅ Gateway route — `/api/files/**` → `lb://file-service`
- 🔴 **Không có bất kỳ Controller/Service/Config nào** → 0% business logic

### Mục tiêu Phase P5

Sau khi hoàn thành, hệ thống sẽ:
1. **Upload file** — Nhận `MultipartFile` từ client, validate, upload lên Backblaze B2, trả về Public URL
2. **Download/View file** — Redirect hoặc proxy file từ B2 (Public bucket URL)
3. **Delete file** — Xóa file khỏi B2 (chỉ sender/admin)
4. **File validation** — Giới hạn size (25MB), whitelist MIME types, ngăn chặn file độc hại
5. **Nhận userId từ Gateway** — Thông qua header `X-User-Id`, reject 401 nếu thiếu (cùng pattern P2/P3/P4)
6. **Tích hợp với messaging** — URL trả về được embed vào `MessageEvent.fileUrl` khi client gửi tin nhắn có đính kèm

---

## 2. Kiến trúc & Luồng dữ liệu

```
Frontend → API Gateway (JWT validation + X-User-Id)
                ↓ (chỉ qua Docker internal network)
        file-service (:8085 — KHÔNG expose ra host)
                │
        ┌───────┴───────┐
        │ Backblaze B2   │ (S3-compatible)
        │ MinIO SDK      │
        │ discord-mini-  │
        │ files (bucket) │
        └───────────────┘
```

### Luồng Upload (Happy Path)

```
1. Client chọn file → POST /api/files/upload (multipart/form-data)
2. Gateway validate JWT → gắn X-User-Id → forward to file-service
3. file-service validate: size ≤ 25MB, MIME type whitelisted
4. Generate unique filename: {userId}/{UUID}.{ext}
5. Upload to B2 via MinIO SDK (putObject)
6. Return FileResponse { fileUrl, fileName, fileSize, contentType }
7. Client attach fileUrl vào tin nhắn → gửi qua WebSocket
```

**Nguyên tắc quan trọng (kế thừa từ P2/P3/P4):**
- Service này **KHÔNG** tự validate JWT. Gateway đã làm → service nhận `X-User-Id` header.
- Service này **KHÔNG** cấu hình CORS. Gateway xử lý tập trung.
- Service này **KHÔNG** expose port ra host trong Docker. Chỉ Gateway (8080) được expose.

---

## 3. Phân tích Trade-offs Kiến trúc

### Q1: Server-side Upload vs Presigned URL (Direct Upload)?

**Phương án A — Server-side Upload (Proxy):**
- Client → API Gateway → `file-service` → B2
- Ưu: Toàn quyền kiểm soát validation, logging, virus scan
- Nhược: file-service phải buffer toàn bộ file → memory pressure

**Phương án B — Presigned URL (Direct Upload):**
- Client → `file-service` (lấy presigned URL) → Client upload trực tiếp B2
- Ưu: Giảm tải server, không buffer file
- Nhược: Phức tạp hơn, khó validate content trước khi upload

**Quyết định: Phương án A (Server-side Upload).** Lý do:
- Dự án MVP, file ≤ 25MB là chấp nhận được cho server proxy
- Kiểm soát hoàn toàn MIME validation trước khi file đến B2
- Đơn giản hóa client-side implementation
- Spring Boot Multipart đã handle streaming hiệu quả

> ⚠️ **Tương lai (P_FINAL):** Khi scale lớn, chuyển sang Presigned URL để giảm tải server.

### Q2: File Naming Strategy

**Quyết định:** `{userId}/{year-month}/{UUID}.{ext}`
- Path-based partitioning theo userId → dễ quản lý, xóa bulk
- Thêm year-month prefix → tránh flat directory quá lớn
- UUID → unique, không collision
- Giữ extension gốc → B2 auto-detect Content-Type

### Q3: Public URL vs Signed URL cho download?

**Quyết định: Public bucket URL.** Lý do:
- B2 bucket `discord-mini-files` đã cấu hình public read
- URL format: `https://f004.backblazeb2.com/file/{bucket-name}/{key}`
- Đơn giản, không cần proxy download qua server
- CDN-friendly (Cloudflare/B2 partnership = free egress)

> ⚠️ **Trade-off:** File đã upload không thể revoke access bằng URL. Chấp nhận vì đây là chat app, file chia sẻ mặc định public trong room.

---

## 4. API Endpoints

### 4.1 File APIs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/files/upload` | ✅ X-User-Id | Upload file (multipart/form-data), trả về `FileResponse` |
| `DELETE` | `/api/files/{fileKey}` | ✅ X-User-Id | Xóa file khỏi B2 (chỉ uploader) |

> ⚠️ **Không cần GET endpoint:** File được truy cập trực tiếp qua B2 Public URL. Không proxy download qua server.

### 4.2 Request/Response Format

**Upload Request:**
```
POST /api/files/upload
Content-Type: multipart/form-data

file: <binary>
```

**Upload Response:**
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://f004.backblazeb2.com/file/discord-mini-files/user123/2026-05/abc-def.png",
    "fileName": "screenshot.png",
    "fileSize": 204800,
    "contentType": "image/png",
    "fileKey": "user123/2026-05/abc-def.png"
  }
}
```

### 4.3 File Validation Rules

| Rule | Value | Lý do |
|------|-------|-------|
| Max file size | 25MB | Cân bằng UX vs server memory |
| Allowed MIME types | `image/*`, `application/pdf`, `text/plain`, `application/zip`, `video/mp4`, `audio/*` | Chặn executable, script |
| Blocked extensions | `.exe`, `.bat`, `.sh`, `.ps1`, `.cmd`, `.msi`, `.dll` | Ngăn chặn malware upload |
| Max filename length | 255 chars | Tránh path traversal, filesystem limits |

---

## 5. File Plan (8 files mới + 2 file sửa)

### 5.1 Tầng DTO (2 files)

```
model/dto/
├── FileResponse.java         # DTO trả về: fileUrl, fileName, fileSize, contentType, fileKey
└── FileValidationException.java  # → nằm trong exception/
```

### 5.2 Tầng Config (2 files)

```
config/
├── B2Config.java             # MinioClient bean từ application.yml properties
└── SecurityHeaderFilter.java # ⚡ STRICT: Reject 401 nếu thiếu X-User-Id (reuse pattern P2)
```

### 5.3 Tầng Service (1 file)

```
service/
└── StorageService.java       # Upload, delete via MinIO SDK. File validation logic.
```

### 5.4 Tầng Controller (1 file)

```
controller/
└── FileController.java       # REST endpoints: POST upload, DELETE file
```

### 5.5 Tầng Exception (2 files)

```
exception/
├── FileValidationException.java  # Invalid file type/size
└── GlobalExceptionHandler.java   # @RestControllerAdvice (pattern từ P2)
```

### 5.6 Docker (sửa)

```
docker-compose.yml            # Chuyển ports → expose (defense-in-depth)
```

---

## 6. Bảo mật: Chống X-User-Id Spoofing (Kế thừa P2)

### 6.1 Docker-level

```yaml
# docker-compose.yml — KHÔNG expose port 8085 ra host
file-service:
  # ports:             ← XÓA HOÀN TOÀN
  #   - "8085:8085"
  expose:
    - "8085"           # Chỉ visible cho containers trong cùng network
```

### 6.2 Application-level (SecurityHeaderFilter — clone từ P2)

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeaderFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        HttpServletRequest request = (HttpServletRequest) req;
        if (request.getRequestURI().startsWith("/actuator")) {
            chain.doFilter(req, res); return;
        }
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            // → 401 Unauthorized
        }
        chain.doFilter(req, res);
    }
}
```

### 6.3 File Upload Security

| Threat | Mitigation |
|--------|-----------|
| Malware upload | MIME type whitelist + extension blacklist |
| Path traversal (`../../../etc/passwd`) | UUID-based naming, strip original path |
| DoS via large files | `max-file-size: 25MB` in `application.yml` |
| MIME type spoofing | Validate cả extension và Content-Type header |
| Filename injection | Sanitize filename, limit to 255 chars |

---

## 7. Unit Test Plan

### 7.1 StorageServiceTest
- `upload_ValidImage_ReturnsFileUrl` — Upload ảnh PNG hợp lệ → trả URL đúng format
- `upload_ExceedsMaxSize_ThrowsException` — File > 25MB → exception
- `upload_BlockedMimeType_ThrowsException` — File .exe → exception
- `upload_EmptyFile_ThrowsException` — File rỗng → exception
- `delete_ExistingFile_Success` — Xóa file thành công

### 7.2 SecurityHeaderFilterTest (Reuse pattern từ P2)
- `request_WithoutXUserId_Returns401`
- `request_WithXUserId_PassesThrough`
- `request_ActuatorPath_SkipsFilter`

### 7.3 FileControllerTest
- `upload_Success_Returns200WithFileUrl`
- `upload_InvalidFile_Returns400`
- `delete_Success_Returns200`

---

## 8. Verification Plan

### 8.1 Unit Test
```bash
cd backend/file-service
mvn clean test
```

### 8.2 Integration Test (Docker)
```bash
cd backend
docker compose --profile full up --build file-service api-gateway discovery-server
```

### 8.3 API Test (curl)
```bash
# Upload file
curl -X POST "http://localhost:8080/api/files/upload" \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@screenshot.png"

# Delete file
curl -X DELETE "http://localhost:8080/api/files/user123%2F2026-05%2Fabc-def.png" \
  -H "Authorization: Bearer <JWT>"
```

---

## 9. Thứ tự triển khai (Task Order)

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| 0 | pom.xml update | Thêm Lombok dependency | — |
| 1 | DTO | `FileResponse` | — |
| 2 | Config | `B2Config` (MinioClient bean), `SecurityHeaderFilter` | Step 0 |
| 3 | Exception | `FileValidationException`, `GlobalExceptionHandler` | — |
| 4 | Service | `StorageService` (upload, delete, validate) | Step 1-3 |
| 5 | Controller | `FileController` (REST: POST upload, DELETE) | Step 4 |
| 6 | Docker | `ports` → `expose` trong docker-compose.yml | — |
| 7 | Unit Test | `StorageServiceTest`, `SecurityHeaderFilterTest`, `FileControllerTest` | Step 4-5 |
| 8 | E2E | Build + test upload/delete từ Gateway | Step 5-7 |

---

## 10. Liên kết với Gateway (Đã sẵn sàng)

Gateway route đã cấu hình từ P0:
```yaml
- id: file-service
  uri: lb://file-service
  predicates:
    - Path=/api/files/**
```

`JwtAuthFilter` đã tự động gắn header `X-User-Id` → `file-service` chỉ cần đọc header này.

---

## 11. Dependency Graph

```text
                common-lib (ApiResponse, BaseException)
                         │
                 ┌───────┼───────────┐
                 ▼       ▼           ▼
           user-service  │     api-gateway
                 │       ▼           │
                 ▼  group-channel    ▼
                    chat-history  file-service ← THIS PHASE
                    messaging        │
                                     ▼
                               Backblaze B2
                              (S3-compatible)
```

---

## 12. Quyết định thiết kế đã chốt

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| Q1 | Upload strategy | Server-side proxy (Phương án A) | MVP scope, full validation control |
| Q2 | File naming | `{userId}/{year-month}/{UUID}.{ext}` | Partition by user, unique, preserves type |
| Q3 | Download method | Public B2 URL (no proxy) | Simple, CDN-friendly, no server load |
| Q4 | Port security | `expose` only + SecurityHeaderFilter 401 | Defense-in-depth (kế thừa P2) |
| Q5 | MIME validation | Whitelist approach | Block unknown/dangerous types by default |
| Q6 | Lombok | Thêm dependency vào pom.xml | Consistency với các service khác |
