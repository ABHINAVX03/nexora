# Nexora — Next-Gen Professional Network

> **Connect. Build. Grow.**

Nexora is a modern, premium 2026-era professional networking web application engineered in **React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + Axios**. It communicates directly with the Spring Cloud Microservices backend via the API Gateway (`/api/v1`), supporting JWT session management, Neo4j graph-backed 1st-degree connection states, and Kafka-backed real-time notification streams.

---

## ⚡ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 (Protected & Public guards, deep link permalinks)
- **Styling**: Tailwind CSS (with custom 2026 Nexora design tokens, glassmorphism, and responsive adaptive grids)
- **State & Caching**: TanStack Query (React Query v5) for server state, optimistic updates, and background refetching
- **HTTP Client**: Centralized Axios client with JWT auto-injection, refresh token rotation, and safe error normalization
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Theme**: Light / Dark / System mode with instant DOM sync and `localStorage` persistence

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The app will run on [http://localhost:3000](http://localhost:3000).

### 3. Production Build
```bash
npm run build
```

---

## 🔌 API Microservices Integration

Nexora communicates with the Spring Cloud Gateway at `/api/v1`:

| Service | Endpoint | Description |
|---|---|---|
| **Auth Service** | `POST /api/v1/auth/signup` | Register new member |
| **Auth Service** | `POST /api/v1/auth/login` | Authenticate and obtain JWT |
| **Auth Service** | `POST /api/v1/auth/refresh` | Rotate expired access tokens |
| **User Service** | `GET /api/v1/users/{userId}` | Retrieve member profile |
| **Posts Service** | `GET /api/v1/posts/feed` | Real-time feed stream |
| **Posts Service** | `POST /api/v1/posts` | Create new post |
| **Posts Service** | `GET /api/v1/posts/{postId}` | Get single post details |
| **Posts Service** | `POST /api/v1/likes/{postId}` | Like a post |
| **Posts Service** | `DELETE /api/v1/likes/{postId}` | Unlike a post |
| **Connection Service** | `GET /api/v1/connections/first-degree` | 1st-degree verified connections |
| **Connection Service** | `GET /api/v1/connections/requests` | Pending incoming invitations |
| **Connection Service** | `POST /api/v1/connections/request/{receiverId}` | Send connection request |
| **Connection Service** | `POST /api/v1/connections/accept/{senderId}` | Accept invitation |
| **Connection Service** | `POST /api/v1/connections/reject/{senderId}` | Decline invitation |
| **Notification Service** | `GET /api/v1/notifications` | Real-time Kafka-backed alerts |
| **Notification Service** | `GET /api/v1/notifications/unread-count` | Live unread counter |
| **Notification Service** | `PATCH /api/v1/notifications/{id}/read` | Mark alert as read |
| **Notification Service** | `PATCH /api/v1/notifications/read-all` | Mark all alerts as read |

---

## 🌟 Interactive Showcase & Fallback Mode

Nexora includes an instant toggle between **Live Microservices Gateway Mode** and **Interactive Demo Mode** (accessible in the header or in Settings):
- **Live Gateway Mode**: Routes all traffic directly to Spring Cloud Gateway (`http://localhost:8080/api/v1`).
- **Demo Mode**: Allows immediate testing with pre-populated active feeds, interactive 1st-degree connections, profile customizations, and simulated Kafka events even when the backend is offline.
