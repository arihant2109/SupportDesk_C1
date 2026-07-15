# API Contract

Base URL: `http://localhost:3001/api` (configurable via `NEXT_PUBLIC_API_URL` on the frontend).

## Common Conventions

### Authentication

Protected routes require:

```
Authorization: Bearer <jwt>
```

Missing or invalid tokens return `401`:

```json
{ "error": "UNAUTHORIZED", "message": "..." }
```

Insufficient role returns `403`:

```json
{ "error": "FORBIDDEN", "message": "..." }
```

### Error Response Shape

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": ["optional array of detail strings"]
}
```

### ID Parameters

All `:id` path parameters must be valid UUIDs. Invalid format returns `422` with `VALIDATION_ERROR`.

---

## Health

### `GET /health`

No authentication.

**Response `200`**

```json
{ "ok": true }
```

---

## Authentication

### `POST /auth/login`

No authentication. Rate limited (10 requests / 15 min / IP).

**Request body**

```json
{
  "email": "agent@supportdesk.local",
  "password": "ChangeMe123!"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Valid email |
| `password` | string | Required, min 1 char |

**Response `200`**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Priya Sharma",
    "email": "priya.sharma@supportdesk.local",
    "role": "agent"
  }
}
```

**Errors:** `401` invalid credentials; `422` validation failure.

### `GET /auth/me`

Authentication required.

**Response `200`**

```json
{
  "user": {
    "id": "uuid",
    "name": "...",
    "email": "...",
    "role": "admin | agent | viewer"
  }
}
```

---

## Users

All routes require authentication.

### `GET /users`

| Role | Behavior |
|------|----------|
| `admin` | All users (active and inactive) with `isActive`, `createdAt`, `updatedAt` |
| `agent`, `viewer` | Active users only (`id`, `name`, `email`, `role`) |

**Response `200`** — array of user objects.

### `POST /users`

**Role:** `admin` only.

**Request body**

```json
{
  "name": "New Agent",
  "email": "new@supportdesk.local",
  "password": "SecurePass1",
  "role": "agent"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 1–100 chars |
| `email` | string | Valid email, max 255, unique |
| `password` | string | Min 8 chars |
| `role` | enum | `admin`, `agent`, `viewer` |

**Response `201`** — created user (includes `isActive`, timestamps).

### `PATCH /users/:id`

**Role:** `admin` only. At least one field required.

**Request body** (all optional)

```json
{
  "name": "Updated Name",
  "email": "updated@supportdesk.local",
  "password": "NewPass123",
  "role": "viewer",
  "isActive": true
}
```

**Response `200`** — updated user.

### `DELETE /users/:id`

**Role:** `admin` only. Soft-deactivates user (`isActive: false`). Idempotent if already inactive. Admin cannot deactivate themselves.

**Response `200`** — deactivated user object.

---

## Tickets

All routes require authentication.

### `GET /tickets`

**Roles:** `admin`, `agent`, `viewer`.

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Case-insensitive match on title/description (max 200 chars) |
| `status` | enum | `open`, `in_progress`, `resolved`, `closed`, `cancelled` |
| `priority` | enum | `low`, `medium`, `high`, `critical` |
| `assignedToId` | uuid | Filter by assignee |
| `page` | int | Default `1` |
| `limit` | int | Default `20`, max `100` |
| `sort` | enum | `createdAt`, `updatedAt`, `title`, `priority`, `status` |
| `order` | enum | `asc`, `desc` (default `desc` for sort field) |

**Response `200`**

```json
{
  "tickets": [
    {
      "id": "uuid",
      "title": "...",
      "description": "...",
      "priority": "high",
      "status": "open",
      "assignedToId": "uuid-or-null",
      "createdById": "uuid",
      "createdAt": "2025-06-30T12:00:00.000Z",
      "updatedAt": "2025-06-30T12:00:00.000Z",
      "createdBy": { "id": "...", "name": "...", "email": "...", "role": "agent" },
      "assignedTo": { "id": "...", "name": "...", "email": "...", "role": "agent" }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### `GET /tickets/transitions`

**Roles:** `admin`, `agent`, `viewer`.

**Query:** `status` (required enum)

**Response `200`**

```json
{
  "transitions": ["in_progress", "cancelled"]
}
```

### `POST /tickets`

**Roles:** `admin`, `agent`.

**Request body**

```json
{
  "title": "Login page throws 500",
  "description": "Steps to reproduce...",
  "priority": "high",
  "assignedToId": "uuid-or-null"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 3–255 chars |
| `description` | string | 1–10000 chars |
| `priority` | enum | `low`, `medium`, `high`, `critical` |
| `assignedToId` | uuid \| null | Optional; must reference active user |

`createdById` is set from JWT — not accepted in the body.

**Response `201`** — full ticket with relations.

### `GET /tickets/:id`

**Roles:** `admin`, `agent`, `viewer`.

**Response `200`** — ticket with `createdBy`, `assignedTo`, and `comments[]` (each comment includes `createdBy`). Comments ordered by `createdAt` ascending.

**Response `404`** — ticket not found.

### `PATCH /tickets/:id`

**Roles:** `admin`, `agent`. At least one field required.

**Request body** (all optional)

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "medium",
  "assignedToId": "uuid-or-null"
}
```

**Response `200`** — updated ticket.

### `PATCH /tickets/:id/status`

**Roles:** `admin`, `agent`.

**Request body**

```json
{ "status": "in_progress" }
```

Transition must be valid per state machine. Actor is recorded from JWT (not in body).

**Response `200`** — updated ticket.

**Response `422`** — invalid transition:

```json
{
  "error": "INVALID_TRANSITION",
  "message": "Cannot move from open to closed",
  "details": ["open", "closed"]
}
```

### `POST /tickets/:id/comments`

**Roles:** `admin`, `agent`.

**Request body**

```json
{ "message": "Investigating the root cause." }
```

| Field | Type | Rules |
|-------|------|-------|
| `message` | string | 1–5000 chars |

`createdById` is set from JWT.

**Response `201`** — created comment with `createdBy`.

---

## Swagger

Interactive docs served at `GET /api/docs` when `backend/openapi.yaml` is present.

> **Note:** The OpenAPI file may lag behind auth/user endpoints. This document and `cursor-workflow/spec.md` are the authoritative contracts for the current implementation.

---

## Role Matrix (Quick Reference)

| Endpoint | admin | agent | viewer |
|----------|-------|-------|--------|
| `POST /auth/login` | ✓ | ✓ | ✓ |
| `GET /auth/me` | ✓ | ✓ | ✓ |
| `GET /users` | ✓ (full) | ✓ (active) | ✓ (active) |
| `POST/PATCH/DELETE /users` | ✓ | — | — |
| `GET /tickets`, `GET /tickets/:id` | ✓ | ✓ | ✓ |
| `GET /tickets/transitions` | ✓ | ✓ | ✓ |
| `POST/PATCH /tickets/*` | ✓ | ✓ | — |
