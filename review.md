Dưới đây là bản review chi tiết tích hợp toàn bộ các chỉnh sửa, giải pháp cho 6 vấn đề tồn đọng và hoàn thiện spec để bạn sẵn sàng gõ dòng code đầu tiên.

1. Phân tích & Tích hợp Góp ý Kiến trúc
Hai điểm tinh chỉnh kiến trúc đã được chốt hạ hoàn toàn:

RestClient làm tiêu chuẩn: Việc nâng cấp từ RestTemplate/WebClient lên RestClient là chuẩn xác cho Spring Boot 3.4+. Nó mang lại cú pháp fluent, dễ đọc, dễ handle error mà không kéo theo sự cồng kềnh của stack WebFlux. Mục 8.3 trong tài liệu sẽ chính thức sử dụng công cụ này.

Cache Invalidation (P_FINAL): Ghi chú cực kỳ đáng giá. Việc set TTL 1-2 phút cho Caffeine Cache là chưa đủ an toàn nếu user bị kick. Ghi chú R3 sẽ được bổ sung: "TODO (P_FINAL): Lắng nghe event member.removed từ RabbitMQ để evict cache key tương ứng ngay lập tức, ngăn chặn user bị kick tiếp tục đọc tin nhắn mới."

2. Giải quyết triệt để 6 Vấn đề còn vướng mắc
2.1. Inconsistency trong API Path (Mục 5.2 vs 10.3)
Sự sai lệch này rất dễ gây lỗi routing ở Gateway. Mục 5.2 sẽ được đồng bộ hóa hoàn toàn để bám sát nguyên tắc ESR (mọi path đều bắt đầu bằng roomId rồi mới đến channelId).

Update:

PUT /api/messages/rooms/{roomId}/channels/{channelId}/read

GET /api/messages/rooms/{roomId}/channels/{channelId}/unread

2.2. Race Condition khi Update Read Receipt
Phân tích của bạn về thao tác save() gây overwrite là hoàn toàn chính xác. Trong môi trường Multi-device, concurrent writes sẽ làm sai lệch lastReadMessageId.

Giải pháp (Atomic Update): Sử dụng sức mạnh cấp thấp của MongoDB thay vì load entity lên memory rồi save lại. Do lastReadMessageId được lưu dưới dạng chuỗi hex của ObjectId (có tính chất monotonic - tăng dần theo thời gian), ta có thể tận dụng query điều kiện.

Java
@Query("{ 'userId': ?0, 'channelId': ?1, 'lastReadMessageId': { '$lt': ?2 } }")
@Update("{ '$set': { 'lastReadMessageId': ?2, 'lastReadAt': ?3 } }")
void updateLastReadIfNewer(String userId, String channelId, String newReadId, Instant now);
Test Case Bổ sung: markAsRead_OlderMessageId_DoesNotOverwrite (Mock kết quả trả về của update document count = 0 để verify logic).

2.3. Reference Type của replyTo.messageId
Cần làm rõ ranh giới giữa Internal ID (MongoDB _id) và External ID (Event UUID).

Quyết định: replyTo.messageId sẽ lưu UUID (chuỗi String của messageId), tuyệt đối không lưu ObjectId.

Lý do: Frontend chỉ làm việc với hệ quy chiếu UUID sinh ra từ Messaging Service. Việc lookup tin nhắn gốc (nếu cần) vẫn đảm bảo O(1) nhờ vào idx_messageId (UNIQUE). Mục Schema 4.1 sẽ được note rõ: // Lưu ý: Dùng UUID của event, KHÔNG dùng ObjectId của Mongo.

2.4. Phân định rõ Authorization cho DELETE và Read Receipt
Đặc tả phân quyền cần rạch ròi để code Controller và Service không bị lúng túng:

DELETE /messages/{messageId}: Tin cậy JWT (userId == senderId). Không cần check membership. Giống Discord, user có quyền xóa "dấu vết" (tin nhắn của chính mình) kể cả khi họ đã rời khỏi room.

PUT .../read & GET .../unread: Bắt buộc phải check membership (gọi sang group-channel-service). User đã rời room không được phép cập nhật receipt hay truy vấn số lượng tin chưa đọc.

2.5. Performance của getUnreadCount (Capping 99+)
Việc đếm (count) chính xác hàng chục ngàn tin nhắn trong MongoDB sẽ lock resource và gây chậm toàn bộ hệ thống.

Giải pháp (Bounded Count): Giới hạn truy vấn ở mức 100 records.

Java
// Dùng query kết hợp limit để không bao giờ scan quá 100 documents
long count = mongoTemplate.count(query.limit(100), Message.class);
// Trả về DTO: count = 99, hasMore = true
Cập nhật: Sẽ note rõ ở Mục 4.2 và thiết kế DTO ReadReceiptResponse chứa trường String displayCount (hiển thị "99+" nếu chạm limit) để Frontend dễ dàng render mà không cần logic phức tạp.

2.6. Chiến lược Migration cho MongoDB Index
Việc để MongoIndexConfig chạy lúc startup có rủi ro IndexOptionsConflict khi cấu trúc index thay đổi ở các phase sau.

Cập nhật: Thêm một dòng ghi chú rõ ràng vào file config:
// TODO (P_FINAL): Tích hợp Mongock để quản lý versioning schema và index migrations an toàn trên production, thay vì chạy script thủ công lúc startup.

Tổng kết
Bản kế hoạch Phase P3 hiện tại đã đạt tiêu chuẩn Production-Ready Spec. Mọi "lỗ hổng" về luồng dữ liệu, hiệu năng truy vấn, và tranh chấp tài nguyên (concurrency) đều đã có hướng giải quyết cụ thể và được ánh xạ trực tiếp thành các Unit Test Cases.