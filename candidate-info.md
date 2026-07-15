# Candidate Information

**Name:** Arihant Kulshrestha  
**Role:** Software Engineer  
**Primary Technology Stack:** JS Full Stack  
**Primary AI Tool Used:** Cursor  
**Project Option Selected:** Ticket Management System  

## Project Summary

Full-stack **SupportDesk** application for internal support ticket management. Users authenticate with JWT, then create, search, filter, update, and comment on tickets. Status changes follow a server-enforced state machine (`open` → `in_progress` → `resolved` → `closed`, with `cancelled` branches). Three roles control access: **admin** (user management + tickets), **agent** (ticket read/write), **viewer** (read-only). Data persists in PostgreSQL via Prisma. The Next.js UI matches the SupportDesk design mockup with pagination, sorting, modals, toasts, and role-aware controls.

## Tools Used

| Category | Tools |
|----------|-------|
| **Backend** | Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, JWT, bcrypt, Helmet, express-rate-limit |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Testing** | Jest, Supertest (backend integration), Vitest (frontend unit) |
| **DevOps** | Docker Compose (optional Postgres), GitHub Actions CI |
| **AI / Workflow** | Cursor, spec-driven docs (`cursor-workflow/`, `implementation-plan.md`, `api-contract.md`, etc.) |
| **API Docs** | OpenAPI + Swagger UI at `/api/docs` |

## Setup Summary

**Prerequisites:** Node.js 20+, PostgreSQL 14+ on port 5432 (or `docker compose up -d`).

```bash
npm install && npm install --prefix backend && npm install --prefix frontend
cd backend && npx prisma migrate deploy && npm run seed && cd ..
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |



**Tests:** `cd backend && npm test` · `cd frontend && npm test`
