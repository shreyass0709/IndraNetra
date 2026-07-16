# IndraNetra

AI-powered crowd intelligence & stampede-prevention platform. A monorepo with three
independently-run services plus a shared Prisma schema.

## Architecture

```
frontend/    Next.js 16 + React 19 dashboard (multi-role UI, Leaflet maps, Socket.IO client)
backend/     NestJS 11 API + WebSocket gateway (REST, auth, orchestration, persistence)
ai-service/  FastAPI (Python) CV service — YOLO people detection, heatmaps, risk, routing
prisma/      schema.prisma — the single source of truth for the Postgres data model
```

Request flow for crowd analysis: frontend uploads a frame/RTSP feed → backend
(`crowd`/`cameras` module) forwards it to `ai-service` (`/analyze`, `/analyze_rtsp`) →
backend persists results (`CrowdReport`/`CameraAnalytics`), raises `Alert`s, and
pushes live updates to clients over Socket.IO.

- **Data store:** PostgreSQL (via Prisma). Redis is used for pub/sub-style notifications.
- **AI models:** YOLO weights (`yolo11n.pt`, `yolov8n.pt`) live in `ai-service/`. If a
  real model/stream is unavailable, the service falls back to deterministic mock
  detections so demos stay robust (see `ai-service/api/main.py`).

## Running the project

Services run separately. Root `package.json` has convenience scripts:

```bash
# Infra (Postgres + Redis)
npm run docker:up          # docker-compose up -d

# Prisma (schema lives at prisma/schema.prisma, client generates into backend)
npm run generate:prisma    # prisma generate
npm run db:push            # prisma db push

# Dev servers
npm run dev:backend        # NestJS  → http://localhost:4000
npm run dev:frontend       # Next.js → http://localhost:3000
npm run dev:ai             # FastAPI → http://localhost:8000 (uvicorn --reload)
```

Backend and frontend each have their own `package.json`; `ai-service` uses
`requirements.txt` and its own `.venv`. Backend tests: `npm test --prefix backend` (Jest).

### Seeding
`backend/src/seed.ts` seeds initial data (e.g. admin user).

## Data model (prisma/schema.prisma)

Core entities: `User` (roles: `ADMIN | ORGANIZER | VOLUNTEER | PUBLIC`, each with an
optional profile table), `Event`, `Camera` + `CameraAnalytics`, `CrowdReport`, `Alert`,
`Volunteer`, `SOSRequest`, `Report` (incident reports), `Notification`.

Enums: `Role`, `RiskLevel (LOW/MEDIUM/HIGH/CRITICAL)`, `SOSStatus (PENDING/DISPATCHED/RESOLVED)`,
`VolunteerStatus (AVAILABLE/ASSIGNED/INACTIVE)`.

The Prisma client output is redirected to `backend/node_modules/.prisma/client` — always
run `generate:prisma` after editing the schema, or backend types go stale.

## Backend conventions (NestJS)

- One module per domain under `backend/src/`: `auth`, `events`, `crowd`, `cameras`,
  `volunteers`, `reports`, `notifications`, `prisma`.
- **Auth:** JWT stored in an HTTP-only cookie named `indranetra_session` (also accepts
  `Authorization: Bearer`). `AuthGuard` verifies it; `RolesGuard` + `@Roles()` decorator
  enforce role access. Passwords hashed with bcrypt. Email verification, password reset,
  and Google OAuth2 (`google-auth-library`) are all supported.
- **CORS:** backend allows `localhost:3000`/`127.0.0.1:3000` with `credentials: true` —
  required for the cookie to cross origins. The frontend `api` client always sends
  `credentials: 'include'`.
- **Realtime:** `CrowdGateway` (Socket.IO) broadcasts `crowd_update`, `alert_received`,
  `alert_resolved`, `sos_received`, `volunteer_updated`, `report_received`, and per-user
  `notification` — both to per-event rooms (`event_<id>`) and global channels for
  dashboards. Frontend consumes via `hooks/useSocket.ts`.
- **Alerts API** (`crowd` module): `GET /crowd/alerts/active[?eventId=]` lists unresolved
  alerts; `PATCH /crowd/alerts/:id/resolve` (ADMIN/ORGANIZER) acknowledges one and
  broadcasts `alert_resolved`.
- **Notifications** (`notifications` module): the `Notification` table is written by
  `NotificationsService` on SOS, overcrowding/danger alerts, new incident reports, and
  volunteer dispatch. `notifyRoles()` fans out to all control-room users. Endpoints:
  `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`,
  `PATCH /notifications/read-all`. Surfaced in the frontend as a header bell.
- External integrations: `resend` (email), `cloudinary` (evidence/media uploads),
  `ioredis`-style Redis service.

## Frontend conventions (Next.js App Router)

- **IMPORTANT — read `frontend/AGENTS.md` first.** This is Next.js 16 / React 19, which
  differs from older training data; consult `node_modules/next/dist/docs/` before writing
  code and heed deprecation notices. (`frontend/CLAUDE.md` just re-points here.)
- Role-based dashboards live under `app/<role>/dashboard/` (`admin`, `organizer`,
  `volunteer`, `public`) plus a shared `app/dashboard`.
- All backend calls go through the single `services/api.ts` client (`api.*` methods) —
  add new endpoints there rather than calling `fetch` ad hoc.
- Maps via Leaflet (`components/MapComponent.tsx`), charts via Recharts, animation via
  framer-motion.

## AI service conventions (FastAPI)

- Entry point `ai-service/api/main.py`; modules: `yolo/detector.py` (detection),
  `heatmaps/generator.py`, `prediction/risk.py` (sklearn risk classifier),
  `prediction/pathfinder.py` (evacuation routing).
- Endpoints: `/health`, `/analyze` (uploaded frame), `/analyze_rtsp` (RTSP URL, with mock
  fallback), `/route` (grid pathfinding). Returns people count, density, risk level +
  confidence, and a base64 heatmap overlay.

## Environment

Each service reads its own `.env` (git-ignored; see `backend/.env.example`,
`frontend/.env.example`). Backend needs `DATABASE_URL`, `JWT_SECRET`, `REDIS_*`,
`AI_SERVICE_URL`, `CLOUDINARY_*`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`.
Frontend needs `NEXT_PUBLIC_API_URL`.
