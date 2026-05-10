# 🔧 CORS Fix Plan — MiniDiscord Production (v2 — Reviewed)

> **Cập nhật:** Đã tích hợp feedback từ review. Fix 3 được viết lại hoàn toàn theo **Option B (JAR deploy)** đúng như bản kế hoạch v2 đã chốt.

---

## Root Cause

> [!CAUTION]
> Toàn bộ URL Heroku trong codebase đều SAI — thiếu hash suffix. Frontend gọi vào app không tồn tại → Heroku router trả 404 (không có CORS headers) → browser block.

| Vị trí | URL sai | URL đúng |
|--------|---------|----------|
| Frontend (Vercel env) | `minidiscord-gateway.herokuapp.com` | `minidiscord-gateway-bbc581926938.herokuapp.com` |
| `application-prod.yml` | `minidiscord-user.herokuapp.com` | `minidiscord-user-9b155a4891e0.herokuapp.com` |
| `deploy-backend.yml` | `minidiscord-gateway` / `minidiscord-user` | Có suffix hash |
| `implementation_plan.md` | Nhiều chỗ URL cũ | Cần cập nhật |

**CORS Preflight trên URL đúng → 200 OK, headers đầy đủ** — backend code hoạt động tốt.

---

## Proposed Changes

### Fix 1: Vercel Environment Variable (Manual — Bắt buộc)

> [!IMPORTANT]
> Next.js nhúng `NEXT_PUBLIC_*` vào static files lúc build. Sau khi đổi biến, **PHẢI Redeploy** trên Vercel để build mới có hiệu lực.

**Vercel Dashboard → Settings → Environment Variables:**

```
NEXT_PUBLIC_API_URL = https://minidiscord-gateway-bbc581926938.herokuapp.com/api
```

Sau đó: **Deployments → Redeploy** (chọn latest commit).

---

### Fix 2: `application-prod.yml` — Cập nhật fallback URL

#### [MODIFY] [application-prod.yml](file:///e:/UIT/MiniDiscord/backend/api-gateway/src/main/resources/application-prod.yml)

```diff
       routes:
         - id: user-service
-          uri: ${USER_SERVICE_URL:https://minidiscord-user.herokuapp.com}
+          uri: ${USER_SERVICE_URL:https://minidiscord-user-9b155a4891e0.herokuapp.com}
           predicates:
```

> Best practice: fallback URL phải đúng để tránh lỗi nếu env var bị xóa.

---

### Fix 3: `deploy-backend.yml` — Viết lại theo Option B (JAR Deploy)

> [!WARNING]
> **Từ review:** File hiện tại đang dùng Docker workflow (container build/push/release) — **SAI so với kế hoạch v2 đã chốt Option B** (`heroku deploy:jar`). Cần viết lại hoàn toàn, KHÔNG chỉ thay tên app.

#### [MODIFY] [deploy-backend.yml](file:///e:/UIT/MiniDiscord/.github/workflows/deploy-backend.yml)

**Viết lại toàn bộ file theo Option B:**

```yaml
name: Deploy Backend to Heroku
on:
  push:
    branches: [main]
    paths:
      - 'backend/api-gateway/**'
      - 'backend/user-service/**'
      - 'backend/common-lib/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:

jobs:
  deploy-user-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Build User Service JAR
        working-directory: backend
        run: mvn -pl common-lib,user-service -am clean package -DskipTests -q

      - name: Install Heroku CLI + Java Plugin
        run: |
          curl https://cli-assets.heroku.com/install.sh | sh
          heroku plugins:install java

      - name: Deploy JAR to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          heroku deploy:jar backend/user-service/target/*.jar \
            --app minidiscord-user-9b155a4891e0 \
            --jdk 17 \
            --options "-Dspring.profiles.active=prod -Dserver.port=\$PORT"

  deploy-api-gateway:
    runs-on: ubuntu-latest
    needs: deploy-user-service
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Build API Gateway JAR
        working-directory: backend
        run: mvn -pl common-lib,api-gateway -am clean package -DskipTests -q

      - name: Install Heroku CLI + Java Plugin
        run: |
          curl https://cli-assets.heroku.com/install.sh | sh
          heroku plugins:install java

      - name: Deploy JAR to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          heroku deploy:jar backend/api-gateway/target/*.jar \
            --app minidiscord-gateway-bbc581926938 \
            --jdk 17 \
            --options "-Dspring.profiles.active=prod -Dserver.port=\$PORT"
```

**So sánh với file hiện tại:**

| Aspect | File hiện tại (Docker ❌) | Option B (JAR ✅) |
|--------|--------------------------|-------------------|
| Deploy method | `docker build` → `heroku container:push` → `heroku container:release` | `mvn package` → `heroku deploy:jar` |
| Build time | ~8-10 phút (build Docker image) | ~3-5 phút (upload JAR trực tiếp) |
| Heroku stack | `container` (cần `heroku stack:set`) | `heroku-24` (default, không cần set) |
| App names | `minidiscord-gateway` (sai) | `minidiscord-gateway-bbc581926938` (đúng) |

---

### Fix 4: `CorsConfig.java` — Dùng config động (Optional nhưng recommended)

#### [MODIFY] [CorsConfig.java](file:///e:/UIT/MiniDiscord/backend/api-gateway/src/main/java/com/discordmini/gateway/config/CorsConfig.java)

```diff
-        // Allowed origin patterns - allow any domain but support credentials
-        corsConfig.setAllowedOriginPatterns(List.of("*"));
+        // Use explicit origins from config
+        if (allowedOrigins != null && allowedOrigins.length > 0) {
+            corsConfig.setAllowedOrigins(List.of(allowedOrigins));
+        }
+        // Support wildcard patterns (e.g., https://*.vercel.app)
+        if (allowedOriginPatterns != null && allowedOriginPatterns.length > 0
+                && !allowedOriginPatterns[0].isEmpty()) {
+            corsConfig.setAllowedOriginPatterns(List.of(allowedOriginPatterns));
+        }
```

---

### Fix 5: `implementation_plan.md` — Cập nhật URL references

Tất cả URL `minidiscord-gateway.herokuapp.com` và `minidiscord-user.herokuapp.com` trong file kế hoạch gốc cũng cần được cập nhật cho nhất quán.

---

## Checklist thực hiện

| # | Fix | Ai thực hiện | Urgency |
|---|-----|-------------|---------|
| 1 | Vercel `NEXT_PUBLIC_API_URL` + **Redeploy** | 👤 Manual trên Dashboard | 🔴 Critical |
| 2 | `application-prod.yml` fallback URL | 🤖 Code change | 🟡 High |
| 3 | `deploy-backend.yml` viết lại Option B | 🤖 Code change | 🔴 Critical |
| 4 | `CorsConfig.java` config động | 🤖 Code change | 🟢 Optional |
| 5 | `implementation_plan.md` URL references | 🤖 Code change | 🟢 Optional |

## Heroku Config Vars Check

> [!IMPORTANT]
> Sau khi fix code, đảm bảo các env var trên **Heroku Dashboard** của app `minidiscord-gateway-bbc581926938` đã có:

| Var | Value |
|-----|-------|
| `USER_SERVICE_URL` | `https://minidiscord-user-9b155a4891e0.herokuapp.com` |
| `JWT_SECRET` | (giá trị bí mật) |
| `SPRING_DATA_REDIS_HOST` | `*.upstash.io` |
| `SPRING_DATA_REDIS_PORT` | `6379` |
| `SPRING_DATA_REDIS_PASSWORD` | (giá trị bí mật) |
| `CORS_ORIGINS` | `https://minidiscord.vercel.app` |

---

## Verification Plan

### Sau khi apply Fix 1-3 + Redeploy

```bash
# 1. Test CORS preflight
curl -v -X OPTIONS https://minidiscord-gateway-bbc581926938.herokuapp.com/api/auth/google \
  -H "Origin: https://minidiscord.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
# Expected: 200 + Access-Control-Allow-Origin: https://minidiscord.vercel.app

# 2. Test actual POST
curl -X POST https://minidiscord-gateway-bbc581926938.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Expected: 4xx from Spring (not heroku-router)
```

### Browser Test
1. Mở `https://minidiscord.vercel.app/login`
2. Đăng nhập email/password → kiểm tra Console không còn CORS error
3. Click Google Login → OAuth flow hoạt động
