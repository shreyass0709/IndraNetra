# IndraNetra — Rebuild Specification

This is the master blueprint for rebuilding IndraNetra. It is written to be executed
phase by phase by a Claude (Opus) coding session: each phase is self-contained, names
its files, and ends with acceptance checks that must pass before moving on.

**Read this whole file before starting any phase. Do phases in order.**

## Ground rules for the implementing model

1. **One phase per session/PR.** Do not mix phases.
2. **Plain English everywhere.** No "tactical HUD", "distress vectors", "telemetry",
   "signals calibrated". Say "Live map", "Emergency help", "Camera is offline".
   Full copy rules in §11.
3. **Real routes, not tabs.** The old app was one 3,593-line `dashboard/page.tsx`
   with every feature as a tab and 10-line redirect stubs for the other pages.
   That file gets deleted. Every feature is its own route with its own page file.
4. **Role checks live in the backend.** Frontend hides buttons; backend enforces.
   Every mutating endpoint has `@Roles(...)`. Never trust the client.
5. **All API calls go through `frontend/services/api.ts`.** No ad-hoc `fetch`.
6. **Keep what already works.** Prisma schema (with the new Zone/Gate/calibration
   fields), the AI service (`ground.py`, `risk.py`, `pathfinder.py`), Socket.IO
   gateway, Redis adapter, Cloudinary, Resend — all stay. This is a frontend
   restructure + backend hardening, not a from-scratch rewrite of the stack.
7. **After schema changes:** `npm run generate:prisma` then `npm run db:push`
   (stop the backend dev server first or generate fails with EPERM on Windows).

---

## 1. Target structure

### Frontend (`frontend/`)

```
app/
  layout.tsx                     # fonts, theme, global providers
  page.tsx                       # public landing page (new design, §10)
  (auth)/
    login/page.tsx
    signup/page.tsx
    verify-email/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  admin/
    layout.tsx                   # sidebar + header shell, guards role=ADMIN
    dashboard/page.tsx           # overview KPIs + live map
    events/page.tsx              # list
    events/new/page.tsx          # create wizard
    events/[id]/page.tsx         # detail: edit, zones, gates
    monitoring/page.tsx          # camera grid for selected event
    monitoring/[cameraId]/page.tsx  # single camera: live view + calibration
    emergency/page.tsx           # SOS queue + incidents + dispatch
    analytics/page.tsx
    users/page.tsx
    settings/page.tsx
  organizer/
    layout.tsx                   # guards role=ORGANIZER
    dashboard/page.tsx           # same as admin but scoped to own events
    events/... (same sub-routes, own events only)
    monitoring/...
    emergency/page.tsx
    analytics/page.tsx
    settings/page.tsx
  volunteer/
    layout.tsx                   # guards role=VOLUNTEER
    dashboard/page.tsx           # my zone, my tasks, my route
    tasks/page.tsx               # assigned SOS / incidents
    report/page.tsx              # report an incident
    settings/page.tsx
  public/
    layout.tsx                   # guards role=PUBLIC (logged-in attendee)
    dashboard/page.tsx           # crowd status, my safest exit, SOS button
    sos/page.tsx
    settings/page.tsx
  profile/page.tsx               # shared, all roles
  profile-setup/page.tsx         # first-login flow (volunteer/organizer details)

components/
  ui/                            # Button, Card, Input, Select, Badge, Modal,
                                 # Table, Tabs, Toast, Skeleton — one design system
  layout/Sidebar.tsx, Header.tsx, NotificationBell.tsx
  map/LiveMap.tsx                # Leaflet: cameras, zones, gates, route, heat
  map/DrawZone.tsx               # polygon drawing for zones
  map/LocationPicker.tsx
  kpi/KpiCard.tsx
  camera/CameraTile.tsx, CalibrationEditor.tsx
  charts/CrowdChart.tsx

services/api.ts                  # the ONLY fetch layer
hooks/useAuth.ts                 # session, role, guards
hooks/useSocket.ts               # keep, already works
lib/copy.ts                      # all user-facing strings (enforces plain English)
lib/format.ts                    # dates, numbers
```

Deleted: `app/dashboard/` (monolith + hook + utils), `app/alerts/`,
`app/monitoring|events|users|emergency|analytics|settings|volunteers|report/page.tsx`
stubs, `components/SidebarNav.tsx`.

### Backend (`backend/src/`)

```
auth/            # keep, harden (§3)
users/           # NEW: split user management out of auth
events/          # keep, add zones + gates endpoints (§5)
cameras/         # keep, add calibration endpoint (§7)
crowd/           # keep: analysis loop, reports, gateway
emergency/       # RENAMED from parts of volunteers+reports: SOS, incidents, dispatch
analytics/       # NEW: real aggregate endpoints (§9)
notifications/   # keep
volunteers/      # keep (volunteer profile/status)
prisma/, realtime/, common/     # keep
```

The standalone **alerts feature is removed** (§8): no alerts page, no alerts tab.
The `Alert` table stays as the record behind warnings, surfaced only inside the
Emergency Centre and the notification bell.

### AI service (`ai-service/`)

Unchanged in this rebuild except where §7/§6 name additions. `ground.py`
(calibration), `risk.py` (Fruin bands + ML floor), `pathfinder.py` (A*) already work.

---

## 2. Roles — what each role can do (the contract)

| Feature              | ADMIN | ORGANIZER            | VOLUNTEER          | PUBLIC |
|----------------------|-------|----------------------|--------------------|--------|
| Sign up freely       | no — seeded/promoted only | yes, needs admin approval | yes, needs organizer assignment | yes, instant |
| Events               | full CRUD, all events | full CRUD, **own events only** | view assigned event | view joined event (name, status only) |
| Zones & gates        | edit all | edit own events | view | — |
| Cameras              | add/edit/delete/calibrate, all | add/edit/delete/calibrate, own events | view feeds of assigned event | — |
| Live monitoring page | yes | yes (own) | read-only, assigned event | — |
| Dashboard KPIs + map | all events | own events | own zone focus | simplified: crowd level + exit |
| Emergency centre     | full: resolve, dispatch | full, own events | sees own assignments, updates status | sends SOS only |
| Send SOS             | — | — | yes | yes |
| Report incident      | yes | yes | yes | yes (simple form) |
| Evacuation routing   | trigger + broadcast | trigger + broadcast (own events) | receives own route | receives own exit instruction |
| Analytics            | all events | own events | — | — |
| Users page           | full: approve, change role, deactivate | approve volunteers for own events | — | — |
| Settings             | system thresholds + own account | event defaults + own account | own account | own account |
| Notifications bell   | yes | yes | yes | only safety messages |

Enforcement: `RolesGuard` + `@Roles()` on every endpoint, and **ownership checks**
in services (an ORGANIZER passing another organizer's eventId gets 403, not a
filtered success).

---

## 3. Phase 1 — Fresh start + Auth

### 3.0 Database reset

```bash
# stop backend first
npx prisma db push --force-reset       # wipes ALL data, applies current schema
npm run generate:prisma
npx ts-node backend/src/seed.ts        # seeds ONLY the admin below
```

Seed exactly one user: `admin@indranetra.local` / a strong generated password
printed to console once. Role ADMIN, verified, approved. **No demo events, no
demo cameras, no demo users.** The app must work correctly when empty (§12).

### 3.1 Backend hardening (auth module)

Keep: JWT in httpOnly cookie `indranetra_session`, bcrypt, email verification via
Resend, Google OAuth, password reset. Add/fix:

- **Rate limiting**: `@nestjs/throttler` — 5 attempts/minute on `/auth/login`,
  `/auth/forgot-password`, `/auth/signup`. (Already-installed Nest ecosystem; one
  module import.)
- **Password policy**: min 8 chars, at least one letter and one number. Validate
  server-side with class-validator DTOs. Clear message: "Password needs at least
  8 characters with a letter and a number."
- **Signup role rules**: signup form offers only PUBLIC / VOLUNTEER / ORGANIZER.
  ADMIN cannot be self-selected — reject server-side. ORGANIZER accounts start
  `isApproved=false` and see a "waiting for approval" screen until an admin
  approves. VOLUNTEER accounts additionally need an event assignment before the
  volunteer dashboard unlocks (existing rule in AUTH_AND_ROLES.md — keep it).
- **Generic auth errors**: login failure always says "Email or password is
  incorrect" — never reveal which, never reveal "user does not exist".
- **Email verification required** before login completes (except Google OAuth,
  which is verified by Google).
- **Session**: 24h expiry, `sameSite=lax`, `secure` in production, `httpOnly`.
  Logout clears the cookie server-side.
- **/auth/me** returns `{ id, name, email, role, isApproved, needsProfileSetup }`
  — the single source the frontend trusts for routing.

### 3.2 Frontend auth pages (new design, §10)

- Login: email + password, "Continue with Google", forgot-password link.
  On success route by role: ADMIN→/admin/dashboard, ORGANIZER→/organizer/dashboard
  (or waiting-for-approval screen), VOLUNTEER→/volunteer/dashboard (or waiting-
  for-assignment screen), PUBLIC→/public/dashboard. `needsProfileSetup` →
  /profile-setup first.
- Signup: name, email, password, role picker with plain descriptions:
  - "Attendee — I'm going to an event" (PUBLIC)
  - "Volunteer — I want to help at an event" (VOLUNTEER)
  - "Event organizer — I run events" (ORGANIZER)
- Route guards: each role layout calls `/auth/me` server-side; wrong role →
  redirect to that user's home. Unauthenticated → /login. **No flash of
  protected content.**

### Acceptance checks (Phase 1)

- [ ] Signup as PUBLIC → verify email → login → lands on /public/dashboard.
- [ ] Signup as ORGANIZER → sees "waiting for approval", cannot reach organizer pages by URL.
- [ ] 6th login attempt in a minute → "Too many attempts, try again in a minute."
- [ ] Weak password rejected server-side with the plain-English message.
- [ ] Direct URL to /admin/dashboard as PUBLIC → redirected, no content flash.
- [ ] Signup POST with role=ADMIN → 400.

---

## 4. Phase 2 — App shell + design system

Build `components/ui/*`, the role layouts (sidebar + header + notification bell),
`useAuth`, and `lib/copy.ts` before any feature pages. Design rules in §10.

Sidebar per role shows exactly the §2 features that role has. No dead links.
Header: event selector (admin/organizer), notification bell, profile menu.

### Acceptance checks

- [ ] Each role sees only its own menu items.
- [ ] Notification bell shows unread count, marks-read on open (existing endpoints).
- [ ] Light/dark theme toggle works and persists.

---

## 5. Phase 3 — Events (create, edit, zones, gates)

### Who: ADMIN (all events), ORGANIZER (own only). Backed by `createdBy`.

### Create event — a 3-step wizard, not one giant form

1. **Basics**: name, type, description, start/end time, expected attendance,
   maximum capacity.
2. **Location**: search/click on map (existing LocationPicker), venue area in m²
   ("Draw the venue outline on the map" — polygon draw computes area
   automatically; typing a number is the fallback).
3. **Layout**: draw zones (name + polygon → area auto-computed, capacity,
   density threshold defaulting to 4/m²) and place gates (click map, name,
   width in metres, type entry/exit). At least one exit gate required to finish.

Draft support: steps 1–2 can be saved as Draft; event can't go Live without a
zone and an exit gate.

### Endpoints

```
POST   /events                    ADMIN, ORGANIZER
GET    /events                    role-scoped list (organizer: own; admin: all)
GET    /events/:id                role-scoped
PATCH  /events/:id                owner or admin
DELETE /events/:id                owner or admin — confirm modal lists what
                                  cascades (cameras, zones, gates, reports)
POST   /events/:id/zones          owner or admin
PATCH  /events/:id/zones/:zoneId
DELETE /events/:id/zones/:zoneId
POST   /events/:id/gates          (same pattern)
PATCH  /events/:id/gates/:gateId  (includes isOpen toggle)
DELETE /events/:id/gates/:gateId
PATCH  /events/:id/status         Upcoming → Live → Completed / Cancelled
```

Validation (server-side DTOs): endTime > startTime, maxCapacity > 0, zone polygon
≥ 3 points, zone areas sum ≤ venue area × 1.05, gate width 0.5–30 m.

### Acceptance checks

- [ ] Organizer A cannot GET/PATCH/DELETE organizer B's event (403).
- [ ] Creating an event with zones and 2 gates persists all three tables.
- [ ] Event can't be set Live without an exit gate — error says so plainly.
- [ ] Deleting an event removes its cameras/zones/gates (cascade) after a
      confirm dialog that names the counts.

---

## 6. Phase 4 — Dashboard (per role)

### Admin & Organizer dashboard

Top row — 5 KPI cards, each **computed correctly**:

1. **People now** = sum of the latest reading per online camera where the reading
   is < 30 s old. Stale cameras excluded and counted separately: subtitle
   "2 cameras not reporting" when applicable. Never silently under-report.
2. **Busiest area** = max zone density (zone = sum of its cameras' people ÷ zone
   area; calibrated cameras use their measured local density). Shows the zone
   name: "Gate A — 4.2 people/m²". Venue average shown small underneath.
3. **Safety level** = worst zone's risk from the Fruin bands, plus trend:
   "Rising fast" if density slope > 0.5/m² per minute over the last 3 minutes.
   Levels shown as: Safe / Getting busy / Crowded / Dangerous (plain English
   for LOW/MEDIUM/HIGH/CRITICAL; colors green/yellow/orange/red).
4. **Cameras online** = `status==='Online' AND last analytics < 30s` as "7 of 9",
   click → monitoring page filtered to the silent ones.
5. **Helpers available** = volunteers of THIS event with status AVAILABLE and
   lastActive < 10 min. Subtitle: "12 total assigned".

Live map (LiveMap.tsx): event outline, zone polygons colored by current risk,
camera markers (green/gray by online), gate markers, volunteer positions,
active SOS pins, heat layer from camera readings, and the evacuation route
polyline when active. Legend in plain English.

**Evacuation route button** (admin + organizer): calls the routing endpoint (§7.4),
draws per-zone routes to assigned gates, broadcasts to volunteers/public via
socket. Recomputes every analytics tick while active. "Stop evacuation" undoes it.

Crowd chart: people-over-time for the selected event (real CrowdReport data),
labeled "People over time" — not "Real-Time Crowd flow vector".

### Volunteer dashboard

- My assigned event + zone, its current crowd level in plain words.
- My tasks: SOS/incidents assigned to me, each with an "On my way" / "Done" button.
- My route: when an evacuation is active, a map with MY route from my GPS
  position to my assigned gate. Availability toggle (Available / Taking a break).

### Public dashboard

- "How busy is it?" — one big friendly status: "Not busy / Getting busy /
  Very busy — consider moving to a quieter area". **Never shows "Dangerous"
  or red panic UI** — during an evacuation it shows: "Please head to Exit C —
  about 6 minutes away" with a map and route from the user's GPS.
  Exit assignment is load-balanced server-side (§7.4) so different users get
  different gates by design.
- Big SOS button → §8.
- "Report a problem" simple form.

### Acceptance checks

- [ ] Kill one camera feed → People-now drops that camera and the subtitle says
      "1 camera not reporting" within 30 s.
- [ ] Two zones, one crowded: Busiest-area shows the crowded zone's number, not
      the average.
- [ ] Volunteer sees only their event/zone; URL-hacking another eventId → 403.
- [ ] Public never receives risk levels over the socket — server filters the
      payload for PUBLIC role connections (check the gateway, not the UI).

---

## 7. Phase 5 — Live monitoring & cameras

### Who can manage cameras

Add / edit / delete / calibrate: ADMIN (any event), ORGANIZER (own events).
VOLUNTEER: view-only grid of their event. PUBLIC: nothing.

### Camera lifecycle

1. **Add** (modal): name, source type (Laptop webcam / Phone camera / RTSP /
   Video file), URL if applicable, then click its position on the event map,
   and pick its zone from a dropdown. A camera must belong to a zone.
2. **Test**: "Test connection" button hits existing test endpoint, shows a
   plain result: "Camera is working" / "Could not connect — check the URL."
3. **Calibrate** (`monitoring/[cameraId]`): pause a frame, click 4 points on
   the ground in order around a shape whose real size is known, type the
   real-world corner coordinates in metres (with a diagram in the UI showing
   an example: "corners of the barrier square, 5 m × 5 m"). Saves to
   `Camera.calibration` (validated by the same rules as `ground.py`: convex,
   ≥1 m², perimeter order — reject with the plain message the API returns).
   Uncalibrated cameras show a persistent badge: "Not calibrated — counts are
   less accurate" with a "Calibrate" link.
4. **Analyze loop**: keep the existing backend loop (frontend uploads webcam
   frames / backend polls RTSP via ai-service). Results → CameraAnalytics +
   socket `crowd_update`. Response now includes `calibrated`,
   `density_mean`, `outside_quad` — show "measured" vs "estimated" on the tile.
5. **Delete**: confirm dialog; cascades analytics (already in schema).

### Endpoints (add to cameras module)

```
PATCH /cameras/:id/calibration    ADMIN, ORGANIZER(own) — validates quad server-side
DELETE /cameras/:id/calibration   remove calibration
```

### 7.4 Evacuation routing endpoint (backend, new in crowd module)

`POST /crowd/events/:id/evacuate` (ADMIN, ORGANIZER own) and
`GET /crowd/events/:id/my-route` (VOLUNTEER, PUBLIC — takes lat/lng):

1. Build a cost grid over the event bounding box (~40×40): cell density
   interpolated (inverse-distance) from latest camera readings' ground points;
   zone polygons with no camera get their zone average; cells in no zone get 0.
2. Cell cost = seconds to cross: `cellMeters / (1.34 * max(0.05, 1 - d/5.4))`
   (Weidmann speed collapse). Density ≥ 5.4 → impassable.
3. For each open EXIT gate: A* (existing `/route` in ai-service, pass the grid)
   from each zone centroid → travel seconds, plus queue seconds =
   assignedPeople / (1.3 × gateWidth).
4. Assign zones to gates greedily by total time, updating gate queues after
   each assignment (load balancing — never send everyone to one gate).
5. Persist the assignment, broadcast `evacuation_started` with per-zone routes;
   `my-route` answers from the stored assignment using the caller's position
   (nearest zone). Recompute on each new analytics tick while active;
   `DELETE .../evacuate` stops it and broadcasts `evacuation_stopped`.

### Acceptance checks

- [ ] Camera can't be created without a zone.
- [ ] Bowtie calibration quad rejected with a message telling the user to click
      corners in order around the shape.
- [ ] Calibrated camera tile shows "measured", uncalibrated shows "estimated".
- [ ] With 2 exit gates and one crowded path, the evacuation assignment routes
      around the crowded cells and splits zones across both gates.
- [ ] Volunteer/public `my-route` returns a route from THEIR coordinates.

---

## 8. Phase 6 — Emergency Centre (alerts feature removed)

The old standalone Alerts page/tab is **deleted**. Everything urgent lives in ONE
place: the Emergency Centre. The `Alert` DB table remains as the storage for
system warnings, shown here as "Warnings".

### Layout (admin/organizer)

Three columns, newest first, all live over sockets:

1. **SOS requests** (from attendees/volunteers): who, where (map pin), when,
   status Pending → Helper on the way → Resolved. "Send helper" opens the
   dispatch picker: available volunteers of this event sorted by distance to
   the SOS pin; picking one sets volunteer ASSIGNED, notifies them, and the
   SOS becomes "Helper on the way".
2. **Problem reports** (incidents): description, optional photo (Cloudinary),
   reporter, zone; Open → Being handled → Fixed. Same dispatch picker.
3. **Warnings** (auto-raised): overcrowding (zone crossed its density
   threshold), camera offline > 2 min, evacuation active. Each has "Mark as
   handled" (existing resolve endpoint). Overcrowding warnings auto-resolve
   when the zone drops below threshold for 2 minutes.

Volunteer view: only their own assignments with status buttons.
Public: the SOS button page — press → confirm → sends GPS + optional note;
shows "Help is on the way — [name] is coming to you" when dispatched.

### Backend

Consolidate into `emergency/` module: move SOS endpoints (from volunteers) and
incident reports (from reports) + dispatch + the alerts list/resolve (from
crowd). Keep the socket events (`sos_received`, `alert_received`,
`alert_resolved`, `report_received`) — rename only UI labels, not wire events.

### Acceptance checks

- [ ] Public SOS → appears in emergency centre in < 2 s with a map pin.
- [ ] Dispatch → volunteer gets a notification + task; their "Done" resolves
      the SOS and returns them to AVAILABLE (existing logic — keep).
- [ ] Zone crossing its threshold raises exactly ONE overcrowding warning
      (no duplicate spam while it stays over), auto-resolves after recovery.
- [ ] /alerts URL no longer exists; old links redirect to /…/emergency.

---

## 9. Phase 7 — Analytics (real numbers only)

New `analytics/` backend module reading CrowdReport + CameraAnalytics + Alert +
SOSRequest. **No invented numbers, no Math.random.** If there's no data, show
"No data yet — analytics appear once cameras start reporting."

Per event (admin: any; organizer: own):

- People over time (line, selectable range: last hour / day / whole event)
- Peak count + when it happened
- Per-zone comparison: peak density, minutes above threshold
- Warnings summary: count by type, average time-to-resolve
- SOS summary: count, average response time
- Camera uptime %

Endpoints: `GET /analytics/events/:id/summary`, `GET /analytics/events/:id/timeseries?from&to&zoneId`.
Aggregate with Prisma `groupBy`/raw SQL; no loading whole tables into JS.

### Acceptance checks

- [ ] Empty event shows the friendly empty state, not zeros or fake charts.
- [ ] Numbers match a hand-run SQL count on the same range.

---

## 10. Design system (complete UI replacement)

Delete the current look entirely: no monospace terminal font, no all-caps
tracking-widest labels, no scanline/ticker effects, no `[BRACKETED SYSTEM
MESSAGES]`.

- **Font**: Inter (via `next/font`), system-ui fallback. Headings 600, body 400.
  One font family everywhere; monospace ONLY for RTSP URLs and coordinates.
- **Colors**: neutral background (white / near-black dark mode), one primary
  (blue-600), semantic status colors used ONLY for status: green=safe,
  yellow=getting busy, orange=crowded, red=dangerous/emergency. Red is
  reserved — if everything is red, nothing is.
- **Layout**: left sidebar (collapsible, icons + labels), top header, content
  max-w-screen-2xl, cards with rounded-xl borders, generous whitespace,
  16px base font (the old 8–10px labels are gone — accessibility floor).
- **Components**: build the `components/ui` set once in Phase 2; every page
  uses them. Tailwind only, no new UI dependency.
- **Landing page** (`app/page.tsx`): clean hero — what IndraNetra does in one
  sentence ("See how crowded your event is, in real time, and keep people
  safe"), three feature cards (Live crowd view / Instant help / Safe exits),
  login + signup buttons. No fake stats, no stock-photo hero.
- **Login/signup**: centered card, logo, minimal.
- **Motion**: framer-motion already installed — page fade, list stagger,
  nothing looping or pulsing except the live-dot on "live" indicators.
- **Accessibility**: every input labeled, focus rings on, color never the only
  signal (icons + text on status), contrast AA.

## 11. Copy rules (`lib/copy.ts`)

All user-visible strings live in `lib/copy.ts` and follow:

- 8th-grade English. No jargon: not "telemetry", "vectors", "HUD", "recon",
  "provision", "distress signal", "anomaly", "density index".
- Say what happened and what to do: "Camera 3 stopped responding. Check its
  power and internet." not "SIGNAL LOST: NODE 3".
- Risk levels display as: Safe / Getting busy / Crowded / Dangerous.
- Buttons are verbs: "Add camera", "Send helper", "Start evacuation".
- Errors never blame the user and always suggest the fix.

## 12. Empty states & error states (every page)

Every list/table/chart has: a loading skeleton, a friendly empty state with the
action to fill it ("No cameras yet — add your first camera"), and an error state
with retry. The app must be fully usable from the seeded empty database.

---

## 13. Build order (one phase = one session)

| Phase | Scope | Depends on |
|-------|-------|-----------|
| 1 | DB reset + auth hardening + auth pages | — |
| 2 | Design system + role shells + guards + copy.ts | 1 |
| 3 | Events CRUD + zones + gates | 2 |
| 4 | Dashboards (admin/organizer, volunteer, public) | 3 |
| 5 | Monitoring + cameras + calibration UI + evacuation endpoint | 3 |
| 6 | Emergency centre (replaces alerts) | 2 |
| 7 | Analytics | 4 |
| 8 | Users page, settings, profile, profile-setup | 2 |
| 9 | Copy sweep, empty states audit, delete dead code, run all acceptance checks | all |

Phase 8 details: Users page (admin: search/filter, approve organizer, assign
volunteer to event, change role with confirm, deactivate — soft flag, not
delete; organizer: approve volunteers for own events only). Settings: account
(name, password change, notification preferences) for everyone; system defaults
(density threshold default, camera stale window) for admin — stored in DB,
not localStorage. Profile/profile-setup: keep existing flow, restyle.

Each phase ends with: `npm test --prefix backend` green, `npm run build --prefix
frontend` green, and that phase's acceptance boxes checked by hand.
