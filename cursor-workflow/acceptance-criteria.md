# Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User can log in with email and password | Pass | `POST /api/auth/login` + `/login` page |
| 2 | Protected routes require JWT; invalid/missing token returns 401 | Pass | `authenticate` middleware + auth tests |
| 3 | Role-based access enforced (viewer read-only, admin user CRUD) | Pass | `requireRole` middleware + authorization tests |
| 4 | User can create a ticket via the UI (admin/agent) | Pass | `POST /api/tickets` + `/tickets/new` modal |
| 5 | User can view tickets with pagination and sorting | Pass | `GET /api/tickets` + paginated table UI |
| 6 | User can open a ticket detail view | Pass | `GET /api/tickets/:id` + `/tickets/[id]` |
| 7 | User can update ticket fields and reassign | Pass | `PATCH /api/tickets/:id` + edit mode |
| 8 | User can add comments | Pass | `POST /api/tickets/:id/comments` + CommentsSection |
| 9 | Status changes only through valid transitions | Pass | State machine + transitions API + TransitionPanel |
| 10 | Keyword search and status filter work | Pass | Search tests + toolbar UI |
| 11 | Admin can manage and reactivate users | Pass | User CRUD routes + admin UI |
| 12 | API hardened (CORS, helmet, rate limit, body limit) | Pass | `backend/src/app.ts` |
| 13 | Backend validation prevents invalid records | Pass | Zod schemas + validation tests |
| 14 | Frontend unit tests pass | Pass | `cd frontend && npm test` |
| 15 | Backend integration tests pass | Pass | `cd backend && npm test` |

## Test Commands
```bash
cd backend && npm test
cd frontend && npm test
```

## Manual UI Verification
1. Start: `npm run dev`
2. Sign in as agent — create, search, paginate, sort, edit, transition, comment
3. Sign in as viewer — confirm read-only UI
4. Sign in as admin — manage users, deactivate/reactivate
5. Verify invalid transition shows toast; login redirect preserves path after 401
