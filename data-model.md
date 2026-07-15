# Data Model

PostgreSQL schema managed by Prisma (`backend/prisma/schema.prisma`).

## Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     User     │         │    Ticket    │         │   Comment    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │◄───┐    │ id (PK)      │◄────────│ id (PK)      │
│ name         │    │    │ title        │         │ ticketId (FK)│
│ email (UQ)   │    │    │ description  │         │ message      │
│ passwordHash │    ├────│ createdById  │         │ createdById  │──┐
│ role         │    │    │ assignedToId │──┐      │ createdAt    │  │
│ isActive     │    │    │ priority     │  │      └──────────────┘  │
│ createdAt    │    │    │ status       │  │                        │
│ updatedAt    │    │    │ createdAt    │  │                        │
└──────────────┘    │    │ updatedAt    │  │                        │
       ▲            │    └──────────────┘  │                        │
       │            │           ▲          │                        │
       │            └───────────┘          └────────────────────────┘
       │                 createdBy              createdBy
       └─────────────────────────────────────────────────────────────
                              assignedTo (optional)
```

## User

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `uuid()` | |
| `name` | String | Required | Display name |
| `email` | String | Unique, required | Stored lowercase on create/update |
| `passwordHash` | String | Required | bcrypt hash; never exposed in API |
| `role` | `Role` enum | Required | `admin`, `agent`, `viewer` |
| `isActive` | Boolean | Default `true` | `false` = deactivated; cannot log in |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Relations**

- `ticketsCreated` — tickets where user is creator
- `ticketsAssigned` — tickets assigned to user
- `comments` — comments authored by user

## Ticket

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `title` | String | Required | 3–255 chars (API validation) |
| `description` | String | Required | 1–10000 chars (API validation) |
| `priority` | `Priority` enum | Required | `low`, `medium`, `high`, `critical` |
| `status` | `Status` enum | Default `open` | See state machine |
| `assignedToId` | UUID | FK → User, nullable | Optional assignee |
| `createdById` | UUID | FK → User, required | Set from JWT on create |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes:** `status`, `priority`, `createdById`, `assignedToId`, `createdAt`

**Relations**

- `createdBy` → User (required)
- `assignedTo` → User (optional)
- `comments` → Comment[] (cascade delete)

## Comment

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `ticketId` | UUID | FK → Ticket, required | Cascade on ticket delete |
| `message` | String | Required | 1–5000 chars (API validation) |
| `createdById` | UUID | FK → User, required | Set from JWT on create |
| `createdAt` | DateTime | Auto | |

**Indexes:** `ticketId`, `createdById`

## Enums

### Role

| Value | Purpose |
|-------|---------|
| `admin` | Full access; user management |
| `agent` | Ticket read/write |
| `viewer` | Ticket read-only |

### Priority

`low` → `medium` → `high` → `critical` (ordinal for display/sort only; no workflow enforcement)

### Status

| Value | Terminal | Valid next statuses |
|-------|----------|---------------------|
| `open` | No | `in_progress`, `cancelled` |
| `in_progress` | No | `resolved`, `cancelled` |
| `resolved` | No | `closed` |
| `closed` | Yes | — |
| `cancelled` | Yes | — |

Enforced in `backend/src/services/stateMachine.ts`.

## Referential Integrity

- Ticket `createdById` → User (required)
- Ticket `assignedToId` → User (optional; validated as active user on assign)
- Comment `ticketId` → Ticket (`onDelete: Cascade`)
- Comment `createdById` → User (required)

Deactivated users remain in the database for audit/history. New assignments to inactive users are rejected at the service layer.

## Migrations

| Migration | Purpose |
|-----------|---------|
| `20250630120000_init` | Initial tables and enums |
| `20250715120000_add_performance_indexes` | List/filter performance indexes |

Apply with:

```bash
cd backend && npx prisma migrate deploy
```

## Seed Data

`backend/prisma/seed.ts` creates:

| Email | Role |
|-------|------|
| `admin@supportdesk.local` | admin |
| `priya.sharma@supportdesk.local` | agent |
| `viewer@supportdesk.local` | viewer |
| Additional agent users | agent |

All seed users share the password from `SEED_DEFAULT_PASSWORD`.

## API Projection vs Database

The API never returns `passwordHash`. User objects in ticket/comment responses include only `{ id, name, email, role }`. Admin user endpoints additionally expose `isActive`, `createdAt`, `updatedAt`.

## TypeScript Types (Frontend)

Mirrored in `frontend/types/index.ts` as `User`, `AdminUser`, `Ticket`, `Comment`, `Role`, `Priority`, `Status`.
