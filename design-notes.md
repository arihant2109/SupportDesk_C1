# Design Notes

Architecture, conventions, and UI decisions for the Support Ticket Management System.

## System Architecture

```
┌─────────────────┐     HTTPS/JSON      ┌─────────────────┐
│  Next.js 14     │ ◄─────────────────► │  Express API    │
│  (port 3000)    │   Bearer JWT        │  (port 3001)    │
└────────┬────────┘                     └────────┬────────┘
         │                                         │
         │ localStorage token                      │ Prisma ORM
         │                                         ▼
         │                                ┌─────────────────┐
         │                                │  PostgreSQL     │
         └────────────────────────────────┤  (port 5432)    │
                                          └─────────────────┘
```

- **Frontend** is a client-rendered Next.js App Router app. Protected pages wrap content in `AuthGuard`; session state lives in `AuthProvider`.
- **Backend** is a stateless REST API. Identity is carried in JWT; no server-side sessions.
- **Database** is the single source of truth. All status transitions and validation rules are enforced server-side.

## Backend Layering

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| Routes | HTTP mapping, auth guards, validation binding | `backend/src/routes/*.ts` |
| Schemas | Zod input/output contracts | `backend/src/schemas/*.ts` |
| Services | Business logic, Prisma access | `ticketService`, `userService`, `authService`, `stateMachine` |
| Middleware | Cross-cutting concerns | `authenticate`, `requireRole`, `validate`, `errorHandler` |
| Errors | Typed HTTP errors | `AppError`, `NotFoundError`, `ValidationError`, `InvalidTransitionError` |

Routes stay thin: validate input, call service, return JSON. Services own transactions and domain rules.

## Authentication Design

- **Login:** `POST /api/auth/login` returns `{ token, user }`. Password verified with bcrypt; inactive users (`isActive: false`) cannot log in.
- **Token storage:** Frontend stores JWT in `localStorage` under `supportdesk-token`.
- **Protected requests:** `Authorization: Bearer <token>` on all `/api/users` and `/api/tickets` routes.
- **Session restore:** On load, `AuthProvider` calls `GET /api/auth/me` if a token exists; invalid tokens are cleared.
- **401 handling:** API client clears token and redirects to `/login?redirect=<path>` (validated via `safeRedirect`).

## Authorization Model

Three roles with additive permissions:

| Role | Tickets | Users |
|------|---------|-------|
| `viewer` | Read-only | Active users list (assignee dropdown) |
| `agent` | Create, edit, transition, comment | Active users list |
| `admin` | Same as agent | Full CRUD, deactivate/reactivate |

`requireRole` middleware enforces role checks per route. Frontend mirrors this with `canWrite`, `isAdmin`, and `isViewer` from `AuthProvider` to hide/disable controls — UI gating is UX only; the API is authoritative.

## State Machine (Core Judgment Piece)

Defined in `backend/src/services/stateMachine.ts`:

```
open         → in_progress, cancelled
in_progress  → resolved, cancelled
resolved     → closed
closed       → (terminal)
cancelled    → (terminal)
```

- Same-status transitions are rejected (`canTransition` returns false when `from === to`).
- Invalid transitions raise `InvalidTransitionError` (422) with `details: [from, to]`.
- Frontend fetches allowed next statuses from `GET /api/tickets/transitions?status=...` and shows a toast on rejection.

## API Error Contract

All errors return JSON:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": ["optional", "field-level", "info"]
}
```

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 422 | Zod or business validation failure |
| `INVALID_TRANSITION` | 422 | Status change violates state machine |
| `NOT_FOUND` | 404 | Missing ticket or user |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Valid JWT but insufficient role |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled exception |

## Security Defaults

- **Helmet** on API responses
- **CORS** limited to `CORS_ORIGIN` (default `http://localhost:3000`)
- **Rate limit** on login: 10 attempts per 15 minutes per IP
- **Body limit:** 100kb JSON
- **No secrets in repo** — `JWT_SECRET`, `DATABASE_URL`, `SEED_DEFAULT_PASSWORD` in `.env`
- **Safe redirects** — post-login redirect whitelists internal paths only (`frontend/lib/utils.ts`)

## Frontend UI Design

Visual design follows `support-ticket-system-design (1).html`:

| Token | Value |
|-------|-------|
| Primary | Indigo `#4F46E5` |
| Brand | SupportDesk |
| Status badges | Color-coded per status (`StatusBadge`) |
| Priority badges | Color-coded per priority (`PriorityBadge`) |

### Layout Patterns

- **Login** — centered modal-style form on full-height overlay
- **Ticket list** — toolbar (search, status filter, sort), paginated table, empty/error states
- **Create ticket** — modal overlay (`/tickets/new`)
- **Ticket detail** — two-column layout: main content (title, description, comments) + sidebar (status, priority, assignee, transition panel)
- **Admin users** — table with create/edit modal, deactivate confirmation, reactivate via PATCH

### UX Conventions

- Debounced search (300ms) on ticket list
- `AbortController` cancels in-flight list requests on filter change
- Toast notifications for success and transition errors
- Viewer role: edit/transition/comment controls hidden; access-denied banner on admin routes
- Loading and error states via `EmptyState`, `ErrorState`, inline spinners

## Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key (required in production) |
| `JWT_EXPIRES_IN` | Token TTL (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `SEED_DEFAULT_PASSWORD` | Password for seed users |
| `NEXT_PUBLIC_API_URL` | Frontend API base (default `http://localhost:3001/api`) |

## Key Design Decisions

1. **`createdById` from JWT, not body** — prevents impersonation on create/comment/transition audit fields.
2. **Deactivate vs delete** — users are soft-deactivated (`isActive: false`); tickets retain historical references.
3. **Admin self-deactivate blocked** — prevents locking out the last admin accidentally.
4. **Pagination default 20** — balances list performance with usable page size; max 100.
5. **Comments ordered ascending** — chronological thread in detail view.
6. **Prisma indexes** on filter/sort columns (`status`, `priority`, `createdAt`, FKs) for list performance.

## Related Files

- Spec summary: `cursor-workflow/spec.md`
- API details: `cursor-workflow/api-contract.md`
- UI flows: `cursor-workflow/ui-flow.md`
