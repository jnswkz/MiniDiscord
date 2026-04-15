"Đóng vai trò là một Cloud Solutions Architect. Hãy cập nhật lại tài liệu 'Hướng dẫn cấu hình .env — MiniDiscord Backend' của tôi để chuyển đổi kiến trúc sang 100% Cloud. Cụ thể:

Thay thế Redis local bằng Upstash Redis.

Thay thế RabbitMQ local bằng CloudAMQP.

Thay thế MinIO local bằng AWS S3 (hoặc Supabase Storage).
Hãy cập nhật lại bảng tổng quan kiến trúc, viết lại nội dung các file .env cho messaging-service, file-service, chat-history-service, và group-channel-service. Cập nhật file application.yml tương ứng và loại bỏ hoàn toàn phần hướng dẫn Docker Compose vì không còn sử dụng local database. Đảm bảo giữ văn phong kỹ thuật, chuyên nghiệp."
REDIS_URL=rediss://default:gQAAAAAAAX6KAAIncDIyMTY4MmFmNmVjYmI0YjBhYTlhMGU1MDZiNWViODM0ZHAyOTc5MzA@up-primate-97930.upstash.io:6379
RABBITMQ_URL=amqps://yztwyspi:qpUhpt_APE2My5U-9GdMGxiVGQyz0wpp@cougar.rmq.cloudamqp.com/yztwyspi

(Backblaze B2)
keyID:
0061956ae3914be0000000001
keyName:
file-service-key
applicationKey:
K006CgWpBIKudVhPb+JUDsQMRS97UBg
