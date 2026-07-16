# IndraNetra — Auth & Roles: Structure and Fixed-Scope Plan

> Goal: one reliable, unambiguous path to get an account and land in the right dashboard,
> and a **locked-down, minimal feature set per role** — not everything the current
> 3,500-line dashboard half-supports. Cut anything duplicated, orphaned, or bug-prone.

---

## 1. Structure

### Routes (frontend)
```
/                    marketing/landing page
/signup              create account (role chosen here — the only place)
/login               sign in (email/password or Google) — never changes role
/verify-email        consumes the emailed token
/forgot-password      /reset-password   password recovery
/profile-setup       one-time: collect role-specific required fields only
/dashboard           the actual app shell, role-aware
/admin/dashboard  /organizer/dashboard  /volunteer/dashboard  /public/dashboard
                     thin wrappers that render /dashboard — the redirect in
                     useDashboardData's auth effect is what actually enforces
                     "your role only sees your path"
```

### Backend (`auth` module)
```
POST /auth/register          email+password, role: PUBLIC | VOLUNTEER | ORGANIZER
POST /auth/google             Google ID token, role: PUBLIC | VOLUNTEER | ORGANIZER
POST /auth/verify-email
POST /auth/login
POST /auth/forgot-password  POST /auth/reset-password
POST /auth/complete-profile   role-specific fields ONLY — must not change role (see §4 fix)
POST /auth/logout
GET  /auth/me
GET  /auth/pending-organizers          ADMIN
POST /auth/approve-organizer/:id       ADMIN
POST /auth/reject-organizer/:id        ADMIN
GET  /auth/users  PATCH /auth/users/:id/role  DELETE /auth/users/:id     ADMIN
```

### Data model (unchanged, already correct)
`User { role, emailVerified, isApproved, profileComplete }` + exactly one of
`OrganizerProfile | Volunteer | PublicUserProfile` depending on role. `Role` enum:
`ADMIN | ORGANIZER | VOLUNTEER | PUBLIC`.

---

## 2. Signup — fixed flow

1. User fills **name, email, password, role** on `/signup`. Role dropdown offers only
   `PUBLIC | VOLUNTEER | ORGANIZER` — `ADMIN` is never offered and the backend hard-rejects
   it (`register()` already throws `ForbiddenException` on `role === ADMIN` — keep as-is).
2. Backend creates the user: `emailVerified: false`, `profileComplete: false`,
   `isApproved: role === ORGANIZER ? false : true`. Sends a verification email.
3. Frontend shows "check your email" — **no dashboard access until verified.**
4. User clicks the emailed link → `/verify-email` → `POST /auth/verify-email`. Backend
   flips `emailVerified: true`. (If role is `VOLUNTEER`, a `Volunteer` row is created here —
   already correct, keep.)
5. User logs in (§3). If role is `ORGANIZER` and not yet approved, login is blocked with a
   clear "pending admin approval" message — **do not let them past this on any path.**
6. First successful login with `profileComplete: false` → redirect to `/profile-setup`.
7. `/profile-setup` collects only the fields for the role **fixed at signup**:
   - `ORGANIZER`: organization name, designation, contact number
   - `VOLUNTEER`: phone number, skills, availability
   - `PUBLIC`: phone number, emergency contact
   Submitting sets `profileComplete: true` and redirects to `/dashboard`.

**Role is chosen exactly once, at step 1. Nothing downstream ever changes it** (see §4).

---

## 3. Login — fixed flow

1. Email + password → `POST /auth/login`. Backend blocks with a clear message if
   `!emailVerified` or (`role === ORGANIZER && !isApproved`) — both already implemented,
   keep exactly as-is.
2. **Google Sign-In** — same account, same rules, no shortcuts:
   - On `/login`, the Google button signs in an **existing** account or creates a new
     **PUBLIC** account (Google is the fast path for citizens, not a role-selection UI).
   - On `/signup`, "Continue with Google" (new, see §4) carries whatever role the user
     picked in the dropdown, exactly like the password form.
3. On success: `!profileComplete` → `/profile-setup`; else → `/dashboard`, which redirects
   to the role's fixed path (`/admin/dashboard`, etc.) — already implemented in
   `useDashboardData`'s auth effect, keep.

---

## 4. Role selection — where, and the two bugs this closes

**Rule: role is selected once, only on `/signup`, for both password and Google signup.**
Nothing else may change a user's own role.

| Today (broken) | Fixed |
|---|---|
| Login page's Google button hardcodes `role: 'PUBLIC'` — fine, but... | Keep this — Google-on-login is deliberately PUBLIC-only, no ambiguity. |
| `/profile-setup` shows a **role dropdown** for any `PUBLIC` user (meant for Google sign-ups), and submitting `ORGANIZER` there goes through `completeProfile()`, which **never checks/sets `isApproved`** — so a Google user can grant themselves the ORGANIZER dashboard with zero admin approval. | **Remove the role dropdown from `/profile-setup` entirely.** It only ever collects fields for the role fixed at signup. |
| Signup page has no "Sign up with Google" option, so the only way to get VOLUNTEER/ORGANIZER via Google was the buggy profile-setup switch. | Add "Continue with Google" to `/signup`, carrying the selected role through `api.googleLogin({ idToken, role })` (the backend endpoint already accepts `role` and already enforces the ORGANIZER-approval gate on creation — it's only the profile-setup escape hatch that bypasses it). |

**Admin is never self-service.** No signup path, no Google path, no profile-setup path can
produce an `ADMIN`. The only ways an account becomes `ADMIN`:
- Seeded directly (`backend/src/seed.ts`, already correct).
- Promoted by an existing `ADMIN` via `PATCH /auth/users/:id/role` (Users tab). Keep as the
  single, audited path — it already requires an authenticated ADMIN caller.

---

## 5. Per-role fixed feature set

Everything below is what should **reliably work**, nothing more. Anything not listed here
that exists in the current dashboard is flagged for removal or repair in §6.

### ADMIN — full control room
- All events (not just own), full CRUD + start/end/cancel.
- All cameras across all events; add/edit/delete/test/analyze.
- Organizer approval queue (approve/reject).
- User management: list all, change role, delete.
- Global alerts: view + resolve any event's alerts.
- Volunteer roster (read) + dispatch to any SOS/incident.
- Notifications bell.
- Own profile.

### ORGANIZER — owns their events
- Create/edit/cancel **their own** events only (`createdBy` scoping — already enforced
  server-side in `events.service.ts`, keep).
- Cameras for their own events; add/edit/delete/test/analyze.
- Dispatch volunteers to SOS/incidents (global roster — org-scoping of volunteers is a
  later feature, not now).
- View + resolve alerts for their own events.
- Notifications bell.
- Own profile.
- **No** access to Users tab, organizer approvals, or other organizers' events.

### VOLUNTEER — field responder
- Toggle own duty status (`AVAILABLE` / `INACTIVE`).
- Update own live location.
- View assigned SOS/incidents; mark resolved.
- View camera monitoring (read-only — no add/edit/delete).
- Raise SOS for themselves if needed (same as PUBLIC capability).
- Notifications bell.
- Own profile.
- **No** dispatch authority (can't assign *other* volunteers), no event/camera management.

### PUBLIC — attendee
- Raise SOS with one tap (GPS auto-attached).
- File an incident report (category + description + optional evidence).
- See a simplified "how busy is it" view — no raw camera feeds, no admin data.
- Notifications bell.
- Own profile.
- **No** access to `cameras`, `events`, `users`, `volunteers`, `analytics`, `settings` tabs.

---

## 6. Cut list — status

1. **✅ Fixed — profile-setup role-escalation bug.** `completeProfile` (backend) now
   ignores any client-supplied role and always uses the user's existing DB role;
   the endpoint signature no longer accepts `role` at all. `/profile-setup`'s role
   dropdown is removed — role is derived from the fetched user, never mutable there.
2. **✅ Fixed — Google role selection.** `/signup` now has "Continue with Google",
   carrying the role selected in the dropdown through `api.googleLogin({ idToken, role })`
   (the backend already enforced the ORGANIZER-approval gate on creation — this just gives
   it a legitimate front door). `/login`'s Google button stays PUBLIC-only by design.
3. **✅ Fixed — role-gating centralized.** `NAV_BY_ROLE` / `getNavForRole` / `canAccessTab`
   now live in `frontend/app/dashboard/utils.ts` as the single source of truth. The sidebar
   uses it directly; the three tabs that had no other JSX-level guard (`analytics`,
   `volunteers`, `alerts`) now also check `canAccessTab` before rendering.
4. **✅ Fixed (corrected from the original plan) — the `alerts` tab was *not* a duplicate.**
   Re-checked: it's the only place in the UI where `Alert` records (from crowd/camera
   overcrowding, danger, blocked-exit) can be viewed and resolved — `overview`/`emergency`
   only show SOS and incident-report queues, a different data type. It's now wired into
   `NAV_BY_ROLE` for `ADMIN` and `ORGANIZER` (matching who the backend already allows to
   call `PATCH /crowd/alerts/:id/resolve`) instead of being deleted.
5. **Not done — duplicated dispatch form** (`volunteers` tab and `emergency` tab) and
   **duplicated report-anomaly form** (`overview` and `public-report` tab). This is a
   code-quality/dashboard-structure concern rather than an auth/role-correctness one —
   deferred, not part of this pass.

---

## 7. What's explicitly deferred (not "fixed scope" yet)

Per `BLUEPRINT.md`'s roadmap — organizer-scoped volunteer rosters, zone-level permissions,
a public PWA, and the operator copilot are all Phase 1+ and out of scope for "make auth and
roles work correctly right now."
