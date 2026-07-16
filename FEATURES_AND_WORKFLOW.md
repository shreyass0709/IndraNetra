# IndraNetra — Required Features, Per-Role Workflow & Build Order

> The single scoped spec to build from. **Only features that must work reliably** are listed.
> Anything not here is deliberately out of scope for v1. Each feature notes *what it does*,
> *how it's built* (which files/services), and *how each role uses it*.
> Status legend: **[DONE]** already working · **[PARTIAL]** exists but needs fixing · **[TODO]** to build.

---

## 0. What the product is (one line)

Real-time crowd-density monitoring + stampede-risk alerting + emergency response coordination
for large events. Cameras → AI counts people & computes density → risk level → alerts →
volunteers dispatched / public warned.

## 1. What it's made of (building blocks)

| Layer | Tech | Responsibility |
|---|---|---|
| `frontend/` | Next.js 16, React 19, Tailwind, Leaflet, Recharts, Socket.IO client | Role-aware dashboard UI |
| `backend/` | NestJS 11, Prisma, Socket.IO gateway | REST API, auth, orchestration, realtime, system-of-record |
| `ai-service/` | FastAPI, YOLO, OpenCV, scikit-learn | Stateless: frame → people count, density, risk, heatmap, route |
| DB | PostgreSQL (Neon) + Prisma | All persistent data |
| Cache/bus | Redis | Socket.IO scaling + pub/sub (degrades gracefully) |
| Media | Cloudinary | Heatmap & evidence images (never base64 in DB) |
| Email | Resend | Verification, password reset, approval, SOS alert |

**Data flow (the core loop):** camera frame → `POST /cameras/:id/analyze` → backend forwards to
`ai-service /analyze` → returns count/density/risk/heatmap → backend saves `CrowdReport` +
`CameraAnalytics`, raises `Alert` if over threshold, uploads heatmap to Cloudinary, broadcasts
over Socket.IO, writes control-room `Notification`s.

---

## 2. Cross-cutting features (all roles)

### 2.1 Authentication & role assignment **[DONE]**
- Email/password signup + Google Sign-In; role (`PUBLIC | VOLUNTEER | ORGANIZER`) chosen **once at
  signup only**; `ADMIN` never self-service. Email verification required for password signups.
  Organizer accounts need admin approval before login.
- **Built from:** `auth` module (`auth.service.ts`, `auth.controller.ts`, `auth.guard.ts`,
  `roles.guard.ts`), JWT in HTTP-only `indranetra_session` cookie, `frontend/app/{signup,login,
  verify-email,forgot-password,reset-password,profile-setup}`. Full detail in `AUTH_AND_ROLES.md`.

### 2.2 Role-based access **[DONE]**
- Backend authority: `@Roles()` + `RolesGuard` on every protected endpoint. Frontend convenience:
  `NAV_BY_ROLE` / `canAccessTab` in `frontend/app/dashboard/utils.ts` (single source of truth).
- Each role auto-redirects to `/{role}/dashboard` on login.

### 2.3 In-app notifications (bell) **[DONE]**
- Persisted `Notification` rows, unread badge, mark-read. Written on SOS, alerts, new reports,
  dispatch. **Built from:** `notifications` module + `NotificationsService.notifyRoles()`, header
  bell in dashboard, `useSocket` `notification` event.

### 2.4 Realtime updates **[DONE]**
- `CrowdGateway` (Socket.IO, Redis-backed) broadcasts `crowd_update`, `alert_received`,
  `alert_resolved`, `sos_received`, `report_received`, `volunteer_updated`, `notification`.
  Consumed by `frontend/hooks/useSocket.ts`.

---

## 3. Per-role feature set & workflow

### 👑 ADMIN — control room (sees everything)

| Feature | Status | How it's built | How it works |
|---|---|---|---|
| Approve/reject organizers | [DONE] | `auth` module, Users tab | Pending queue → approve sets `isApproved`, emails the organizer |
| User management (list, change role, delete) | [DONE] | `GET/PATCH/DELETE /auth/users*` | Only path to create another ADMIN |
| Event CRUD (all events) | [DONE] | `events` module | Create/edit/start/end/cancel any event |
| Camera management (all events) | [DONE] | `cameras` module | Add/edit/delete/test/analyze cameras |
| Live monitoring + heatmap | [DONE] | `cameras.service` → `ai-service` | Start scan → live count/density/risk + heatmap overlay |
| Global alerts view + resolve | [DONE] | `Alerts` tab, `PATCH /crowd/alerts/:id/resolve` | See all unresolved alerts, acknowledge |
| Volunteer dispatch (to any SOS/report) | [DONE] | `volunteers` module | Assign a volunteer to an incident |
| Analytics (crowd trend, incidents) | [PARTIAL] | `analytics` tab, Recharts | Currently partly mock — see §4 |
| Evacuation route | [PARTIAL] | `ai-service /route` + map | Path-find safest exit; simplify to fixed behaviour |
| Notifications, profile | [DONE] | — | — |

**Workflow:** log in → `/admin/dashboard` → pick event from top selector → monitor live map/cameras
→ alerts fire automatically → resolve alerts / dispatch volunteers → review analytics.

**Cut for v1:** Settings tab (localStorage-only mock toggles — remove or make it do nothing real).

---

### 🎫 ORGANIZER — owns their events

| Feature | Status | How it's built | How it works |
|---|---|---|---|
| Event CRUD (own events only) | [DONE] | `events.service` scoped by `createdBy` | Cannot see other organizers' events (server-enforced) |
| Camera management (own events) | [DONE] | `cameras` module | Same as admin but scoped |
| Live monitoring + heatmap | [DONE] | as above | — |
| Alerts view + resolve (own events) | [DONE] | Alerts tab | — |
| Volunteer dispatch | [DONE] | `volunteers` module | Global roster for now (org-scoping = later) |
| Notifications, profile | [DONE] | — | — |

**Workflow:** signup as ORGANIZER → **wait for admin approval** → log in → complete profile (org
name, designation, contact) → `/organizer/dashboard` → create event → add cameras → go live →
monitor + respond.

**No access to:** Users tab, organizer approvals, other organizers' events, Settings.

---

### 🦺 VOLUNTEER — field responder (event-scoped, organizer/admin-controlled)

**Access is gated: a volunteer cannot use the dashboard until an organizer or admin assigns
them to an event.** They sign up into a pending pool; the organizer who owns the target event
(or any admin) assigns+approves them to that event in one action. One event per volunteer.

| Feature | Status | How it's built | How it works |
|---|---|---|---|
| Pending-approval gate | [DONE] | `User.isApproved` + `Volunteer.eventId`; pending screen in dashboard | Unapproved volunteer logs in → sees "awaiting event assignment" screen |
| Get assigned/approved by org/admin | [DONE] | `GET /volunteers/pending`, `PATCH /volunteers/:id/assign` `{eventId}` | Organizer sees pending pool, assigns to one of *their* events; admin to any. Backend re-checks ownership. Notifies the volunteer. |
| Rejected if not needed | [DONE] | `PATCH /volunteers/:id/reject` | Removes the pending application |
| Toggle duty status (AVAILABLE/INACTIVE) | [DONE] | `PATCH /volunteers/status` | Controls dispatch eligibility |
| Update own live location | [DONE] | `PATCH /volunteers/location` | Broadcasts to control-room map |
| View assigned SOS/incidents | [DONE] | volunteer-duty tab | Sees what they're dispatched to |
| Mark SOS/report resolved | [DONE] | `PATCH /volunteers/{sos,reports}/:id/resolve` | Frees themselves back to AVAILABLE |
| Read-only camera monitoring | [DONE] | cameras tab (no add/edit/delete) | — |
| Raise own SOS | [DONE] | `POST /volunteers/sos` | Same as public capability |
| Notifications, profile | [DONE] | — | — |

**Workflow:** signup as VOLUNTEER → verify email → log in → complete profile (phone, skills,
availability) → **"awaiting event assignment" screen** → organizer/admin assigns them to an
event → notification received → `/volunteer/dashboard` (scoped to that event) → set AVAILABLE →
receive dispatch → navigate to incident on map → mark resolved.

**Who assigns:** the organizer who **owns** the event (server-enforced via `event.createdBy`),
or any admin. Organizers see the global pending pool but can only assign to their own events.

**No:** choosing their own event, dispatching *other* volunteers, event/camera management.

---

### 🙋 PUBLIC — attendee

| Feature | Status | How it's built | How it works |
|---|---|---|---|
| One-tap SOS (auto GPS) | [DONE] | `POST /volunteers/sos` | Notifies control room instantly |
| File incident report (+ optional photo) | [DONE] | `POST /reports` (+ Cloudinary) | Appears live in control room |
| "How busy is it" simplified view | [PARTIAL] | public-home tab | Show current risk/status only — no raw feeds |
| Notifications, profile | [DONE] | — | — |

**Workflow:** signup as PUBLIC (or Google) → complete profile (phone, emergency contact) →
`/public/dashboard` → tap SOS in emergency, or report a hazard.

**No access to:** cameras, events, users, volunteers, analytics, settings.

---

## 4. Accuracy — make the numbers trustworthy

| Lever | Status | What it does |
|---|---|---|
| Real people/m² density (not a magic multiplier) | [DONE] | `Event.areaSqMeters` → density = count/area; Fruin risk bands |
| YOLO person-class filter + confidence ≥ 0.5 | [DONE] | `yolo/detector.py` — ignores non-people & weak boxes |
| IoU tracking + temporal smoothing | [DONE] | De-dupes counts, stabilises across frames |
| Consistent risk thresholds across mock & real | [DONE] | `common/risk.util.ts` mirrors `prediction/risk.py` |
| Analytics on **real** data, not mock seed points | [DONE] | `GET /crowd/:eventId/analytics` aggregates real `CrowdReport`+`Alert` history (trend, peak/avg crowd, avg density, alert counts, avg resolution minutes); charts seeded from it, no hardcoded points |
| Per-camera zone area (not venue/cameraCount guess) | [TODO/deferred] | True per-zone density — Phase 1 digital twin |

## 5. Speed — make it fast

| Lever | Status | What it does |
|---|---|---|
| Downscale frames ≤1280px before inference | [DONE] | YOLO + heatmap are O(w·h) — big win on phone photos |
| Model warmup on startup | [DONE] | First real request doesn't pay cold-start |
| Heatmaps to Cloudinary, URL in DB | [DONE] | No multi-KB base64 in every row/payload |
| Redis-backed Socket.IO | [DONE] | Broadcasts scale to multiple API instances |
| Latest-analysis cache in Redis | [TODO] | Serve dashboard reads without re-hitting the model |
| Cap crowd-history query / paginate | [TODO] | Keep `/crowd/:id/history` cheap as data grows |

---

## 6. Build order (step by step)

Foundation (§1–2) is already working. Build the remaining scoped features in this order — each
step is independently verifiable (`tsc` + build + click-through) before moving on.

1. **Auth polish & verify end-to-end.** Confirm all 4 role signup/login flows work (email +
   Google), approval gate, redirects. Configure `RESEND_API_KEY` so emails actually send.
2. **PUBLIC dashboard finalize.** Real "how busy" status from live `crowd_update`; SOS + report
   forms confirmed working. Smallest surface, fastest to lock down.
3. **VOLUNTEER dashboard finalize.** Duty toggle, location push, assigned-incident list, resolve.
4. **Camera → AI pipeline hardening.** One reliable path: register camera → test → start scan →
   see live count/density/risk/heatmap. Verify against real webcam + RTSP fallback.
5. **Alerts end-to-end.** Threshold breach → alert created → shows in Alerts tab + notification →
   resolve clears it everywhere. (Backend done; verify the UI loop.)
6. **ORGANIZER event lifecycle.** Create → add cameras → start (Live) → monitor → end. Scoped to own.
7. **ADMIN oversight.** Approvals, user management, cross-event view, dispatch.
8. **Analytics on real data** — ✅ done. `GET /crowd/:eventId/analytics` drives the charts/stats.
9. **Speed pass** (§5 TODOs) — Redis latest-analysis cache + history pagination.
10. **Cleanup** — remove Settings mock tab; de-duplicate the dispatch form and report form
    (shared components); delete dead imports.

---

## 7. Explicitly deferred (NOT v1)

Digital-twin zones/PostGIS, density forecasting/pre-alerts, multi-camera fusion, crush-velocity
detection, operator LLM copilot, public PWA, incident timelines/after-action PDF, offline/edge mode.
All in `BLUEPRINT.md` as Phase 1+.
