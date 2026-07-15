# Support Ticket Management System — Project Context

## Overview
Internal support ticket application for creating, updating, commenting on, searching, and progressing tickets through a defined lifecycle.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Zod validation
- **Database:** PostgreSQL 15 via Prisma ORM
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Testing:** Jest + Supertest integration tests
- **DevOps:** Docker Compose (PostgreSQL), GitHub Actions CI

## Repository Structure
```
backend/     Express API, Prisma schema, Jest tests
frontend/    Next.js UI matching support-ticket-system-design.html
cursor-workflow/  Spec-driven development documents
```

## Core Entities
- **User** — seeded only (id, name, email, role)
- **Ticket** — id, title, description, priority, status, assignedTo, createdBy, createdAt, updatedAt
- **Comment** — id, ticketId, message, createdBy, createdAt

## State Machine (enforced server-side)
```
open         → in_progress, cancelled
in_progress  → resolved, cancelled
resolved     → closed
closed       → (terminal)
cancelled    → (terminal)
```

## Conventions
- API base path: `/api`
- Error format: `{ error, message?, details? }`
- Status codes: 201 create, 200 success, 404 not found, 422 validation/invalid transition
- No secrets in repo — use `.env` files (gitignored)

## Local Development
```bash
docker compose up -d
cd backend && npm install && npx prisma migrate deploy && npm run seed
cd frontend && npm install
npm run dev   # from root — starts backend :3001 and frontend :3000
```
