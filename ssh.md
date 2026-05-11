Bạn hãy mở Web Console của DigitalOcean lên và làm đúng 4 lệnh sau:

Bước 1: Tạo khóa mới (Không mật khẩu, chuẩn Linux)
Dán lệnh sau vào Web Console và nhấn Enter. Nó sẽ tạo ra một bộ khóa mới tên là gh_key dành riêng cho CI/CD mà không có mật khẩu bảo vệ:

Bash
ssh-keygen -t ed25519 -C "github_actions" -f ~/.ssh/gh_key -N ""
Bước 2: Cấp quyền cho khóa mới (Gắn ổ khóa vào cửa)
Đẩy Public Key mới này vào danh sách được phép đăng nhập:

Bash
cat ~/.ssh/gh_key.pub >> ~/.ssh/authorized_keys
Bước 3: Lấy nội dung Private Key sạch
Dùng lệnh cat để in nội dung Private Key mới ra màn hình:

Bash
cat ~/.ssh/gh_key
Bước 4: Cập nhật lên GitHub Secrets
Bạn hãy bôi đen và copy toàn bộ đoạn text vừa in ra trên Web Console (Từ chữ -----BEGIN cho đến hết chữ KEY-----).

Quay lại GitHub > Settings > Secrets and variables > Actions.

Cập nhật lại giá trị cho biến DO_SSH_KEY.

Mẹo quan trọng: Sau khi dán xong, bạn hãy đặt con trỏ chuột ở cuối dòng -----END OPENSSH PRIVATE KEY----- và bấm phím Enter 1 lần để tạo ra một dòng trống ở cuối cùng.

Bấm Update secret.
