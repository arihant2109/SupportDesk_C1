# UI Flow

Screen routes, user journeys, and role-specific behavior for the SupportDesk frontend.

## Route Map

| Route | Page | Auth | Role | Component |
|-------|------|------|------|-----------|
| `/` | Redirect | — | — | → `/login` |
| `/login` | Sign in | Public | — | `frontend/app/login/page.tsx` |
| `/tickets` | Ticket list | Required | all | `frontend/app/tickets/page.tsx` |
| `/tickets/new` | Create ticket (modal) | Required | admin, agent | `frontend/app/tickets/new/page.tsx` |
| `/tickets/[id]` | Ticket detail | Required | all | `frontend/app/tickets/[id]/page.tsx` |
| `/admin/users` | User management | Required | admin | `frontend/app/admin/users/page.tsx` |

Layouts: `frontend/app/tickets/layout.tsx` and `frontend/app/admin/layout.tsx` wrap children with `AuthGuard` and `TopNav`.

## Global Shell

**TopNav** (`frontend/components/TopNav.tsx`)

- Brand link → `/tickets`
- Admin link → `/admin/users` (admin only)
- User name + role badge
- Logout → clears token, redirects to `/login`

**AuthProvider** restores session on mount; **AuthGuard** shows loading spinner until session resolves, then redirects unauthenticated users to `/login?redirect=<current-path>`.

---

## Flow 1 — Login

```
User opens /login
    → Enter email + password
    → POST /api/auth/login
    → Token stored in localStorage
    → Redirect to ?redirect param or /tickets
```

- Already authenticated users are redirected to `/tickets`.
- Invalid credentials show inline error below the form.
- `safeRedirect` blocks external URLs in the redirect parameter.

---

## Flow 2 — Ticket List (`/tickets`)

```
Authenticated user lands on /tickets
    → GET /api/tickets (paginated, sorted)
    → Table shows title, status, priority, assignee, dates
```

**Toolbar**

- Search input (debounced 300ms) → `search` query param
- Status filter dropdown → `status` query param
- Sortable column headers → `sort` + `order` query params
- Pagination controls → `page` query param (20 per page)

**Actions**

- **New Ticket** button (admin/agent only) → navigates to `/tickets/new` (modal overlay)
- Row click → `/tickets/[id]`

**States**

- Loading spinner while fetching
- `EmptyState` when no tickets match filters
- `ErrorState` with retry on API failure
- Access-denied banner if redirected from `/admin/users?denied=admin`

**Viewer:** list is read-only; no "New Ticket" button.

---

## Flow 3 — Create Ticket (`/tickets/new`)

```
Agent/admin clicks New Ticket
    → Modal opens over ticket list
    → Fill title, description, priority, optional assignee
    → POST /api/tickets
    → Redirect to /tickets/[newId] or back to list
```

- Assignee dropdown populated from `GET /api/users` (active users).
- Validation errors shown inline from API `details`.
- Cancel closes modal and returns to list.

---

## Flow 4 — Ticket Detail (`/tickets/[id]`)

```
User opens ticket by ID
    → GET /api/tickets/:id
    → Two-column layout renders
```

**Left column**

- Title and description (view mode)
- Comments thread (chronological)
- Add comment form (admin/agent only)

**Right column (sidebar)**

- Status badge
- Priority badge
- Assignee
- Created by / dates
- **Transition panel** — buttons for each valid next status from `GET /api/tickets/transitions`

**Edit mode (admin/agent)**

- Toggle edit → inline fields for title, description, priority, assignee
- Save → `PATCH /api/tickets/:id`
- Cancel → discards local changes

**Status transition**

- Click transition button → `PATCH /api/tickets/:id/status`
- Success → UI updates status and refreshes available transitions
- Invalid transition (should not happen if UI is correct) → toast with error message

**Viewer:** no edit toggle, no comment form, no transition buttons.

---

## Flow 5 — Admin User Management (`/admin/users`)

```
Admin opens /admin/users
    → GET /api/users (full list incl. inactive)
    → Table: name, email, role, status, actions
```

**Actions**

- **Add user** → modal with name, email, password, role → `POST /api/users`
- **Edit** → modal pre-filled → `PATCH /api/users/:id` (can reactivate via `isActive: true`)
- **Deactivate** → confirmation modal → `DELETE /api/users/:id`

**Guards**

- Non-admin users hitting `/admin/*` are redirected to `/tickets?denied=admin`
- Admin cannot deactivate themselves (API rejects; UI should disable)

---

## Flow 6 — Session Expiry / 401

```
Any API call returns 401 (except login)
    → Token cleared from localStorage
    → Redirect to /login?redirect=<current path + query>
    → After login, user returns to interrupted page
```

---

## Role Behavior Summary

| UI Element | admin | agent | viewer |
|------------|-------|-------|--------|
| View ticket list/detail | ✓ | ✓ | ✓ |
| Search, filter, sort, paginate | ✓ | ✓ | ✓ |
| Create ticket | ✓ | ✓ | Hidden |
| Edit ticket fields | ✓ | ✓ | Hidden |
| Status transitions | ✓ | ✓ | Hidden |
| Add comments | ✓ | ✓ | Hidden |
| Admin users page | ✓ | Redirect | Redirect |
| TopNav admin link | ✓ | Hidden | Hidden |

---

## Component Map

| Component | Used on |
|-----------|---------|
| `TicketTable` | `/tickets` |
| `StatusBadge`, `PriorityBadge` | List, detail |
| `TransitionPanel` | `/tickets/[id]` |
| `CommentsSection` | `/tickets/[id]` |
| `Toast` | Detail (transitions), admin (success) |
| `EmptyState`, `ErrorState` | List, admin |
| `FormField`, `Button`, `Icon` | Forms across app |

---

## Design Reference

Visual styling follows `support-ticket-system-design (1).html`: indigo primary (`#4F46E5`), modal overlays, badge colors per status/priority, two-column detail layout.
