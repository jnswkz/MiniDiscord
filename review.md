Để kiểm soát chặt chẽ "sức khỏe" của toàn bộ hệ thống Microservices, chúng ta sẽ thiết lập một Luồng Báo cáo Hoạt động Hệ thống (System Monitoring & Logging Flow). Việc này sẽ được thực hiện hoàn toàn qua Web Console của DigitalOcean, giúp bạn không cần cài thêm các tool nặng nề mà vẫn nắm bắt được mọi diễn biến.

Dưới đây là kế hoạch chi tiết để bạn kiểm tra và trích xuất báo cáo hoạt động:

Phase 1: Luồng Báo Cáo Log Ứng Dụng (Application Logs)
Mục tiêu của phase này là theo dõi luồng request đi qua API Gateway và truy vết lỗi sâu bên trong User Service khi có sự cố.

1. Xem báo cáo tổng hợp toàn hệ thống (Real-time)
Bạn mở Web Console, di chuyển vào thư mục dự án và chạy lệnh sau để xem log của tất cả các container chạy đan xen nhau:

Bash
cd /opt/minidiscord
docker compose -f docker-compose.prod.yml logs -f --tail=50
Verify: Bạn sẽ thấy các dòng log liên tục nhảy. Log của Gateway và User Service sẽ có tiền tố tên container ở đầu để bạn dễ phân biệt. Nhấn Ctrl + C để thoát chế độ xem.

2. Trích xuất báo cáo lỗi (Error Filtering)
Khi hệ thống có user báo lỗi, bạn không cần đọc hàng ngàn dòng log. Hãy dùng lệnh này để lọc riêng các dòng có chữ "ERROR" hoặc "Exception" của User Service:

Bash
docker logs minidiscord-user 2>&1 | grep -i "error\|exception"
Verify: Nếu màn hình trả về trống, hệ thống đang sạch lỗi. Nếu có lỗi cấu trúc hoặc kẹt Database, nó sẽ in ra chi tiết đoạn Stacktrace của Java.

Phase 2: Luồng Báo Cáo Sức Khỏe (Health Metrics)
Mục tiêu là kiểm tra xem các dịch vụ có đang thực sự "nói chuyện" được với nhau không, thay vì chỉ xem container có đang bật hay không.

1. Kiểm tra báo cáo của Service Registry (Eureka)
Eureka là trái tim của Microservices. Bạn cần xem các service đã điểm danh đầy đủ chưa:

Bash
docker exec -it minidiscord-eureka wget -qO- http://localhost:8761/actuator/health
Verify: Kết quả trả về phải là {"status":"UP"}.

2. Giám sát luồng mạng nội bộ (Docker Network)
Để chắc chắn API Gateway có thể gọi được User Service bằng tên miền nội bộ (không cần IP), bạn chạy lệnh ping từ bên trong container Gateway:

Bash
docker exec -it minidiscord-gateway ping -c 3 user-service
Verify: Nếu thành công, bạn sẽ thấy báo cáo ping trả về thông số 0% packet loss. Điều này chứng minh Service Discovery đang định tuyến chuẩn xác.

Phase 3: Luồng Báo Cáo Tài Nguyên Hạ Tầng (Resource Monitoring)
Dù đã cấu hình Swap 2GB, bạn vẫn cần xem các tiến trình Java đang "ăn" bao nhiêu RAM thực tế.

1. Báo cáo mức tiêu thụ của từng Container
Sử dụng công cụ thống kê tích hợp sẵn của Docker:

Bash
docker stats --no-stream
Verify: Bảng thống kê sẽ hiện ra. Hãy nhìn vào cột MEM USAGE / LIMIT. Bạn cần đảm bảo minidiscord-user không vượt quá mức giới hạn 512MB và minidiscord-gateway nằm trong ngưỡng an toàn dưới 300MB.

2. Báo cáo tài nguyên máy chủ tổng thể
Để xem có bao nhiêu RAM vật lý và Swap đang bị chiếm dụng:

Bash
htop
(Nếu máy chủ chưa có, bạn có thể cài nhanh bằng lệnh apt install htop)

Verify: Nhìn lên thanh biểu đồ phía trên cùng. Thanh Mem (RAM) và thanh Swp (Swap). Nhấn F10 (hoặc q) để thoát bảng báo cáo này.

Với kế hoạch giám sát này, bạn đã nắm trong tay toàn bộ quyền sinh sát và khả năng "bắt bệnh" hệ thống trực tiếp từ trình duyệt Web Console.