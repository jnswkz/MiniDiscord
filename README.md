<div align="center">

# 💬 MiniDiscord

**A multi-user chat server inspired by Discord — built with microservices architecture**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-minidiscord.vercel.app-blue?style=for-the-badge)](https://minidiscord.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Heroku-430098?style=for-the-badge&logo=heroku)](https://minidiscord-gateway-bbc581926938.herokuapp.com/actuator/health)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://minidiscord.vercel.app)

**Backend:** Java Spring Boot (Microservices) · **Frontend:** Next.js · **DB:** PostgreSQL + MongoDB + Redis

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Implemented Features](#-implemented-features)
- [Project Progress](#-project-progress)
- [Deployment](#-deployment)
- [Local Development](#-local-development)
- [Future Roadmap](#-future-roadmap)

---

## 🔍 Overview

MiniDiscord is a real-time multi-user chat application built as a microservices-based system. The project follows a **Centralized Server** model combined with **WebSocket** for persistent two-way connections, minimizing latency compared to HTTP polling.

The system is designed with **6 independent microservices** coordinated through an API Gateway, enabling independent scaling and deployment of each component.

### Live URLs

| Component | URL |
|-----------|-----|
| 🌐 Frontend | https://minidiscord.vercel.app |
| ⚡ API Gateway | https://minidiscord-gateway-bbc581926938.herokuapp.com |
| 👤 User Service | https://minidiscord-user-9b155a4891e0.herokuapp.com |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCTION STACK                           │
│                                                                  │
│  ┌────────────────────────────────────────┐                      │
│  │  Frontend (Vercel - Free)              │                      │
│  │  Next.js · SSR · Edge CDN              │                      │
│  │  minidiscord.vercel.app                │                      │
│  └──────────────┬─────────────────────────┘                      │
│                 │ HTTPS                                          │
│                 ▼                                                 │
│  ┌────────────────────────────────────────┐                      │
│  │  API Gateway (Heroku Eco)              │                      │
│  │  Spring Cloud Gateway                  │                      │
│  │  ├─ CORS Filter (dynamic origins)     │                      │
│  │  ├─ JWT Auth Filter (whitelist-based) │                      │
│  │  └─ Rate Limiter (Redis, fail-open)   │                      │
│  └──────────────┬─────────────────────────┘                      │
│                 │ Direct URL routing                              │
│                 ▼                                                 │
│  ┌────────────────────────────────────────┐                      │
│  │  User Service (Heroku Eco)             │                      │
│  │  Auth (Email + Google OAuth) + CRUD    │                      │
│  └──────────────┬─────────────────────────┘                      │
│                 │                                                 │
│    ┌────────────┼────────────┐                                   │
│    ▼            ▼            ▼                                   │
│  [Supabase]  [Upstash]  [Google OAuth]                           │
│  PostgreSQL   Redis      Identity                                │
└──────────────────────────────────────────────────────────────────┘
```

> **Note:** Eureka Service Discovery is disabled in production. Direct URL routing via environment variables is used instead, saving one Dyno and reducing Heroku quota consumption.

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 17 | Runtime |
| Spring Boot | 3.4.4 | Application framework |
| Spring Cloud | 2024.0.1 | Gateway, Config, Discovery |
| Spring Security | 6.x | Authentication & Authorization |
| JJWT | 0.12.6 | JWT token generation & validation |
| Google OAuth2 | — | Social login |
| PostgreSQL | 15+ | User data (Supabase) |
| Redis | — | Rate limiting (Upstash) |
| Maven | 3.9+ | Build tool (multi-module) |

### Frontend

| Technology | Purpose |
|-----------|---------|
| Next.js | React framework with SSR |
| TypeScript | Type safety |
| Zustand | State management |
| Axios | HTTP client |
| react-oauth/google | Google OAuth integration |
| i18n | Internationalization |

### Infrastructure & Cloud

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend Hosting | Vercel (Free) | CDN, auto-deploy from GitHub |
| Backend Hosting | Heroku Eco ($5/month) | Java Dynos with auto-sleep |
| Database | Supabase PostgreSQL | User data storage |
| Cache | Upstash Redis (TLS) | Rate limiting |
| CI/CD | GitHub Actions | Automated Docker container deploy |
| OAuth | Google Cloud Console | Social authentication |

---

## ✅ Implemented Features

### Authentication & User Management
- ✅ User registration with email validation
- ✅ Login with email/password (BCrypt hashing)
- ✅ Google OAuth 2.0 login (ID token verification)
- ✅ JWT-based session management (24h expiry)
- ✅ User profile view & update
- ✅ User status management (Online/Offline)
- ✅ Auto-logout on token expiry (401 interceptor)

### API Gateway
- ✅ Centralized request routing (Spring Cloud Gateway)
- ✅ JWT authentication filter with path whitelisting
- ✅ Dynamic CORS configuration (supports Vercel preview URLs)
- ✅ IP-based rate limiting with Redis (20 req/10s, fail-open)
- ✅ Custom error handling with standardized `ApiResponse<T>`

### Frontend UI
- ✅ Login & Registration pages with form validation
- ✅ Google OAuth login button integration
- ✅ Dashboard layout (Discord-inspired design)
- ✅ Responsive design with dark mode
- ✅ Internationalization support (i18n)
- ✅ Zustand state management with localStorage persistence

### DevOps & Production
- ✅ Automated CI/CD pipeline (GitHub Actions → Heroku Docker deploy)
- ✅ Production-ready configuration profiles (`application-prod.yml`)
- ✅ Custom lightweight health check endpoints (`/actuator/health`)
- ✅ Environment-based secrets management (zero secrets in code)
- ✅ SSL/TLS encryption (auto-provisioned by Heroku & Vercel)

---

## 📊 Project Progress

```
████████████████████░░░░░░░░░░  ~60% Overall

  Infrastructure   ████████████████████  100% ✅
  Auth & Gateway   ████████████████████  100% ✅
  Frontend UI      ██████████████░░░░░░   70% 🟡
  Deployment       ████████████████████  100% ✅
  Chat Services    ░░░░░░░░░░░░░░░░░░░░    0% 🔴
  Testing          ████░░░░░░░░░░░░░░░░   20% 🟡
```

### Microservice Status

| # | Service | Status | Progress | Details |
|---|---------|--------|----------|---------|
| 1 | `common-lib` | ✅ Complete | 100% | ApiResponse, BaseException, JwtUtil, MessageEvent |
| 2 | `api-gateway` | ✅ Complete | 100% | JWT filter, CORS, Rate Limit, Health Check |
| 3 | `user-service` | ✅ Complete | 100% | Register, Login, Google OAuth, Profile CRUD |
| 4 | `group-channel-service` | 🔴 Scaffold | 10% | Application class + config only |
| 5 | `chat-history-service` | 🔴 Scaffold | 10% | Application class + config only |
| 6 | `messaging-service` | 🔴 Scaffold | 10% | Application class + config only |
| 7 | `file-service` | 🔴 Scaffold | 10% | Application class + config only |

### Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **P0** | Common library & infrastructure | ✅ Complete |
| **P1A** | User Service — full auth flow | ✅ Complete |
| **P1B** | API Gateway — JWT, CORS, Rate Limit | ✅ Complete |
| **Deploy** | Heroku + Vercel + CI/CD + Hardening | ✅ Complete |
| **P2** | Groups & Channels Service | 🔴 Not started |
| **P3** | Chat History Service | 🔴 Not started |
| **P4** | Messaging Service (WebSocket) | 🔴 Not started |
| **P5** | File Service | 🔴 Not started |

---

## 🚀 Deployment

The system is deployed and accessible at **https://minidiscord.vercel.app**.

| Platform | Service | Deploy Method |
|----------|---------|---------------|
| **Vercel** | Frontend (Next.js) | Auto-deploy on push to `main` |
| **Heroku** | API Gateway & User Service | Docker Container via GitHub Actions |
| **GitHub Actions** | CI/CD Pipeline | Build JAR → Docker → Heroku Registry → Release |

> For detailed deployment documentation, see [`docs/deploy/README.md`](docs/deploy/README.md).

---

## 💻 Local Development

### Prerequisites

- Java 17+
- Node.js 22+
- Maven 3.9+
- Docker & Docker Compose (optional)

### Backend

```bash
# Clone the repository
git clone https://github.com/PhatNguyenTT2/MiniDiscord.git
cd MiniDiscord

# Start backend services with Docker Compose
cd backend
docker-compose up -d

# Or run individual services
cd user-service
mvn spring-boot:run

cd ../api-gateway
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:3000
```

### Environment Variables

Copy `.env.example` files and fill in your credentials:

```bash
cp backend/.env.example backend/user-service/.env
cp backend/.env.example backend/api-gateway/.env
```

> See [`docs/deploy/README.md`](docs/deploy/README.md) for a full list of required environment variables.

---

## 🔮 Future Roadmap

### Phase 2: Groups & Channels
- [ ] Room CRUD (create, join, leave, delete)
- [ ] Channel management within rooms
- [ ] Member roles & permissions (Owner, Admin, Member)
- [ ] Room invitation system
- [ ] Event-driven updates via RabbitMQ

### Phase 3: Chat History
- [ ] Message persistence with MongoDB
- [ ] Chat history retrieval with pagination
- [ ] Message search functionality
- [ ] RabbitMQ consumer for real-time message storage

### Phase 4: Real-time Messaging
- [ ] WebSocket integration (STOMP over SockJS)
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] Online/Offline presence tracking (Redis)
- [ ] Message fan-out to room participants

### Phase 5: File Service
- [ ] File upload/download (Backblaze B2, S3-compatible)
- [ ] Image preview & thumbnails
- [ ] File sharing in chat messages

### Stretch Goals
- [ ] Voice channels (WebRTC)
- [ ] Message reactions & threads
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] End-to-end encryption for DMs

---

## 📁 Project Structure

```
MiniDiscord/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router pages
│   ├── components/              # Reusable UI components
│   ├── stores/                  # Zustand state management
│   └── lib/                     # API client & utilities
│
├── backend/                     # Java Spring Boot microservices
│   ├── common-lib/              # Shared DTOs, exceptions, JWT
│   ├── api-gateway/             # Spring Cloud Gateway (port 8080)
│   ├── user-service/            # Auth & User CRUD (port 8081)
│   ├── group-channel-service/   # Rooms & Channels (port 8082)
│   ├── chat-history-service/    # Message storage (port 8083)
│   ├── messaging-service/       # WebSocket real-time (port 8084)
│   ├── file-service/            # File upload/download (port 8085)
│   ├── discovery-server/        # Eureka Server (port 8761)
│   └── config-server/           # Spring Cloud Config (port 8888)
│
├── .github/workflows/           # CI/CD pipelines
│   └── deploy-backend.yml       # Docker build → Heroku deploy
│
└── docs/                        # Project documentation
    ├── plan.md                  # Master plan & architecture
    ├── progress.md              # Development progress tracking
    └── deploy/                  # Deployment guide
```

---

## 👥 Contributors

- **Phat Nguyen** — Full-stack Developer

---

## 📄 License

This project is developed as a university coursework project at UIT (University of Information Technology).