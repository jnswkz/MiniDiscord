# Báo Cáo Chuyển Đổi Nền Tảng (Docker Compose Migration)

**Ngày báo cáo:** 10/05/2026
**Mục tiêu:** Đóng gói toàn bộ kiến trúc Application Layer của MiniDiscord vào Docker Compose để đạt được trải nghiệm "1-click start".

## 1. Đánh giá Tiến Độ
- **Trạng thái:** Đã hoàn thành 100%.
- **Các thành phần đã triển khai:**
  - 8 Dockerfiles cho 8 Spring Boot Microservices (với tính năng Maven Dependency Caching).
  - 1 Dockerfile cho Next.js Frontend (với cấu hình Hot-reload cho môi trường dev).
  - File điều phối `docker-compose.yml` định cấu hình Network, Port, Profiles và Memory Limits.
  - Cập nhật đồng bộ các khóa bảo mật JWT.

## 2. Ảnh hưởng đến Phase 0 và 1A (common-lib & user-service)
> **Kết luận: Mã nguồn logic và kiến trúc của Phase 0 & 1A KHÔNG bị thay đổi.**

**Phân tích chi tiết:**
1. **Source Code (Java/Spring):** Toàn bộ code logic trong `common-lib` và `user-service` (bao gồm các file Entity, Controller, Service, Filter) **được giữ nguyên vẹn**. Docker chỉ thay đổi cách thức môi trường chạy (đóng gói JRE 17 vào container) thay vì chạy trực tiếp trên máy host.
2. **Cấu hình (Config):** Sự thay đổi duy nhất nằm ở file `application.yml` của `discovery-server`, nơi cấu hình `hostname: ${EUREKA_HOSTNAME:localhost}` được thêm vào. Điều này giúp hệ thống tương thích ngược: vẫn chạy bình thường nếu bạn không dùng Docker, và chạy mượt mà qua Docker DNS.
3. **Bảo mật (JWT):** Phase này đã phát hiện và vá một lỗi tiềm ẩn về sự không đồng nhất khóa JWT giữa `user-service` và `api-gateway`. Việc này hoàn thiện hơn Phase 1A mà không làm thay đổi phương thức mã hóa (vẫn là HMAC-SHA).
4. **Database:** Cả 2 Database PostgreSQL trên Supabase hoàn toàn không bị chạm đến, dữ liệu vẫn an toàn và giữ nguyên trạng thái kiến trúc Hybrid.

## 3. Các quyết định kỹ thuật quan trọng (ADR)
- **Maven Dependency Caching:** Quá trình build Dockerfile cho Java thường rất chậm. Chúng tôi đã tách việc `COPY pom.xml` và `mvn dependency:go-offline` lên trước `COPY src`. Kết quả: Lần build thứ 2 trở đi chỉ mất vài giây thay vì vài phút.
- **Frontend Hot-Reloading:** Dùng cơ chế `volumes` (bind-mount) để ánh xạ code Frontend từ máy Host vào Container. Khi dev sửa code trên VS Code, Web tự động cập nhật mà không cần restart Docker.
- **Resource Limits:** Giới hạn tổng RAM cho Core Profile ở mức ~1.3GB (256MB cho Discovery/Gateway, 512MB cho User Service) để tránh việc Docker ngốn cạn bộ nhớ máy tính.
- **Docker Profiles:** Phân tách hệ thống thành `core` (mặc định) và `full`, giúp giảm tải gánh nặng khởi động cho những máy tính có cấu hình yếu.

## 4. Tầm nhìn tiếp theo
- Hệ thống đã sẵn sàng 100% về hạ tầng local dev.
- Mở khóa cho Phase P1B (Xây dựng API Gateway và định tuyến Request) và P2 (Group Channel & Chat History). Mọi developer mới gia nhập chỉ cần cài Docker và chạy 1 lệnh duy nhất.
