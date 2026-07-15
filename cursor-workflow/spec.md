# Feature Specification

## Authentication

| Method | Path | Auth | Description | Implementation |
|--------|------|------|-------------|----------------|
| POST | `/api/auth/login` | — | Email + password login, returns JWT | `backend/src/routes/auth.ts` |
| GET | `/api/auth/me` | Bearer | Current user from JWT | `backend/src/routes/auth.ts` |

All ticket and user routes require a valid `Authorization: Bearer <token>` header unless noted.

## Role Permissions

| Action | admin | agent | viewer |
|--------|-------|-------|--------|
| Login | yes | yes | yes |
| View tickets / detail | yes | yes | yes |
| Create / edit tickets | yes | yes | no |
| Status transitions | yes | yes | no |
| Add comments | yes | yes | no |
| List users (assignee dropdown) | yes | yes | yes |
| Admin user management | yes | no | no |
| Create / edit / deactivate users | yes | no | no |

## API Endpoints

| Method | Path | Auth | Role | Description | Implementation |
|--------|------|------|------|-------------|----------------|
| GET | `/api/health` | — | — | Health check | `backend/src/app.ts` |
| GET | `/api/users` | required | all | List users (admin sees full list) | `backend/src/routes/users.ts` |
| POST | `/api/users` | required | admin | Create user | `backend/src/routes/users.ts` |
| PATCH | `/api/users/:id` | required | admin | Update user | `backend/src/routes/users.ts` |
| DELETE | `/api/users/:id` | required | admin | Deactivate user | `backend/src/routes/users.ts` |
| POST | `/api/tickets` | required | admin, agent | Create ticket | `backend/src/routes/tickets.ts` |
| GET | `/api/tickets` | required | all | List/search/filter tickets | `backend/src/routes/tickets.ts` |
| GET | `/api/tickets/:id` | required | all | Ticket detail + comments | `backend/src/routes/tickets.ts` |
| PATCH | `/api/tickets/:id` | required | admin, agent | Update fields | `backend/src/routes/tickets.ts` |
| PATCH | `/api/tickets/:id/status` | required | admin, agent | Status transition | `backend/src/routes/tickets.ts` |
| GET | `/api/tickets/transitions` | required | all | Valid next statuses for a given status | `backend/src/routes/tickets.ts` |
| POST | `/api/tickets/:id/comments` | required | admin, agent | Add comment | `backend/src/routes/tickets.ts` |
| GET | `/api/docs` | — | — | Swagger UI (stretch) | `backend/src/app.ts` |

`createdById` and `changedById` are derived from the JWT — not accepted in request bodies.

## Query Parameters (GET /api/tickets)
- `search` — case-insensitive match on title/description
- `status` — exact status filter
- `priority` — exact priority filter
- `assignedToId` — exact assignee filter
- `page`, `limit` (default 20, max 100), `sort`, `order` — pagination/sorting

## Validation Rules
- Title: required, 3–255 characters
- Description: required, 1–10000 characters
- Comment message: 1–5000 characters
- User password: minimum 8 characters
- Route `:id` params: valid UUID
- Search query: max 200 characters
- Priority: enum (low, medium, high, critical)
- Status transitions: enforced by `backend/src/services/stateMachine.ts` and `GET /api/tickets/transitions`
- Login: valid email + password; inactive users cannot log in

## Frontend Pages
| Route | Screen | Component |
|-------|--------|-----------|
| `/login` | Login | `frontend/app/login/page.tsx` |
| `/tickets` | Ticket list | `frontend/app/tickets/page.tsx` |
| `/tickets/new` | Create modal | `frontend/app/tickets/new/page.tsx` |
| `/tickets/[id]` | Ticket detail | `frontend/app/tickets/[id]/page.tsx` |
| `/admin/users` | User management (admin) | `frontend/app/admin/users/page.tsx` |

## UI Design Reference
All UI follows `support-ticket-system-design (1).html` — SupportDesk branding, indigo primary (#4F46E5), status/priority badge colors, modal create flow, two-column detail layout, transition panel, toast for rejected transitions.
