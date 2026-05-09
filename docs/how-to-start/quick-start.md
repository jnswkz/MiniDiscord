# 🚀 MiniDiscord Quick Start Guide (Docker Compose)

Tài liệu này cung cấp các bước nhanh nhất để khởi chạy dự án MiniDiscord bằng Docker Compose. Hệ thống sử dụng kiến trúc **Hybrid**: Application layer chạy trên Docker (local), Database & Message Brokers chạy trên Cloud.

## 🛠 Yêu cầu hệ thống
1. **Docker Desktop** (version 4.x trở lên)
2. **Docker Compose** (V2)
3. **RAM trống:** Tối thiểu 1.5GB cho Core profile, 3.5GB cho Full profile.

---

## 1️⃣ Kiểm tra bảo mật (Pre-flight Check)
Trước khi chạy, bạn **phải** đảm bảo biến `JWT_SECRET` trong 3 file sau đây có giá trị **giống hệt nhau**:
- `backend/user-service/.env`
- `backend/api-gateway/.env`
- `backend/messaging-service/.env`

*(Hiện tại hệ thống đã được đồng bộ chuẩn với 1 chuỗi Base64 duy nhất)*

---

## 2️⃣ Khởi chạy hệ thống (1-Click)

Mở terminal (PowerShell/Bash) và di chuyển vào thư mục `backend`:
```bash
cd backend
```

### Option A: Chạy Core Services (Khuyên dùng cho phát triển UI/Auth)
Profile này chỉ chạy các service thiết yếu, tốn khoảng **~1.3GB RAM**.
```bash
docker compose up -d --build
```
**Danh sách container được chạy:**
- `minidiscord-eureka` (Cổng 8761)
- `minidiscord-user` (Cổng 8081)
- `minidiscord-gateway` (Cổng 8080)
- `minidiscord-frontend` (Cổng 3000)

### Option B: Chạy Full Services (Kiểm thử toàn bộ hệ thống)
Profile này chạy toàn bộ 8 microservices, tốn khoảng **~3.3GB RAM**.
```bash
docker compose --profile full up -d --build
```

---

## 3️⃣ Kiểm tra hoạt động (Verify)

Sau khi chạy xong lệnh, đợi khoảng 30s - 1 phút cho các service khởi động hoàn tất.

1. **Kiểm tra trạng thái Container:**
   ```bash
   docker compose ps
   ```
   Tất cả container phải có trạng thái `Up (healthy)`.

2. **Kiểm tra Service Registry (Eureka):**
   Mở trình duyệt: [http://localhost:8761](http://localhost:8761)
   Đảm bảo thấy `API-GATEWAY` và `USER-SERVICE` hiện lên.

3. **Mở giao diện Web (Frontend):**
   Mở trình duyệt: [http://localhost:3000](http://localhost:3000)
   > **💡 Tính năng Hot-Reload:** Bạn có thể mở code Frontend trên IDE (VS Code) và chỉnh sửa. Giao diện sẽ lập tức tự động cập nhật mà không cần build lại container.

---

## 4️⃣ Các lệnh thao tác thường dùng

**Xem log của toàn bộ hệ thống:**
```bash
docker compose logs -f
```

**Xem log của 1 service cụ thể (VD: api-gateway):**
```bash
docker compose logs -f api-gateway
```

**Dừng hệ thống (Giữ lại data):**
```bash
docker compose down
```

**Dừng hệ thống và xóa Volumes (Reset cache node_modules):**
```bash
docker compose down -v
```

> ⚠️ **Lưu ý:** Việc dừng hệ thống qua lệnh `down` sẽ không làm mất dữ liệu người dùng, vì Database thực tế được lưu trên Cloud (Supabase/MongoDB Atlas).
