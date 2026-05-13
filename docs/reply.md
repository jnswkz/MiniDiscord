1. Rủi ro bảo mật với Redis Cache TTL (Membership)
Vấn đề: Bạn thiết lập cache room:members:{roomId} với TTL 30 phút. Nếu một user bị kick khỏi nhóm (hoặc bị block), trong 30 phút tiếp theo, messaging-service vẫn đọc từ cache và tiếp tục fan-out tin nhắn của nhóm đó về WebSocket của user bị kick.

Cải tiến: Chuyển "TODO (P_FINAL)" thành Must-have ngay trong Phase này. messaging-service cần có một @RabbitListener lắng nghe các event như member.removed hoặc member.left từ group-channel-service để chủ động gọi redisTemplate.delete("room:members:" + roomId) ngay lập tức. Đừng phụ thuộc vào TTL cho các dữ liệu nhạy cảm về quyền truy cập.

2. Định tuyến Typing Indicator & Presence (Xuyên Instance)
Vấn đề: Trong phần Q7, bạn quyết định "Typing indicator: Redis key TTL 3s, bypass RabbitMQ". Nhưng nếu User A (kết nối Server 1) đang gõ phím, làm sao Server 2 biết để push event xuống cho User B? Việc chỉ set key trên Redis là không đủ để trigger một hành động push qua WebSocket ở instance khác.

Cải tiến: Thay vì dùng RabbitMQ (vốn thiết kế cho data cần độ tin cậy cao như tin nhắn), hãy sử dụng Redis Pub/Sub cho các event mang tính "bay hơi" (ephemeral) như Typing và Presence.

Server 1: Publish event TYPING:{roomId} lên Redis channel.

Tất cả Servers: Subscribe channel này, nhận event và check xem có thành viên nào của phòng đang kết nối ở local map không thì push xuống. Nếu rớt gói tin cũng không sao vì tính năng này không cần ACID.

3. Cẩn trọng khi Tích hợp UI/UX trên Frontend
Vấn đề: Khi WebSocket bắt đầu bơm dữ liệu real-time với tốc độ cao, DOM sẽ cập nhật liên tục (đặc biệt khi load lịch sử kết hợp nhận tin mới).

Cải tiến: Khi xử lý state management (Zustand) bên Next.js, hãy kiểm soát chặt chẽ layout hiển thị. Đảm bảo cấu trúc grid/flexbox được giữ nguyên vẹn. Trọng tâm đặc biệt vào phần UserPanel – nó phải được neo cố định bên trong column sidebar được chỉ định. Tuyệt đối không để xảy ra tình trạng khi danh sách channel hoặc tin nhắn quá dài sinh ra thanh cuộn, UserPanel lại bị đẩy lệch hoặc biến thành một phần tử trôi nổi (floating element) làm vỡ cấu trúc tổng thể.

4. Chiến lược Load Testing
Cải tiến: Với thiết kế giới hạn MAX_MESSAGES_PER_SECOND = 5 bằng Lua Script, bạn nên đưa kịch bản này vào kiểm thử độ chịu tải. Hãy thiết lập một Test Plan bằng JMeter (sử dụng plugin WebSocket Sampler) để giả lập hàng trăm user gửi tin nhắn dồn dập cùng lúc. Mục tiêu là kiểm tra xem hàm non-blocking @Async đẩy vào RabbitMQ có hoạt động trơn tru hay không, và kịch bản rate-limit có thực sự chặn được các request vượt ngưỡng mà không làm crash service hay không.

5. Xử lý "Zombie Session" khi Server Crash
Vấn đề: Nếu instance messaging-service bị sập đột ngột (OOM hoặc tắt nóng), event SessionDisconnectEvent sẽ không được trigger, dẫn đến key conn:user:{userId} vẫn tồn tại trên Redis trong tối đa 5 phút.

Cải tiến: Thiết kế hiện tại của bạn dùng putIfAbsent (ghi đè nếu có session mới) khi user reconnect ở instance khác đã xử lý được 90% rủi ro này. Để triệt để hơn, PresenceService có thể thêm một @Scheduled chạy mỗi phút để quét các user có trạng thái ONLINE nhưng key conn:user đã bốc hơi, qua đó ép trạng thái về OFFLINE.