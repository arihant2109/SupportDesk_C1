# Implementation Plan

Support Ticket Management System — phased delivery plan aligned with the current repository.

## Goals

- Deliver core ticket lifecycle (create, list, detail, edit, comment, status transitions)
- Enforce the status state machine on the server
- Add authentication, role-based authorization, and admin user management
- Match the SupportDesk UI mockup with meaningful error handling
- Prove correctness with integration and unit tests; run CI on every push

## Phase 1 — Scaffold & Infrastructure

| Item | Status | Location |
|------|--------|----------|
| Monorepo scripts (`dev`, install) | Done | Root `package.json` |
| Express + TypeScript backend | Done | `backend/` |
| Next.js 14 App Router frontend | Done | `frontend/` |
| Prisma + PostgreSQL | Done | `backend/prisma/` |
| Environment templates | Done | `backend/.env.example`, `.env.test.example` |
| Docker Compose (optional Postgres) | Done | `docker-compose.yml` |

## Phase 2 — Data Layer

| Item | Status | Location |
|------|--------|----------|
| Prisma schema (User, Ticket, Comment) | Done | `backend/prisma/schema.prisma` |
| Enums: Role, Priority, Status | Done | `backend/prisma/schema.prisma` |
| Initial migration | Done | `backend/prisma/migrations/20250630120000_init/` |
| Performance indexes | Done | `backend/prisma/migrations/20250715120000_add_performance_indexes/` |
| Seed users (admin, agents, viewer) | Done | `backend/prisma/seed.ts` |

## Phase 3 — Backend API Core

| Item | Status | Location |
|------|--------|----------|
| Zod request validation middleware | Done | `backend/src/middleware/validate.ts` |
| Centralized error handling | Done | `backend/src/middleware/errorHandler.ts`, `backend/src/errors/AppError.ts` |
| Ticket CRUD + list/search/filter | Done | `backend/src/routes/tickets.ts`, `backend/src/services/ticketService.ts` |
| Comments (transactional create) | Done | `ticketService.addComment` |
| User list for assignee dropdown | Done | `backend/src/routes/users.ts` |
| State machine service | Done | `backend/src/services/stateMachine.ts` |
| Status transition endpoint | Done | `PATCH /api/tickets/:id/status` |
| Transitions discovery endpoint | Done | `GET /api/tickets/transitions` |
| UUID param validation | Done | `backend/src/utils/params.ts`, `backend/src/schemas/commonSchemas.ts` |

## Phase 4 — Authentication & Authorization

| Item | Status | Location |
|------|--------|----------|
| JWT login (`POST /api/auth/login`) | Done | `backend/src/routes/auth.ts`, `backend/src/services/authService.ts` |
| Session introspection (`GET /api/auth/me`) | Done | `backend/src/routes/auth.ts` |
| `authenticate` middleware | Done | `backend/src/middleware/authenticate.ts` |
| `requireRole` middleware | Done | `backend/src/middleware/requireRole.ts` |
| `createdById` / comment author from JWT | Done | Ticket and comment routes |
| Admin user CRUD + deactivate/reactivate | Done | `backend/src/routes/users.ts`, `backend/src/services/userService.ts` |
| Login rate limiting | Done | `backend/src/middleware/loginRateLimit.ts` |

## Phase 5 — API Hardening

| Item | Status | Location |
|------|--------|----------|
| Helmet security headers | Done | `backend/src/app.ts` |
| CORS restricted to `CORS_ORIGIN` | Done | `backend/src/lib/config.ts` |
| JSON body size limit (100kb) | Done | `backend/src/app.ts` |
| Graceful shutdown | Done | `backend/src/index.ts` |
| Production start (`node dist/index.js`) | Done | `backend/package.json` |
| Structured error logging | Done | `backend/src/lib/logger.ts` |

## Phase 6 — Frontend

| Item | Status | Location |
|------|--------|----------|
| AuthProvider + JWT in localStorage | Done | `frontend/components/AuthProvider.tsx` |
| AuthGuard for protected routes | Done | `frontend/components/AuthGuard.tsx` |
| Login page with redirect preservation | Done | `frontend/app/login/page.tsx` |
| Ticket list (search, filter, pagination, sort) | Done | `frontend/app/tickets/page.tsx` |
| Create ticket modal | Done | `frontend/app/tickets/new/page.tsx` |
| Ticket detail (edit, comments, transitions) | Done | `frontend/app/tickets/[id]/page.tsx` |
| Admin user management | Done | `frontend/app/admin/users/page.tsx` |
| Viewer read-only UI (`canWrite` guard) | Done | `AuthProvider`, ticket/admin pages |
| Toast for rejected transitions | Done | `frontend/components/Toast.tsx`, `TransitionPanel.tsx` |
| API client with 401 redirect | Done | `frontend/lib/api.ts` |

## Phase 7 — Testing & CI

| Item | Status | Location |
|------|--------|----------|
| Backend integration tests (Jest + Supertest) | Done | `backend/tests/` |
| State machine unit tests | Done | `backend/tests/stateMachine.unit.test.ts` |
| Frontend unit tests (Vitest) | Done | `frontend/tests/utils.test.ts` |
| GitHub Actions CI | Done | `.github/workflows/ci.yml` |

## Phase 8 — Documentation & Stretch

| Item | Status | Location |
|------|--------|----------|
| OpenAPI spec + Swagger UI | Done | `backend/openapi.yaml`, `/api/docs` |
| cursor-workflow spec documents | Done | `cursor-workflow/` |
| README quick start | Done | `README.md` |

## Delivery Order Rationale

1. **Data model first** — tickets and comments need persistence before API or UI work.
2. **State machine in the service layer** — transitions are enforced once in `stateMachine.ts` and called from `ticketService.updateTicketStatus`; the frontend only displays allowed options from `GET /api/tickets/transitions`.
3. **Auth after core API** — ticket routes were built first; JWT and roles were layered on without changing the state machine contract.
4. **Frontend last per feature** — each API endpoint has a matching UI surface and test before moving on.

## Traceability

| Document | Purpose |
|----------|---------|
| `requirement-analysis.md` | Original business requirements |
| `spec.md` | Feature specification (endpoints, roles, validation) |
| `acceptance-criteria.md` | Pass/fail checklist with evidence |
| `api-contract.md` | Request/response contracts |
| `data-model.md` | Entity relationships and constraints |
| `ui-flow.md` | Screen flows and role behavior |
| `test-strategy.md` | Test tiers and commands |
| `tasks.md` | Phase task tracker |

## Out of Scope (current)

- Email notifications
- File attachments on tickets
- Multi-tenant organizations
- Real-time updates (WebSockets)
