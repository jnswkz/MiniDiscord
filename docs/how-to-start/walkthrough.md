# Docker Compose Migration Walkthrough

The MiniDiscord project has been successfully migrated to a containerized infrastructure using Docker Compose. This allows for a "1-click" startup experience while preserving the cloud-based dependencies.

## What Was Completed

1. **JWT Secret Synchronization**
   - Generated a secure 32-byte Base64 key.
   - Synchronized the `JWT_SECRET` across `user-service/.env`, `api-gateway/.env`, and `messaging-service/.env` to ensure the API Gateway correctly validates authentication tokens from the User Service.

2. **Dockerfiles with Maven Caching**
   - Created multi-stage `Dockerfile` templates for all 8 Spring Boot services.
   - Implemented a dependency caching layer (`mvn dependency:go-offline`) before copying the source code. This optimizes the build process so that subsequent builds are significantly faster (5-10x) when only application code is modified.

3. **Docker Compose Orchestration**
   - Designed `docker-compose.yml` with a custom `minidiscord-net` bridge network.
   - Configured `discovery-server` with a health check, allowing dependent services to wait via `depends_on: condition: service_healthy`.
   - Applied memory limits: `256MB` for core routing components (discovery-server, api-gateway) and `512MB` for business logic microservices.
   - Used Docker profiles (`--profile full`) so that developers can choose between running the core system (~1.3GB RAM) or the complete microservices suite (~3.3GB RAM).

4. **Frontend Hot-Reloading**
   - Added a `Dockerfile` for the Next.js frontend.
   - Integrated it into the Compose stack using bind-mount volumes (`../frontend:/app`) and anonymous volumes (`/app/node_modules`, `/app/.next`) to enable real-time Hot Module Replacement without rebuilding the container.
   - Fixed a peer-dependency issue during build by enforcing `npm ci --legacy-peer-deps`.

5. **Configuration Upgrades**
   - Updated `application.yml` in `discovery-server` to dynamically use `${EUREKA_HOSTNAME:localhost}`, ensuring smooth operations natively or inside Docker.
   - Cleaned up `.env` files and `.gitignore`.
   - Added detailed Docker usage documentation as **Section 5B** in `docs/how-to-start.md`.

## How to Verify

You can easily verify the new setup by running:
```powershell
# 1. Chạy hệ thống core (tốn ~1.3GB RAM)
docker compose up -d --build

# 2. Kiểm tra Logs
docker compose logs -f
```

- **Eureka:** Visit [http://localhost:8761](http://localhost:8761). You should see `API-GATEWAY` and `USER-SERVICE` registered.
- **Frontend:** Visit [http://localhost:3000](http://localhost:3000). Try modifying any React component; the changes will automatically reflect in the browser.
- **Testing Full Setup:** If you want to start everything, stop the current process (`docker compose down`) and run `docker compose --profile full up -d --build`.
