# IndraNetra 2.0 — Reinnovation Blueprint

> **IndraNetra** ("Indra's Eye") — an AI-powered crowd-intelligence and stampede-prevention
> platform for mass gatherings (festivals, stadiums, pilgrimages like Kumbh Mela, political
> rallies, transit hubs). This document is the target architecture, feature set, and roadmap
> for the reinnovated platform. It is grounded in the current codebase (NestJS + Next.js +
> FastAPI/YOLO) and lays out where each piece should go next.

---

## 1. The reinnovation thesis

The current build is a solid MVP: it detects people from camera frames, scores crowd risk,
raises alerts, and coordinates volunteers/SOS. To become a genuinely defensible product it
needs to move from **"detect and alert"** to **"predict, prevent, and prove."**

Three pillars:

1. **Predict, don't just detect.** Forecast density build-up 5–15 minutes ahead per zone, so
   operators act *before* a crush forms — not after an alert fires.
2. **Fuse, don't just count.** Combine multiple cameras, gate turnstile counts, mobile GPS
   density, and event schedule into one **live digital twin** of the venue.
3. **Prove and improve.** Every incident produces an immutable timeline and an after-action
   report, so organizers and authorities can audit response and improve plans.

Everything below serves those three pillars.

---

## 2. Target system architecture

```
                         ┌───────────────────────────────────────────────┐
                         │                 Clients                        │
                         │  Web dashboard (Next.js)   Volunteer PWA/mobile │
                         │  Public safety mini-app    Large-screen NOC view│
                         └───────────────┬───────────────────────────────┘
                                         │ HTTPS + WebSocket (Socket.IO)
                         ┌───────────────▼───────────────┐
                         │        API Gateway (NestJS)     │
                         │  Auth · Events · Cameras · Crowd │
                         │  Volunteers · Reports · Alerts   │
                         │  Notifications · Analytics       │
                         └───┬───────────┬─────────────┬───┘
                             │           │             │
              ┌──────────────▼──┐  ┌─────▼──────┐  ┌───▼────────────┐
              │  PostgreSQL      │  │  Redis      │  │  Object store  │
              │  (+ PostGIS,     │  │  cache +    │  │  (Cloudinary / │
              │   TimescaleDB)   │  │  pub/sub +  │  │   S3): frames, │
              │  system of record│  │  streams    │  │  heatmaps,     │
              └──────────────────┘  └─────┬──────┘  │  evidence      │
                                          │         └────────────────┘
                         ┌────────────────▼─────────────────┐
                         │   AI / CV Service (FastAPI, Python)│
                         │  Detection · Tracking · Heatmap    │
                         │  Density estimation · Risk model   │
                         │  Forecasting · Evacuation routing  │
                         └───────────────┬───────────────────┘
                                         │ (pulls RTSP / edge frames)
                    ┌────────────────────▼─────────────────────┐
                    │  Edge ingestion (per-venue, optional)      │
                    │  RTSP cameras · turnstiles · edge inference │
                    └────────────────────────────────────────────┘
```

**Why this shape**
- **NestJS gateway** stays the single system-of-record and authority boundary. All writes,
  auth, and role enforcement live here.
- **FastAPI is stateless compute.** It takes a frame (or stream handle) and returns numbers +
  a heatmap. It never talks to the DB. This keeps the ML side independently scalable and
  swappable.
- **Redis becomes load-bearing**, not decorative: caches the latest analysis per camera,
  backs Socket.IO horizontal scaling (adapter), and carries alert/notification pub-sub.
- **Object store for pixels.** Heatmaps/snapshots go to Cloudinary/S3; the DB stores *URLs*,
  not base64 blobs (a current bloat problem).

---

## 3. Roles & what each one does

The platform is multi-tenant by **Event** and gated by four roles (already in the schema:
`ADMIN`, `ORGANIZER`, `VOLUNTEER`, `PUBLIC`). Reinnovated responsibilities:

| Capability | ADMIN (control room) | ORGANIZER (event owner) | VOLUNTEER (field) | PUBLIC (attendee) |
|---|---|---|---|---|
| Create/edit events & venue map | ✅ all | ✅ own events | — | — |
| Live crowd map & heatmaps | ✅ all events | ✅ own events | ✅ assigned zone | ✅ simplified "how busy" |
| Density forecast & risk timeline | ✅ | ✅ | read-only | — |
| Camera management & AI toggle | ✅ | ✅ own | — | — |
| Alerts: receive / acknowledge / resolve | ✅ | ✅ own | receive assigned | safety advisories only |
| Volunteer dispatch & tracking | ✅ | ✅ | update own status/location | — |
| SOS: raise | ✅ | ✅ | ✅ | ✅ (primary) |
| SOS: triage & assign | ✅ | ✅ | accept/close assigned | — |
| Incident reports | ✅ triage | ✅ triage | ✅ file + resolve | ✅ file with photo |
| Evacuation route activation | ✅ | ✅ | receive & guide | receive "nearest safe exit" |
| Analytics & after-action report | ✅ platform-wide | ✅ own events | — | — |
| User & organizer approval | ✅ | — | — | — |

**Design rule:** the backend `RolesGuard` is the source of truth; the UI only *hides* what a
role can't do. Never rely on the client for authorization (the current code already does
this correctly per-endpoint — keep it that way).

---

## 4. Feature catalog (what should be there)

### 4.1 Core (exists today, keep + harden)
- Email/password + Google OAuth auth, email verification, password reset, organizer approval.
- Event CRUD with capacity/threshold/gates, status lifecycle (Upcoming → Live → Completed).
- Camera registry (webcam, mobile, RTSP, video file) with connection test + AI toggle.
- Frame/RTSP analysis → people count, density, risk level, heatmap overlay.
- Real-time crowd updates, alerts, SOS, volunteer location over Socket.IO.
- Volunteer status/location, SOS dispatch, incident reports with Cloudinary evidence.
- In-app notifications + alert acknowledge/resolve (added in the latest iteration).

### 4.2 New — the reinnovation layer

**A. Venue Digital Twin & zone model**
- Draw the venue on a map: **zones** (polygons), gates (entry/exit), camera coverage,
  volunteer positions, medical posts. Store geometry in **PostGIS**.
- Each camera maps to a zone; each zone has capacity, current occupancy, and inflow/outflow.
- The dashboard shows one live map where color = risk, arrows = crowd flow direction.

**B. Predictive density forecasting**
- Per-zone time series of occupancy (stored in **TimescaleDB** hypertable).
- Short-horizon forecast (5/10/15 min) using the recent slope + event schedule + historical
  patterns. Start with a simple, explainable model (EWMA + linear/Prophet-style trend),
  upgrade to a learned model once data accrues.
- Output: "Zone C will exceed threshold in ~8 min" → a **pre-alert** before it's critical.

**C. Multi-source crowd fusion**
- Combine camera counts + gate turnstile deltas + (optional) anonymized mobile-density feed
  into one occupancy estimate per zone, with confidence. Reduces single-camera error.

**D. Stampede-risk early-warning**
- Beyond density: track **flow velocity** and **counter-flow / convergence** (people moving
  into each other), the real precursors to crushes. Raise a `CRUSH_RISK` alert type when
  density × convergence crosses a learned boundary.

**E. Smart evacuation & wayfinding**
- Grid/graph pathfinding already exists (`pathfinder.py`). Reinnovate into: pick the safest
  exit *per zone* given live congestion, push turn-by-turn guidance to volunteers and a
  "nearest safe exit" card to the public mini-app.

**F. Operator Copilot (LLM assistant)**
- A chat/《ask》panel for operators: "summarize the last 10 minutes in Zone B", "which gate
  is safest to divert to", "draft the incident report." Uses the latest Claude models
  (`claude-opus-4-8` / `claude-sonnet-5`) over the structured telemetry — **not** raw video.
- Guardrails: it recommends, humans act. All actions are logged.

**G. Incident timeline & after-action reports**
- Every alert/SOS/dispatch/resolution is an append-only event on a per-incident timeline.
- One-click **after-action PDF**: what happened, when, who responded, time-to-resolution.

**H. Public safety mini-app**
- Lightweight PWA for attendees: live "how busy is it", nearest safe exit, one-tap SOS with
  GPS, report a hazard with photo. No login friction beyond phone + emergency contact.

**I. Offline & degraded-mode resilience**
- Edge caching so a venue with flaky uplink still runs local detection + local alerting; sync
  when the link returns. Volunteer app queues location/status updates offline.

**J. Observability & audit**
- Structured logs, metrics (inference latency, alert lead time, dispatch time-to-ack), and an
  audit trail of every privileged action. This is also the data that trains the forecaster.

---

## 5. How the core loop works (end to end)

```
1. Camera/edge sends a frame (or the backend pulls an RTSP keyframe every N seconds).
2. Backend → FastAPI /analyze:
      YOLO person detection → IoU/ByteTrack tracking (de-dupes counts)
      → density estimation (people per m² using the zone's real area, not a magic factor)
      → heatmap overlay (uploaded to object store, URL returned)
      → risk classifier (rule baseline + ML) → {LOW|MEDIUM|HIGH|CRITICAL, confidence}
3. Backend writes a time-series point (TimescaleDB) + latest snapshot cache (Redis).
4. Forecaster updates the per-zone projection; if projected breach → PRE-ALERT.
5. Threshold/flow rules → ALERT (OVERCROWDING | CRUSH_RISK | BLOCKED_EXIT | ...).
6. Gateway broadcasts crowd_update / alert over Socket.IO to the right rooms,
      writes notifications for control-room users, emails on CRITICAL.
7. Operator (or Copilot suggestion) acts: dispatch volunteers, activate evacuation route,
      divert a gate. Every action is logged to the incident timeline.
8. On resolve → alert cleared everywhere in real time; incident closed; metrics recorded.
```

**Accuracy levers** (make it "more accurate"): real per-zone area for density, temporal
smoothing (already present), multi-camera fusion, confidence thresholds, and calibrating the
risk model on labeled venue data instead of synthetic data.

**Speed levers** (make it "faster"): frame downscaling before inference (added), model
warmup (added), Redis latest-analysis cache to serve reads without hitting the model,
batched/async inference, and edge inference for large deployments.

---

## 6. Target repository structure

Monorepo, one deployable per service. New/renamed pieces marked `★`.

```
IndraNetra/
├─ CLAUDE.md                      # agent/dev onboarding (exists)
├─ BLUEPRINT.md                   # this document ★
├─ docker-compose.yml             # postgres, redis, (add: timescale, minio) ★
├─ package.json                   # workspace scripts
├─ prisma/
│  └─ schema.prisma               # system-of-record model (+ zones, timeseries refs) ★
│
├─ backend/                       # NestJS API + Socket.IO gateway
│  └─ src/
│     ├─ auth/                    # JWT cookie, guards, roles, OAuth (exists)
│     ├─ events/                  # event CRUD + lifecycle (exists)
│     ├─ venues/        ★         # zones, gates, geometry (PostGIS)
│     ├─ cameras/                 # registry, test, analyze (exists)
│     ├─ crowd/                   # analysis orchestration + gateway (exists)
│     ├─ forecasting/  ★          # calls AI forecast, stores projections
│     ├─ alerts/       ★          # promote from crowd: list/ack/resolve/rules
│     ├─ volunteers/              # status, location, dispatch, SOS (exists)
│     ├─ reports/                 # incident reports + evidence (exists)
│     ├─ notifications/           # in-app + email + push (exists, extended)
│     ├─ incidents/    ★          # append-only timeline + after-action export
│     ├─ analytics/    ★          # aggregates, CSV/PDF export
│     ├─ copilot/      ★          # LLM operator assistant (Claude API)
│     ├─ realtime/     ★          # gateway + Redis adapter (extract from crowd)
│     └─ common/       ★          # dtos, pipes, filters, config, logging
│
├─ ai-service/                    # FastAPI CV/ML service (stateless)
│  ├─ api/main.py                 # endpoints (exists)
│  ├─ yolo/                       # detection + tracking (exists)
│  ├─ heatmaps/                   # density heatmap (exists)
│  ├─ prediction/
│  │  ├─ risk.py                  # risk classifier (exists)
│  │  ├─ pathfinder.py            # evacuation routing (exists)
│  │  └─ forecast.py   ★          # short-horizon density forecast
│  ├─ fusion/          ★          # multi-camera/turnstile fusion
│  └─ models/          ★          # weights, calibration artifacts
│
├─ frontend/                      # Next.js 16 control-room dashboard
│  └─ app/
│     ├─ (auth)/                  # login, signup, verify, reset (exists)
│     ├─ dashboard/    ★          # split the 4k-line page into feature modules
│     │  ├─ overview/  ├─ map/    ├─ cameras/  ├─ events/
│     │  ├─ alerts/    ├─ volunteers/  ├─ analytics/  └─ copilot/
│     ├─ (role routes)/           # admin/organizer/volunteer/public (exists)
│     ├─ components/              # MapComponent, charts, HUD, bell (exists+)
│     ├─ hooks/                   # useSocket, useAuth, useEvent (exists+)
│     └─ services/api.ts          # typed API client (exists)
│
├─ public-app/         ★          # attendee PWA (or a route group in frontend)
└─ docs/               ★          # runbooks, incident playbooks, API reference
```

**Structural cleanups the current code needs**
- Split `frontend/app/dashboard/page.tsx` (~4,400 lines, all roles) into per-tab feature
  modules with a shared layout. Biggest maintainability win.
- Extract `CrowdGateway` into a `realtime/` module and add the **Socket.IO Redis adapter**
  so the gateway can run multi-instance.
- Promote alerts to their own module with a rules engine (types, thresholds, dedupe).
- Stop persisting base64 heatmaps in Postgres — upload to object store, store the URL.

---

## 7. Data model evolution (Prisma / PostGIS / TimescaleDB)

Keep today's models (`User`, `Event`, `Camera`, `CrowdReport`, `Alert`, `Volunteer`,
`SOSRequest`, `Report`, `Notification`, `CameraAnalytics`). Add:

- **Zone** — `id, eventId, name, polygon (geometry), areaSqMeters, capacity, kind (crowd/gate/medical)`.
- **Gate** — `id, eventId, zoneId, kind (ENTRY/EXIT), location`.
- **OccupancySample** (TimescaleDB hypertable) — `zoneId, ts, peopleCount, densityPerM2, flowVelocity, riskLevel`.
- **Forecast** — `zoneId, ts, horizonMin, projectedCount, projectedRisk, confidence`.
- **Incident** — `id, eventId, type, openedAt, closedAt, severity` + **IncidentEvent** (append-only timeline).
- **AuditLog** — `actorId, action, target, ts, meta`.
- Extend **Alert** with `type` enum incl. `CRUSH_RISK`, `PRE_ALERT`, and link to `zoneId`/`incidentId`.

Enums to add: `AlertType`, `ZoneKind`, `IncidentSeverity`. Keep `RiskLevel`, `SOSStatus`,
`VolunteerStatus`, `Role`.

---

## 8. Tech stack & key decisions

| Concern | Choice | Why |
|---|---|---|
| API / auth / realtime | **NestJS 11**, Socket.IO | Already in place; strong DI, guards, gateways |
| DB | **PostgreSQL** + **PostGIS** + **TimescaleDB** | One store: relational + geospatial + time series |
| Cache / pub-sub / scale | **Redis** (+ Socket.IO adapter) | Latest-analysis cache, fan-out, multi-instance |
| CV / ML | **FastAPI** + Ultralytics YOLO (v8/v11) | Stateless, swappable; nano→small model as needed |
| Forecasting | EWMA/Prophet → learned model | Start explainable, upgrade with data |
| Object storage | **Cloudinary / S3-compatible** | Keep pixels out of the DB |
| Frontend | **Next.js 16 / React 19**, Leaflet, Recharts | Already in place (see `frontend/AGENTS.md`) |
| Operator Copilot | **Claude API** (`claude-opus-4-8`) | Reasoning over telemetry, report drafting |
| Mobile/public | **PWA** (installable), Web Push | No app-store friction for attendees/volunteers |
| Deploy | Docker per service; edge box per venue | Cloud control-room + optional on-prem ingestion |

---

## 9. Non-functional requirements

- **Latency:** frame → alert under ~1.5s per camera at the edge; dashboard updates < 500ms.
- **Alert lead time (the real KPI):** pre-alerts should give operators **5+ minutes** before a
  threshold breach. Measure and report this.
- **Scale:** hundreds of cameras per venue; gateway and AI service scale horizontally;
  time-series partitioned by event/zone.
- **Security:** HTTP-only JWT cookies (set `secure: true` in prod — currently `false`),
  per-endpoint role guards, audit log, PII minimization (no storing raw faces; counts +
  anonymized heatmaps only), signed URLs for evidence.
- **Reliability:** AI service failure degrades to last-known + rule-based mock (already the
  pattern); edge keeps local alerting during uplink loss.
- **Privacy & ethics:** person **counting**, not identification. Be explicit: no facial
  recognition, no tracking of individuals across cameras. This is a safety tool, not
  surveillance — bake that into defaults and docs.

---

## 10. Phased roadmap

**Phase 0 — Harden the MVP (now)**
Split the mega dashboard; move heatmaps to object store; add Redis Socket.IO adapter; set
`cookie.secure` in prod; per-zone area for density. *(Notifications, alerts API, real-time
reports, AI downscale/warmup — done.)*

**Phase 1 — Digital twin**
Zones + gates + PostGIS; one live map with risk coloring and flow arrows; camera→zone mapping;
TimescaleDB occupancy samples.

**Phase 2 — Prediction**
Per-zone forecaster + pre-alerts; `CRUSH_RISK` via flow velocity/convergence; multi-camera
fusion; measure alert lead time.

**Phase 3 — Response & proof**
Incident timeline + after-action PDF; smart per-zone evacuation routing; volunteer turn-by-turn;
public "nearest safe exit."

**Phase 4 — Copilot & scale**
Operator LLM copilot over telemetry; analytics/exports; edge ingestion boxes; offline mode;
multi-venue tenancy and RBAC refinement.

---

## 11. What makes this defensible

1. **Lead time, not hindsight** — pre-alerts that prevent crushes, with a measurable KPI.
2. **Digital twin fusion** — one trustworthy occupancy number per zone from many noisy sources.
3. **Proof** — immutable incident timelines and after-action reports authorities can audit.
4. **Privacy-first counting** — safety without surveillance, as a product principle.
5. **Operator copilot** — turns raw telemetry into decisions non-expert staff can act on.

---

*This blueprint is meant to be edited. Treat Sections 6–7 as the contract for structure and
data; Sections 4 and 10 as the backlog.*
