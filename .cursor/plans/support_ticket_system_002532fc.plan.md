---
name: Support Ticket System
overview: Build a full-stack Support Ticket Management System with a Node.js/Express backend, PostgreSQL persistence via Prisma, Next.js 14 (App Router) TypeScript frontend, enforced status state machine, Jest + Supertest integration tests, and Cursor workflow documentation — structured across 8 phases.
todos:
  - id: phase1
    content: "Phase 1: Scaffold backend (Express/TS) and frontend (Vite/React/TS/Tailwind), configure tsconfig, root scripts, .gitignore"
    status: completed
  - id: phase2
    content: "Phase 2: Create DB schema (users, tickets, comments), connection module, seed script; verify idempotency"
    status: completed
  - id: phase3
    content: "Phase 3: Implement Tickets + Comments CRUD routes with Zod validation and consistent error responses"
    status: completed
  - id: phase4
    content: "Phase 4: Implement state machine service, PATCH /status route, write all mandatory integration tests (valid + invalid transitions)"
    status: completed
  - id: phase5
    content: "Phase 5: Add keyword search and status/priority filter query params to GET /tickets"
    status: completed
  - id: phase6
    content: "Phase 6: Build frontend pages (TicketList, CreateTicket, TicketDetail) with error states, status transition control, comments"
    status: completed
  - id: phase7
    content: "Phase 7: Write cursor-workflow/ submission documents (project-context, spec, tasks, acceptance-criteria, cursor-rules)"
    status: completed
  - id: phase8
    content: "Phase 8 (Stretch): Add auth, pagination/sorting, Swagger docs, Docker, CI workflow"
    status: completed
isProject: false
---

# Support Ticket Management System — Detailed Project Plan

## Tech Stack

- **Backend:** Node.js + Express + TypeScript (port 3001)
- **Database:** PostgreSQL 15+
- **ORM:** Prisma (schema-first, typed queries, migrations)
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS (port 3000)
- **HTTP Client (frontend):** `fetch` via typed API utility (no extra lib needed)
- **Validation:** Zod (backend request validation)
- **Testing:** Jest + Supertest (integration tests on the Express app)
- **API Docs (Stretch):** Swagger/OpenAPI via `swagger-ui-express`
- **Docker (Stretch):** Docker Compose for backend + PostgreSQL

---

## Repository Layout

```
C1_project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema & relations
│   │   ├── migrations/         # Prisma migration files
│   │   └── seed.ts             # Seed users
│   ├── src/
│   │   ├── lib/                # Prisma client singleton
│   │   ├── routes/             # Express routers (tickets, comments)
│   │   ├── services/           # Business logic (stateMachine.ts lives here)
│   │   ├── middleware/         # Zod validation, error handler
│   │   └── app.ts              # Express app factory
│   ├── tests/                  # Integration tests (Jest + Supertest)
│   ├── jest.config.ts          # Jest config (ts-jest preset, test DB env)
│   ├── .env                    # DATABASE_URL for dev (not committed)
│   ├── .env.test               # DATABASE_URL for test DB (not committed)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Redirect → /tickets
│   │   ├── tickets/
│   │   │   ├── page.tsx        # Ticket list
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create ticket
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Ticket detail
│   ├── components/             # Shared UI components
│   ├── lib/
│   │   └── api.ts              # Typed fetch wrappers
│   ├── types/                  # Shared TypeScript types
│   ├── package.json
│   └── next.config.ts
└── cursor-workflow/            # Cursor submission documents
    ├── project-context.md
    ├── spec.md
    ├── tasks.md
    ├── acceptance-criteria.md
    └── cursor-rules-or-instructions.md
```

---

## Phase 1 — Project Scaffolding & Foundation

**Goal:** Both workspaces boot, TypeScript compiles, dev servers run, PostgreSQL connection is verified.

### Steps
1. **Backend** — `npm init`, install: `express cors zod`, dev: `typescript ts-node-dev @types/express @types/cors @types/node`, test: `jest ts-jest supertest @types/supertest @types/jest`
2. **Prisma** — `npm install prisma @prisma/client`; run `npx prisma init` to generate `prisma/schema.prisma` and `.env` with `DATABASE_URL`
3. **Frontend** — `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir no --import-alias "@/*"` (Next.js 14 App Router)
4. Configure `tsconfig.json` for backend (target ES2020, module CommonJS)
5. Configure `jest.config.ts` in backend — preset `ts-jest`, testEnvironment `node`, separate test DB via `.env.test`
6. Add root-level `package.json` with `scripts.dev` (concurrently runs both), `scripts.test`
7. Create `.gitignore` — `node_modules`, `dist`, `.env`, `.env.test`, `.next`
8. Verify Postgres connection: `npx prisma migrate dev --name init` against a local dev DB

### Environment Variables
```
# backend/.env  (never committed)
DATABASE_URL="postgresql://user:pass@localhost:5432/tickets_dev"

# backend/.env.test  (never committed)
DATABASE_URL="postgresql://user:pass@localhost:5432/tickets_test"
```

### Deliverable
- `npm run dev` starts backend on `:3001` and frontend on `:3000`
- `GET http://localhost:3001/api/health` returns `{ ok: true }`
- Next.js home page loads at `http://localhost:3000`

---

## Phase 2 — Database Layer (Prisma + PostgreSQL)

**Goal:** Prisma schema defined, migrations run cleanly, seed data loads users. Prisma client is the only way data is accessed — no raw SQL in application code.

### Files
- `backend/prisma/schema.prisma` — single source of truth for all models
- `backend/prisma/seed.ts` — inserts 3–5 seed users via Prisma client
- `backend/src/lib/prisma.ts` — singleton Prisma client (reused across routes)

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  admin
  agent
  viewer
}

enum Priority {
  low
  medium
  high
  critical
}

enum Status {
  open
  in_progress
  resolved
  closed
  cancelled
}

model User {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  role            Role
  ticketsCreated  Ticket[]  @relation("CreatedBy")
  ticketsAssigned Ticket[]  @relation("AssignedTo")
  comments        Comment[]
}

model Ticket {
  id          String    @id @default(uuid())
  title       String
  description String
  priority    Priority
  status      Status    @default(open)
  assignedTo  User?     @relation("AssignedTo", fields: [assignedToId], references: [id])
  assignedToId String?
  createdBy   User      @relation("CreatedBy", fields: [createdById], references: [id])
  createdById String
  comments    Comment[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Comment {
  id          String   @id @default(uuid())
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  ticketId    String
  message     String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  createdAt   DateTime @default(now())
}
```

### Test Cases (Phase 2)
- `npx prisma migrate dev` runs without errors on a fresh PostgreSQL DB
- Re-running migration is idempotent (Prisma tracks applied migrations)
- `npm run seed` creates 3–5 users; re-running seed is idempotent (upsert by email)
- Prisma client singleton is reused — no multiple connection pool warnings
- Attempting to create a Ticket with an invalid enum value is rejected at the Prisma layer

---

## Phase 3 — Core Backend API (Tickets + Comments CRUD)

**Goal:** Full CRUD for tickets and comments, validation via Zod, consistent error format.

### Routes
```
POST   /api/tickets              create ticket
GET    /api/tickets              list all tickets
GET    /api/tickets/:id          get ticket detail (with comments)
PATCH  /api/tickets/:id          update fields (title, description, priority, assignee)
POST   /api/tickets/:id/comments add a comment
```

### Error Response Contract
```json
{ "error": "VALIDATION_ERROR", "details": ["title is required"] }
{ "error": "NOT_FOUND", "message": "Ticket not found" }
```

### Validation (Zod schemas)
- `createTicketSchema`: title (required, ≥3 chars), description (required), priority (enum), createdBy (required, must be valid user id)
- `updateTicketSchema`: all fields optional, same enum constraints
- `createCommentSchema`: message (required, ≥1 char), createdBy (required, valid user id)

### Test Cases (Phase 3)
- `POST /api/tickets` with valid body returns 201 + ticket object
- `POST /api/tickets` missing `title` returns 422 with error details
- `POST /api/tickets` with invalid `priority` returns 422
- `POST /api/tickets` with unknown `createdBy` userId returns 422
- `GET /api/tickets` returns array (empty on fresh DB)
- `GET /api/tickets/:id` returns ticket + nested comments array
- `GET /api/tickets/nonexistent` returns 404
- `PATCH /api/tickets/:id` updates only supplied fields; `updated_at` is refreshed
- `POST /api/tickets/:id/comments` returns 201 + comment; appears in subsequent GET

---

## Phase 4 — Status State Machine (Core Judgment Piece)

**Goal:** Status transitions enforced exclusively in the service layer; invalid transitions return 422 with a clear message.

### Allowed Transitions (enforced in `backend/src/services/stateMachine.ts`)

```
open         → in_progress
open         → cancelled
in_progress  → resolved
in_progress  → cancelled
resolved     → closed
```

All other transitions are invalid and must be rejected.

### Route
```
PATCH /api/tickets/:id/status   body: { status: string, changedBy: userId }
```

### Implementation Strategy
- `stateMachine.ts` exports `VALID_TRANSITIONS` map and `canTransition(from, to): boolean`
- `ticketService.ts` calls `canTransition` before any DB write; throws `InvalidTransitionError` if false
- The error middleware converts `InvalidTransitionError` to HTTP 422

### Integration Test Cases (MANDATORY — state machine rules)

**Valid transitions — must succeed (HTTP 200):**
| From | To | Expected |
|---|---|---|
| open | in_progress | 200, ticket.status = "in_progress" |
| open | cancelled | 200, ticket.status = "cancelled" |
| in_progress | resolved | 200, ticket.status = "resolved" |
| in_progress | cancelled | 200, ticket.status = "cancelled" |
| resolved | closed | 200, ticket.status = "closed" |

**Invalid transitions — must be rejected (HTTP 422):**
| From | To | Expected |
|---|---|---|
| open | resolved | 422, error = "INVALID_TRANSITION" |
| open | closed | 422, error = "INVALID_TRANSITION" |
| in_progress | open | 422, error = "INVALID_TRANSITION" |
| resolved | open | 422, error = "INVALID_TRANSITION" |
| resolved | in_progress | 422, error = "INVALID_TRANSITION" |
| closed | any | 422, error = "INVALID_TRANSITION" |
| cancelled | any | 422, error = "INVALID_TRANSITION" |

**Edge cases:**
- Transitioning to the current status (e.g., open → open) is rejected
- Status field is case-sensitive; "Open" is rejected
- `changedBy` must be a valid user id
- Non-existent ticket returns 404, not 422

---

## Phase 5 — Search & Filter

**Goal:** Keyword search and status filter return correct, consistent results.

### Route extension
```
GET /api/tickets?search=<keyword>&status=<status>&priority=<priority>&assignedTo=<userId>
```

- `search` matches case-insensitively against `title` and `description` (PostgreSQL `ILIKE` via Prisma `contains` + `mode: 'insensitive'`)
- `status` filters exact match
- `priority` filters exact match (Stretch)
- `assignedTo` filters exact match (Stretch)
- All filters are combinable

### Test Cases (Phase 5)
- `GET /api/tickets?search=login` returns only tickets with "login" in title or description
- `GET /api/tickets?status=open` returns only open tickets
- `GET /api/tickets?search=login&status=open` returns intersection
- Search with no matches returns empty array (not 404)
- Invalid `status` query value returns 422

---

## Phase 6 — Frontend Implementation

**Goal:** Pixel-faithful implementation of `support-ticket-system-design.html` using Next.js 14 App Router + Tailwind CSS. Every screen, color, badge, button variant, and error state defined in the mockup must be reproduced exactly.

---

### Design Tokens (`frontend/app/globals.css`)

Declare as CSS custom properties; Tailwind utilities reference them via `arbitrary values`:

```css
:root {
  --primary: #4F46E5;        --primary-hover: #4338CA;
  --page-bg: #F8FAFC;        --surface: #FFFFFF;
  --border: #E2E8F0;         --text-primary: #0F172A;   --text-secondary: #64748B;
  --danger-bg: #FEF2F2;      --danger-border: #FCA5A5;
  --danger-text: #B91C1C;    --danger-text-dark: #7F1D1D;

  --status-open-bg: #DBEAFE;       --status-open-fg: #1D4ED8;
  --status-inprogress-bg: #FEF3C7; --status-inprogress-fg: #B45309;
  --status-resolved-bg: #D1FAE5;   --status-resolved-fg: #047857;
  --status-closed-bg: #E5E7EB;     --status-closed-fg: #374151;
  --status-cancelled-bg: #FEE2E2;  --status-cancelled-fg: #B91C1C;

  --priority-low-bg: #F1F5F9;      --priority-low-fg: #475569;
  --priority-medium-bg: #FEF3C7;   --priority-medium-fg: #B45309;
  --priority-high-bg: #FFEDD5;     --priority-high-fg: #C2410C;
  --priority-critical-bg: #FEE2E2; --priority-critical-fg: #B91C1C;
}
```

Font: **Inter** (weights 400/500/600/700/800) loaded via `next/font/google` in `layout.tsx`.

---

### App Router Page Structure

```
frontend/app/
├── layout.tsx               # Root layout — Inter font, page-bg body, TopNav
├── page.tsx                 # redirect() → /tickets
├── tickets/
│   ├── page.tsx             # TicketListPage (screens 1.1 / 1.2 / 1.3)
│   ├── new/
│   │   └── page.tsx         # CreateTicketPage — modal overlay (screens 2.1 / 2.2)
│   └── [id]/
│       └── page.tsx         # TicketDetailPage (screens 3.1 / 3.2 / 3.3)
```

---

### Shared Components (`frontend/components/`)

- `TopNav` — 72px tall white nav bar; left: indigo 28×28 logo-mark + "SupportDesk" (800 weight 18px); right: user name (600/13px) + role (secondary/11px) + 36px avatar circle
- `StatusBadge` — `inline-block px-2.5 py-1 rounded-full text-xs font-semibold`; 5 color variants driven by CSS vars
- `PriorityBadge` — same shape; 4 color variants
- `EmptyState` — white card, centered, inbox SVG icon (30px), "No tickets found" h3, helper `p`
- `ErrorState` — same card but `danger-bg` / `danger-border`; alert SVG icon, red "Couldn't load tickets" h3, Retry button (danger style)
- `Toast` — absolutely positioned `top-6 right-8`; red bg + border; alert icon; bold title + sub-text; auto-dismiss after 4s via `setTimeout`
- `FormField` — wrapper: label (600/13px, red asterisk for required), input/textarea/select (full-width, 11px padding, 8px radius, border); `has-error` variant adds red `1.5px` border + error message with alert icon beneath
- `IconButton` — 34×34 (or 28×28 sm), 8px radius, border, secondary color; `primary` variant is solid indigo; `round` variant is `border-radius:50%`
- `TransitionPanel` — "Move to" label + list of `transition-btn` elements; valid = indigo border/text; disabled = gray border/text `cursor-not-allowed`; helper note text beneath
- `CommentsSection` — comment list (avatar + name + timestamp + message), textarea input, round send `IconButton`
- `TicketTable` — full-width, `border-collapse`, `#F1F5F9` thead, `hover:#FAFBFF` tbody rows; columns: ID, Title, Priority, Status, Assignee, Created, Updated, View link

---

### Screen 1 — Ticket List (`/tickets`)

**Toolbar:**
- Left side: search input (280px, search icon, placeholder text) + Status filter dropdown (170px, chevron icon)
  - Both get `active-state` styling (indigo 1.5px border, bold text) when a value is active
  - When filters are active: ghost "Clear filters" button with X icon appears to the right
- Right side: "Create Ticket" primary button (indigo bg, plus icon) → navigates to `/tickets/new`

**Table columns:** `ID | Title | Priority | Status | Assignee | Created | Updated | View`
- Title cell: `font-weight:500`; highlighted variant (search match): indigo color + `font-weight:600`
- View cell: indigo "View →" link

**Result count:** `"Showing N of M tickets"` below table (12px secondary text)

**States (driven by fetch result):**
- Default: populated `TicketTable`
- Empty: `EmptyState` replaces table
- Error: `ErrorState` replaces table; Retry button re-calls the fetch

---

### Screen 2 — Create Ticket (`/tickets/new`)

**Layout:** full-screen dark overlay `rgba(15,23,42,0.55)` centered; modal card 560px wide, 14px radius, 28px padding

**Modal header:** "Create New Ticket" (800/18px) + X close button (30px icon-btn) → back to `/tickets`

**Fields:**
1. Title `*` — text input
2. Description `*` — textarea (min-height 80px, resize:vertical)
3. Two-column row: Priority `*` (select: High / Medium / Low / Critical) | Assignee (select: Unassigned + seeded users fetched from `GET /api/users`)

**Footer:** Cancel (secondary btn) | Create Ticket (primary btn) → `POST /api/tickets`; on 201 redirect to `/tickets/[id]`

**Validation error state (screen 2.2):**
- Each errored field: red `1.5px` border + alert icon + message below ("Title is required", "Description is required", "Priority is required")
- Errors sourced from backend 422 `details` array

---

### Screen 3 — Ticket Detail (`/tickets/[id]`)

**Breadcrumb:** `← Back to Tickets / Ticket #N` (primary color link with arrow-left icon)

**Two-column layout** (`detail-columns`): collapses to single column at ≤900px

**Left column (card, `flex:1`, `min-width:420px`):**

*View mode (screen 3.1):*
- Title (20px, 800 weight) + edit `IconButton` top-right → switches to edit mode
- "DESCRIPTION" section label (12px, uppercase, letter-spacing) + body text
- `CommentsSection`: "Comments (N)" heading, list of comments (avatar + name + time + message), textarea, round send button

*Edit mode (screen 3.2):*
- Header "Edit ticket" + "Save Changes" primary btn → `PATCH /api/tickets/:id`; reverts to view mode on success
- `FormField` for Title (pre-filled text input)
- `FormField` for Description (pre-filled textarea, min-height 110px)

**Right panel (card, `width:340px`):**

*View mode:*
- Current `StatusBadge`
- "Move to" label + `TransitionPanel`:
  - Icon mapping per target: Open→`icon-circle`, In Progress→`icon-play-circle`, Resolved→`icon-check-circle`, Closed→`icon-lock`, Cancelled→`icon-ban`
  - Valid buttons: indigo border, enabled; clicking sends `PATCH /api/tickets/:id/status`
  - Invalid buttons: gray border, `disabled` attribute, `cursor-not-allowed`
  - Note: "Only valid transitions are enabled. Invalid moves are rejected by the backend."
- Divider (`1px border`)
- `PriorityBadge`
- Assignee name (`font-weight:600`, 13px)
- Meta lines: "Created by X · date", "Last updated date" (11px secondary)

*Edit mode (screen 3.2):*
- Status badge (read-only) + transition panel (still active)
- Priority `<select>` (pre-filled)
- Assignee `<select>` (pre-filled, options from seeded users)
- Meta lines

**Invalid transition toast (screen 3.3):**
- `Toast` appears top-right: "Transition rejected" bold + "Can't move from X to Y. Invalid state transition."
- Triggered when backend returns 422 on `PATCH /status`
- Auto-dismisses after 4 seconds

---

### Transition Button Logic (frontend mirror of state machine)

`frontend/lib/stateMachine.ts` exports the same `VALID_TRANSITIONS` map as the backend. The `TransitionPanel` uses this to decide which buttons are `disabled` — preventing unnecessary round-trips while still letting the backend be the authoritative enforcer.

```ts
export const VALID_TRANSITIONS: Record<string, string[]> = {
  open:        ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved:    ['closed'],
  closed:      [],
  cancelled:   [],
};
```

---

### SVG Icon System

All icons are inline SVG `<symbol>` sprites (as in the mockup), declared once in `layout.tsx` and referenced via `<use href="#icon-name"/>`. Icons used:

`search, chevron-down, plus, edit, send, x, arrow-left, arrow-right, refresh, alert, inbox, check, check-circle, circle, play-circle, lock, ban, message, user, flag, clock`

---

### Component File Map

```
frontend/components/
├── TopNav.tsx
├── StatusBadge.tsx
├── PriorityBadge.tsx
├── EmptyState.tsx
├── ErrorState.tsx
├── Toast.tsx
├── FormField.tsx
├── IconButton.tsx
├── TransitionPanel.tsx
├── CommentsSection.tsx
└── TicketTable.tsx

frontend/lib/
├── api.ts              # typed fetch wrappers for all backend endpoints
└── stateMachine.ts     # VALID_TRANSITIONS mirror (frontend only for UI state)
```

---

### Frontend Acceptance Test Cases (Manual, against design screens)

- Ticket list table matches screen 1.1: all 8 columns visible, correct badge colors for each status/priority
- Empty state (screen 1.2): inbox icon + "No tickets found" shows when search has no results
- Error state (screen 1.3): red card + "Couldn't load tickets" + Retry button shows on fetch failure; Retry re-fetches
- Create ticket modal (screen 2.1): dark overlay, 560px modal, all fields present
- Validation errors (screen 2.2): red borders + error messages appear on submit with empty required fields
- Detail view (screen 3.1): two-column layout, all metadata visible, transition buttons correctly enabled/disabled
- Edit mode (screen 3.2): clicking pencil icon switches left column to editable inputs; Save sends PATCH
- Invalid transition toast (screen 3.3): red toast appears top-right on rejected transition; dismisses after 4s
- Search active state: search input gets indigo border; result count shows; matching title highlighted in indigo
- "Clear filters" ghost button appears when any filter is active; clears all filters on click
- Layout collapses to single column at ≤900px screen width

---

## Phase 7 — Cursor Workflow Documents

**Goal:** Produce the required `cursor-workflow/` submission folder.

### Files to Create
- `cursor-workflow/project-context.md` — project overview, tech stack, entity model, conventions
- `cursor-workflow/spec.md` — full feature spec derived from requirements; maps to code locations
- `cursor-workflow/tasks.md` — phased task breakdown with status tracking
- `cursor-workflow/acceptance-criteria.md` — all acceptance criteria from requirements, with pass/fail notes
- `cursor-workflow/cursor-rules-or-instructions.md` — Cursor rules for this project (naming, state machine constraints, error format contract)

---

## Phase 8 — Stretch Goals (Optional, C1.1 Evidence)

Prioritized order if time allows:

1. **Authentication** — JWT-based login; protect all mutation routes; seed users get passwords
2. **Pagination & Sorting** — `GET /api/tickets?page=1&limit=20&sort=createdAt&order=desc`
3. **Role management** — admin can delete/reassign; viewer read-only
4. **Swagger/OpenAPI** — auto-generated docs at `/api/docs`
5. **Unit tests** — unit test `stateMachine.ts` and Zod schemas in isolation with Jest
6. **Docker setup** — `Dockerfile` for backend, `docker-compose.yml` with volume mount for `data/`
7. **CI workflow** — GitHub Actions: lint → type-check → test on push to main

---

## Test Strategy Summary

| Phase | Test Type | Tool | Coverage |
|---|---|---|---|
| Phase 2 | DB smoke | Jest | Schema idempotency, seed presence |
| Phase 3 | Integration | Jest + Supertest | All CRUD routes, validation |
| Phase 4 | Integration | Jest + Supertest | All 12 transition scenarios |
| Phase 5 | Integration | Jest + Supertest | Search + filter combinations |
| Phase 6 | Manual/E2E | Browser | Acceptance criteria checklist |
| Stretch | Unit | Jest | State machine pure function, Zod schemas |

### Test Isolation Strategy
- All integration tests run against a **dedicated PostgreSQL test DB** (`tickets_test`) configured via `backend/.env.test`
- `jest.config.ts` sets `globalSetup` to run `prisma migrate deploy` on the test DB before the suite
- Each test file wraps mutations in `beforeEach` / `afterEach` `prisma.$transaction` rollbacks (or truncates tables) to keep tests independent
- `npm test` in `backend/` runs the full suite; `npm run test:watch` for development

---

## State Machine Diagram

```mermaid
flowchart LR
    open([open]) -->|"valid"| in_progress([in_progress])
    open -->|"valid"| cancelled([cancelled])
    in_progress -->|"valid"| resolved([resolved])
    in_progress -->|"valid"| cancelled
    resolved -->|"valid"| closed([closed])
    open -.->|"INVALID_TRANSITION 422"| resolved
    open -.->|"INVALID_TRANSITION 422"| closed
    in_progress -.->|"INVALID_TRANSITION 422"| open
    resolved -.->|"INVALID_TRANSITION 422"| open
    closed -.->|"INVALID_TRANSITION 422"| anyState([any])
    cancelled -.->|"INVALID_TRANSITION 422"| anyState
```

---

## Phased Delivery Order

```
Phase 1  →  Scaffolding & dev servers
Phase 2  →  DB schema + seed
Phase 3  →  Tickets & Comments CRUD API
Phase 4  →  State machine + mandatory integration tests
Phase 5  →  Search & filter
Phase 6  →  Frontend UI
Phase 7  →  Cursor workflow docs
Phase 8  →  Stretch (auth, pagination, Docker, CI)
```
