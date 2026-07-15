# Test Strategy

Testing approach for the Support Ticket Management System across backend integration, backend unit, and frontend unit tiers.

## Test Pyramid

```
        ┌─────────────┐
        │  Frontend   │  Vitest — utility/helpers (small)
        │  unit       │
        ├─────────────┤
        │  Backend    │  Jest — state machine pure logic
        │  unit       │
        ├─────────────┤
        │  Backend    │  Jest + Supertest — API integration (primary)
        │  integration│
        └─────────────┘
```

Integration tests are the primary proof of correctness — especially state machine rules, auth, and role enforcement.

## Commands

```bash
# Backend (Jest + Supertest, test DB)
cd backend && npm test

# Frontend (Vitest)
cd frontend && npm test

# Type-check / build
cd backend && npm run build
cd frontend && npm run build
```

## Backend Test Setup

| File | Purpose |
|------|---------|
| `backend/tests/globalSetup.ts` | Prepare test database |
| `backend/tests/globalTeardown.ts` | Cleanup after suite |
| `backend/tests/setup.ts` | Per-test Prisma reset / app bootstrap |
| `backend/tests/helpers.ts` | `createTestUser`, `loginAs`, `createTestTicket`, `authHeader` |

Tests run against a dedicated test database configured in `backend/.env.test`. Password for test users comes from `SEED_DEFAULT_PASSWORD` (default `ChangeMe123!`).

## Backend Test Suites

### `auth.test.ts` — Authentication

| Test | Asserts |
|------|---------|
| Login with valid credentials | Returns token + user |
| Reject invalid password | 401 |
| Reject protected route without token | 401 |
| `GET /auth/me` | Returns current user |

### `authorization.test.ts` — Role Enforcement

| Test | Asserts |
|------|---------|
| Viewer cannot create tickets | 403 |
| Viewer cannot change status | 403 |
| Viewer cannot update fields | 403 |
| Viewer can list tickets | 200 |

### `tickets.test.ts` — Ticket API

| Test | Asserts |
|------|---------|
| Create with valid body | 201 |
| Reject missing title | 422 |
| Reject invalid priority | 422 |
| Reject unauthenticated create | 401 |
| List tickets | 200 with array |
| Detail with comments | 200, nested relations |
| Missing ticket | 404 |
| Update fields | 200 |
| Add comment | 201 |
| Invalid UUID param | 422 |
| Transitions endpoint | Returns valid next statuses |

### `stateMachine.test.ts` — Integration (Mandatory Tier)

Proves state machine rules through the HTTP API:

| Scenario | Expected |
|----------|----------|
| Valid transitions along happy path | 200 |
| Invalid transitions (skip states, backwards) | 422 `INVALID_TRANSITION` |
| Transition to current status | 422 |
| Invalid status casing | 422 |
| Missing ticket | 404 |

### `stateMachine.unit.test.ts` — Unit

| Test | Asserts |
|------|---------|
| `VALID_TRANSITIONS` map | Matches spec |
| `canTransition(from, to)` | True/false per rule |

### `search.test.ts` — Search & Filter

| Test | Asserts |
|------|---------|
| Keyword search | Matching tickets returned |
| Status filter | Only matching status |
| Combined search + status | Intersection |
| No matches | Empty result |
| Invalid status query | 422 |

### `users.admin.test.ts` — Admin User CRUD

| Test | Asserts |
|------|---------|
| Admin creates user | 201 |
| Agent cannot create | 403 |
| Admin cannot deactivate self | 422/403 |
| Admin deactivates another user | 200, `isActive: false` |
| Admin patches user | 200 |
| Duplicate email on create | 422 |
| Agent cannot patch users | 403 |

### `validation.test.ts` — Input Limits

| Test | Asserts |
|------|---------|
| Title > 255 chars | 422 |
| Password < 8 chars on user create | 422 |

## Frontend Test Suite

### `frontend/tests/utils.test.ts` (Vitest)

| Function | Cases |
|----------|-------|
| `safeRedirect` | Allows `/tickets` paths; blocks `https://`, `//`, null |
| `formatDate` | Fallback for invalid; formats valid ISO |

Config: `frontend/vitest.config.ts` with `@/` path alias.

## What Is Not Automated (Manual Verification)

Per `acceptance-criteria.md`:

1. Start app: `npm run dev`
2. Agent flow — create, search, paginate, sort, edit, transition, comment
3. Viewer flow — confirm read-only UI (no create/edit/transition/comment)
4. Admin flow — user CRUD, deactivate, reactivate
5. Invalid transition toast on detail page
6. Login redirect preserves path after 401

## CI Pipeline

`.github/workflows/ci.yml` runs on push/PR:

1. Install backend + frontend dependencies
2. Backend: migrate test DB, run `npm test`, `npm run build`
3. Frontend: run `npm test`, `npm run build`

CI uses PostgreSQL service container and test env files.

## Coverage Priorities

| Priority | Area | Rationale |
|----------|------|-----------|
| P0 | State machine transitions | Core judgment requirement |
| P0 | Auth + role guards | Security boundary |
| P1 | Validation rejection | Data integrity |
| P1 | Search/filter/pagination | Core UX |
| P2 | Admin user lifecycle | Stretch feature |
| P3 | Frontend utils | Regression guard for redirect safety |

## Adding New Tests

**New API endpoint**

1. Add Zod schema test case in `validation.test.ts` if new limits
2. Add happy path + auth failure in relevant `*.test.ts`
3. Add role matrix cases if permissions differ by role

**New status transition rule**

1. Update `stateMachine.unit.test.ts`
2. Add integration cases in `stateMachine.test.ts`

**New frontend utility**

1. Add Vitest cases in `frontend/tests/`

## Traceability

| Acceptance criterion | Test evidence |
|---------------------|---------------|
| Login works | `auth.test.ts` |
| JWT required | `auth.test.ts`, `authorization.test.ts` |
| Role-based access | `authorization.test.ts`, `users.admin.test.ts` |
| Create/view/update tickets | `tickets.test.ts` |
| Valid transitions only | `stateMachine.test.ts`, `stateMachine.unit.test.ts` |
| Search and filter | `search.test.ts` |
| Backend validation | `validation.test.ts`, `tickets.test.ts` |
| Frontend unit tests | `frontend/tests/utils.test.ts` |

Full checklist: `cursor-workflow/acceptance-criteria.md`.
