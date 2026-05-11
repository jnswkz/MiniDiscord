# 🚦 Báo Cáo & Hướng Dẫn Verify Tiến Độ Hạ Tầng (DigitalOcean)

> **Tài liệu vận hành**: Cẩm nang từng bước để thực hiện thao tác trên server và verify trạng thái từng thành phần hạ tầng.
> Cập nhật: 2026-05-11

---

## Giai đoạn 1: Chuẩn bị Server (SSH vào Droplet)

Mở Terminal và kết nối: `ssh root@139.59.240.137`

### Bước 1.1 — Tạo Swap 2GB (Safety net cho bộ nhớ)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**✅ Verify:**
```bash
free -h
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| Dòng `Swap:` hiện `2.0G` | Swap đã hoạt động |
| Dòng `Swap:` hiện `0B` | ❌ **Sai** — chạy lại lệnh trên |

---

### Bước 1.2 — Cấu hình Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

**✅ Verify:**
```bash
ufw status
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| `Status: active` + chỉ có port `22`, `80`, `443` | Firewall đúng |
| Xuất hiện port `8080` | ❌ **Nguy hiểm** — Gateway bị lộ ra Internet, gõ `ufw delete allow 8080` |

---

### Bước 1.3 — Cài đặt Nginx & Cấu hình Reverse Proxy

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx

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
```

**✅ Verify:**
```bash
nginx -t
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| `syntax is ok` + `test is successful` | Config Nginx hợp lệ |
| `emerg` hoặc `error` | ❌ Lỗi cú pháp — kiểm tra file config |

---

### Bước 1.4 — Cài đặt Certbot SSL (Let's Encrypt)

```bash
certbot --nginx -d api.tuelord.site --non-interactive --agree-tos -m tuenguyen2005@gmail.com
```

**✅ Verify:**

Mở trình duyệt truy cập `https://api.tuelord.site`

| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| Ổ khóa xanh 🔒 + lỗi `502 Bad Gateway` | ✅ **Đúng** — SSL hoạt động, lỗi 502 vì Docker chưa bật |
| Lỗi `ERR_SSL_PROTOCOL_ERROR` | ❌ Certbot chưa chạy thành công |
| Lỗi `ERR_CONNECTION_REFUSED` | ❌ Nginx chưa chạy hoặc port 443 bị chặn |

---

### Bước 1.5 — Tạo thư mục dự án & đẩy file lên server

**Trên Droplet (SSH):**
```bash
mkdir -p /opt/minidiscord
```

**Trên máy local (Terminal mới, KHÔNG SSH):**
```bash
scp backend/docker-compose.prod.yml root@139.59.240.137:/opt/minidiscord/
```

**Quay lại Droplet (SSH) — tạo file biến môi trường:**
```bash
nano /opt/minidiscord/.env.prod
```
Dán nội dung từ file `backend/.env.prod.example`, điền giá trị thật. Nhấn `Ctrl+O` → `Enter` → `Ctrl+X` để lưu.

**✅ Verify:**
```bash
ls -la /opt/minidiscord/
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| Thấy `docker-compose.prod.yml` và `.env.prod` | ✅ File đã sẵn sàng |
| Thiếu bất kỳ file nào | ❌ Chạy lại lệnh `scp` hoặc `nano` |

---

## Giai đoạn 2: Chuẩn bị External Services (Trên trình duyệt)

### 2.1 — GitHub Secrets

Vào **Settings** của repo → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Giá trị | Verify |
|--------|---------|--------|
| `DO_HOST` | `139.59.240.137` | Copy chính xác IP |
| `DO_SSH_KEY` | Nội dung Private Key SSH (ví dụ `~/.ssh/id_rsa`) | Phải bao gồm cả dòng `-----BEGIN` và `-----END` |

### 2.2 — GitHub Packages Visibility

Vào trang **Packages** trên profile GitHub cá nhân:
- Với mỗi package (`minidiscord-eureka`, `minidiscord-user`, `minidiscord-gateway`):
  - **Package settings** → **Danger Zone** → **Change visibility** → **Public**

> [!IMPORTANT]
> Nếu bỏ qua bước này, Droplet sẽ không thể `docker pull` vì chưa login GHCR.

### 2.3 — Google OAuth Console

Vào [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

| Trường | Thêm giá trị |
|--------|--------------|
| **Authorized JavaScript Origins** | `https://api.tuelord.site` |
| **Authorized redirect URIs** | `https://api.tuelord.site/api/auth/google/callback` |

### 2.4 — Vercel Environment Variables

Vào **Vercel Dashboard** → Project **MiniDiscord** → **Settings** → **Environment Variables**

| Variable | Giá trị mới |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.tuelord.site/api` |

> [!WARNING]
> Sau khi đổi biến, **BẮT BUỘC Redeploy** project (Deployments → bản mới nhất → ⋮ → Redeploy). `NEXT_PUBLIC_*` được nhúng lúc build, không thay đổi runtime.

---

## Giai đoạn 3: First Deploy (GitHub Actions)

1. `git commit` và `git push` toàn bộ code lên nhánh `main`
2. Vào GitHub → tab **Actions** → theo dõi workflow `Deploy Backend to DigitalOcean`
3. Chờ tick xanh ✅

**✅ Verify (trên Droplet SSH):**
```bash
docker ps
```
| Container | Port | Trạng thái mong đợi |
|-----------|------|---------------------|
| `minidiscord-redis` | — | `Up` + `(healthy)` |
| `minidiscord-eureka` | 8761 | `Up` + `(healthy)` |
| `minidiscord-gateway` | `127.0.0.1:8080` | `Up` |
| `minidiscord-user` | 8081 | `Up` |

Nếu thiếu container hoặc trạng thái `Restarting`:
```bash
docker logs minidiscord-gateway --tail=50
docker logs minidiscord-user --tail=50
```

---

## Giai đoạn 4: Monitoring & Giám sát sức khỏe hệ thống

> Nội dung dựa trên System Monitoring & Logging Flow.

### 4.1 — Log ứng dụng (Application Logs)

**Xem log real-time toàn hệ thống:**
```bash
cd /opt/minidiscord
docker compose -f docker-compose.prod.yml logs -f --tail=50
```
- Log có tiền tố tên container để phân biệt
- Nhấn `Ctrl+C` để thoát

**Lọc riêng lỗi của User Service:**
```bash
docker logs minidiscord-user 2>&1 | grep -i "error\|exception"
```
| Kết quả | Ý nghĩa |
|---------|---------|
| Màn hình trống | ✅ Không có lỗi |
| Stacktrace Java | ❌ Đọc dòng đầu Stacktrace để xác định nguyên nhân |

### 4.2 — Health Metrics (Kiểm tra Service Discovery)

**Eureka (Service Registry):**
```bash
docker exec -it minidiscord-eureka wget -qO- http://localhost:8761/actuator/health
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| `{"status":"UP"}` | ✅ Eureka hoạt động |

**Kiểm tra luồng mạng nội bộ Docker:**
```bash
docker exec -it minidiscord-gateway ping -c 3 user-service
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| `0% packet loss` | ✅ Gateway kết nối được User Service qua Docker DNS |
| `Name or service not known` | ❌ Sai tên container hoặc chưa cùng network |

**Health check từ bên ngoài (HTTPS):**
```bash
curl -s https://api.tuelord.site/actuator/health
```
| Kết quả mong đợi | Ý nghĩa |
|-------------------|---------|
| `{"status":"UP","service":"api-gateway"}` | ✅ Full-stack hoạt động |
| `502 Bad Gateway` | ❌ Gateway container chưa ready |
| `Connection refused` | ❌ Nginx hoặc Certbot chưa cấu hình |

### 4.3 — Resource Monitoring (Tài nguyên hạ tầng)

**Mức tiêu thụ từng container:**
```bash
docker stats --no-stream
```
| Container | MEM LIMIT | Ngưỡng an toàn |
|-----------|-----------|----------------|
| `minidiscord-redis` | 96 MB | < 64 MB |
| `minidiscord-eureka` | 256 MB | < 200 MB |
| `minidiscord-gateway` | 300 MB | < 250 MB |
| `minidiscord-user` | 512 MB | < 400 MB |

**Tài nguyên máy chủ tổng thể:**
```bash
free -h
```
| Metric | Ngưỡng an toàn |
|--------|----------------|
| RAM Used | < 1.8 GB (trên tổng 2 GB) |
| Swap Used | < 500 MB |

> Nếu Swap Used > 1GB liên tục → hệ thống đang quá tải, cần scale up Droplet.

---

## Giai đoạn 5: Verify End-to-End (Luồng người dùng)

### Checklist cuối cùng

| # | Test case | Lệnh / Hành động | Kết quả mong đợi |
|---|-----------|-------------------|-------------------|
| 1 | Trang login hiển thị | Truy cập `https://minidiscord.vercel.app` | Trang login render đầy đủ |
| 2 | Đăng ký tài khoản | Nhập email + password → Submit | Redirect về dashboard |
| 3 | Đăng nhập thường | Nhập credentials → Login | Dashboard hiển thị user info |
| 4 | Google OAuth | Bấm "Đăng nhập bằng Google" | Popup Google → callback → dashboard |
| 5 | Logout | Bấm Logout | Redirect về trang login |
| 6 | Session persist | Refresh trang khi đã login | Vẫn ở dashboard (JWT trong localStorage) |
| 7 | Health Gateway | `curl -s https://api.tuelord.site/actuator/health` | `{"status":"UP"}` |
| 8 | Eureka internal | `docker exec ... wget -qO- .../actuator/health` | `{"status":"UP"}` |
| 9 | Container status | `docker ps` trên Droplet | 4 container đều `Up` |
| 10 | RAM budget | `docker stats --no-stream` | Tổng MEM < 1.5 GB |
