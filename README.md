# Support Ticket Management System

Full-stack support ticket application with JWT authentication, role-based access control, enforced status state machine, PostgreSQL persistence, and Next.js UI matching the SupportDesk design mockup.

## Stack
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Jest, JWT, Helmet, rate limiting
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Vitest
- **Infra:** Local PostgreSQL (default) or Docker Compose (optional), GitHub Actions CI

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ running locally on port **5432** (or Docker — see below)

### Setup
```bash
npm install
npm install --prefix backend
npm install --prefix frontend

cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test

# Edit backend/.env — set DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SEED_DEFAULT_PASSWORD

cd backend
npx prisma migrate deploy
npm run seed

cd ..
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger docs: http://localhost:3001/api/docs
- Health check: http://localhost:3001/api/health

### Production backend
```bash
cd backend
npm run build
npm start
```
`npm start` runs compiled output from `dist/` (not `ts-node`).

### Login
Open http://localhost:3000/login. Seed users share the password in `SEED_DEFAULT_PASSWORD`.

| Email | Role |
|-------|------|
| admin@supportdesk.local | admin |
| priya.sharma@supportdesk.local | agent |
| viewer@supportdesk.local | viewer |

**Roles:** Admins manage users at `/admin/users`. Agents create/edit tickets. Viewers have read-only access.

### Security defaults
- CORS restricted to `CORS_ORIGIN` (default `http://localhost:3000`)
- Login rate limit: 10 attempts per 15 minutes per IP
- Helmet security headers on API; Next.js sets frame/options/referrer headers
- Request body limit: 100kb

### Tests
```bash
cd backend && npm test
cd ../frontend && npm test
```

## Project Structure
```
backend/           Express API + Prisma + Jest tests
frontend/          Next.js App Router UI + Vitest unit tests
cursor-workflow/   Spec-driven development documents
```

## Cursor Workflow Submission
See `cursor-workflow/` for project-context, spec, tasks, acceptance-criteria, and cursor-rules.
