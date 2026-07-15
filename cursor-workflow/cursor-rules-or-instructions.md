# Cursor Rules & Instructions

## Code Style
- Follow existing patterns in backend services and frontend components
- Comment out previous code when changing (do not delete)
- Use TypeScript strict mode throughout

## Backend Rules
- All data access via Prisma client (`backend/src/lib/prisma.ts`)
- State transitions MUST go through `canTransition()` in `stateMachine.ts`
- Never allow direct status field updates via PATCH /tickets/:id — use PATCH /status
- Validation via Zod schemas in `backend/src/schemas/`
- Error responses: `{ error: "CODE", message?, details? }`

## Frontend Rules
- Match `support-ticket-system-design (1).html` design tokens and layout
- Use CSS custom properties from `globals.css` for colors
- Current user selected via TopNav dropdown, persisted in localStorage
- Transition buttons: enable only valid next states (mirror backend map)
- Show Toast on 422 INVALID_TRANSITION from backend

## Testing Rules
- Integration tests use dedicated `tickets_test` database
- State machine: test ALL valid transitions (5) and invalid transitions (7+)
- Run `npm test` in backend before committing

## Security
- Never commit `.env` files
- No hardcoded credentials in source code
- Use `.env.example` for documentation only

## Spec-Driven Workflow
1. Read `cursor-workflow/spec.md` before implementing features
2. Update `tasks.md` when completing phases
3. Verify against `acceptance-criteria.md` before submission
