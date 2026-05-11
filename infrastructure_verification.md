# 🚦 Báo Cáo & Hướng Dẫn Verify Tiến Độ Hạ Tầng (DigitalOcean)

Tài liệu này là cẩm nang từng bước để bạn (USER) thực hiện thao tác trên server và tự tay verify độ chính xác của từng tiến trình "không mơ hồ". AI đã hoàn tất toàn bộ phần việc liên quan đến Code, Cấu hình và CI/CD.

Phần việc của bạn bắt đầu từ đây!

---

## Giai đoạn 1: Chuẩn bị Server (Thực hiện trên Terminal)

Mở Terminal của bạn lên và gõ: `ssh root@139.59.240.137`

### 1. Tạo Swap 2GB (Lớp bảo vệ bộ nhớ)
Chạy lần lượt các lệnh sau:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
> [!TIP]
> **Cách Verify:** Gõ `free -h`. Bạn phải thấy dòng `Swap:` có tổng dung lượng là `2.0G`. Nếu thấy `0B`, bạn đã làm sai.

### 2. Cấu hình Firewall (UFW)
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```
> [!TIP]
> **Cách Verify:** Gõ `ufw status`. Trạng thái phải là `Status: active` và chỉ có các port `22`, `80`, `443` được liệt kê trong danh sách ALLOW. Cổng `8080` tuyệt đối không được xuất hiện ở đây.

### 3. Cài đặt Nginx & Certbot SSL
```bash
apt update && apt install -y nginx certbot python3-certbot-nginx

# Cấu hình Nginx
cat > /etc/nginx/sites-available/api.tuelord.site << 'EOF'
server {
    listen 80;
    server_name api.tuelord.site;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/api.tuelord.site /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Lấy chứng chỉ SSL
certbot --nginx -d api.tuelord.site --non-interactive --agree-tos -m tuenguyen2005@gmail.com
```
> [!TIP]
> **Cách Verify:** 
> 1. Dòng lệnh `nginx -t` phải in ra `syntax is ok` và `test is successful`.
> 2. Mở trình duyệt web truy cập `https://api.tuelord.site`. Bạn sẽ thấy thông báo lỗi "502 Bad Gateway" của Nginx (đây là **TÍN HIỆU TỐT**, chứng tỏ Nginx đã chạy và SSL ổ khóa xanh đã hoạt động, lỗi 502 chỉ là do Docker bên dưới chưa bật).

### 4. Tạo thư mục và đẩy file cấu hình
```bash
mkdir -p /opt/minidiscord
```
> **Bây giờ mở một Terminal mới trên máy local của bạn (không SSH)** và copy file lên server:
```bash
scp backend/docker-compose.prod.yml root@139.59.240.137:/opt/minidiscord/
```
> **Quay lại Terminal SSH (trên Droplet)**, tạo file environment:
```bash
nano /opt/minidiscord/.env.prod
```
Copy nội dung từ file `.env.prod.example` trong source code vào đây, nhớ điền đúng mật khẩu Supabase. Nhấn `Ctrl+O` -> `Enter` -> `Ctrl+X` để lưu.

---

## Giai đoạn 2: Chuẩn bị External Services (Trên Trình duyệt)

1. **GitHub Secrets:**
   - Vào Settings repo của bạn > Secrets > Actions.
   - Tạo secret `DO_HOST` với giá trị `139.59.240.137`.
   - Tạo secret `DO_SSH_KEY` với nội dung file Private Key (ví dụ `~/.ssh/id_rsa`) mà bạn dùng để SSH vào Droplet.

2. **Google OAuth Console:**
   - Vào credentials của Google. Thêm `https://api.tuelord.site` vào cả "Authorized JavaScript Origins" và "Authorized redirect URIs".

3. **Vercel (Frontend):**
   - Vào Settings > Environment Variables. Đổi `NEXT_PUBLIC_API_URL` thành `https://api.tuelord.site/api`.
   - **Bắt buộc:** Phải Redeploy lại project trên Vercel để nó ăn biến môi trường mới.

---

## Giai đoạn 3: The First Deploy! (GitHub Actions)

Mọi thứ đã setup xong. Đây là khoảnh khắc sự thật.

1. Hãy thực hiện lệnh git commit và push toàn bộ source code (bao gồm các thay đổi AI vừa làm trong `backend` và `.github`) lên nhánh `main`.
2. Lên GitHub > tab **Actions**. Bạn sẽ thấy workflow `Deploy Backend to DigitalOcean` đang chạy.
3. Chờ nó chạy xong (có dấu tick xanh).
4. **Vào tab Packages** trên trang cá nhân GitHub, đảm bảo các image `minidiscord-eureka`, `minidiscord-user`, `minidiscord-gateway` đang được set quyền **Public**.

> [!IMPORTANT]
> **Tự động hóa hoàn toàn:** Nếu GitHub Action chạy ra tick xanh, có nghĩa là server đã tự pull image và khởi động Docker thành công (nhờ lệnh SSH trong action).

### Khâu Verify Cuối Cùng 🏆
Trên Terminal Droplet:
```bash
# Xem các container có đang chạy không
docker ps
# Bạn phải thấy 4 container: eureka, gateway, user, redis với trạng thái (Up) hoặc (healthy).

# Check health API Gateway (bên ngoài)
curl -s https://api.tuelord.site/actuator/health
# Mong đợi output: {"status":"UP","service":"api-gateway"}
```
Vào trang web `minidiscord.vercel.app` của bạn, thử bấm **Đăng nhập bằng Google**. Nếu đăng nhập thành công và vào được Dashboard, xin chúc mừng — toàn bộ hệ thống đã lên DigitalOcean hoàn mỹ!
