# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack time tracking application built with **Next.js 16 App Router, Prisma, NextAuth, and PostgreSQL**. Employees log daily work hours via an interactive calendar; admins review team-wide activity from a dashboard with export capabilities.

**Tech Stack:**
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4
- Backend: Next.js API routes with NextAuth 4 (JWT sessions)
- Database: PostgreSQL with Prisma ORM
- Validation: Zod schemas on all API endpoints

## Essential Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)
npm run build                  # Production build (validates TS)
npm run lint                   # Run ESLint

# Database workflows
npm run prisma:generate        # Regenerate Prisma client (after schema changes)
npm run prisma:migrate         # Create/apply dev migrations
npm run prisma:deploy          # Apply migrations (production)
npm run prisma:seed            # Populate test data (admin + employee users)

# Docker (full stack)
docker compose up --build      # Start PostgreSQL + app
docker compose down -v         # Reset local DB (removes volumes)
```

**Test credentials (after seeding):**
- Admin: `admin@example.com` / `Admin123!`
- Employee: `employee@example.com` / `Employee123!`

## Architecture Overview

### Data Models ([prisma/schema.prisma](prisma/schema.prisma))

**User** - Authentication and authorization
- `role` enum: `EMPLOYEE` (default) or `ADMIN`
- `passwordHash` stored with bcryptjs (10 rounds)
- Relations: `timeEntries[]`, `accounts[]`, `sessions[]`

**TimeEntry** - Work hours tracking
- `workDate`, `hoursWorked`, `overtimeHours` (Decimal type)
- Time slots: `morningStart/End`, `afternoonStart/End` (optional strings)
- Indexed by `(userId, workDate)` for fast queries
- **Business rule**: Employees can only log hours for current month up to today

**Account/Session/VerificationToken** - NextAuth adapter models

### Authentication Flow ([lib/auth.ts](lib/auth.ts))

NextAuth with JWT strategy:
1. User submits credentials via [LoginForm](components/login-form.tsx)
2. CredentialsProvider validates against `passwordHash` (bcrypt)
3. JWT callback enriches token with `{id, role}`
4. Session callback populates `session.user` with user metadata
5. Protected routes check `session.user.role` for RBAC

**Critical**: TypeScript augmentations in [types/next-auth.d.ts](types/next-auth.d.ts) add `role` to Session/User/JWT types.

### Role-Based Access Control (RBAC)

**EMPLOYEE** role restrictions:
- Can only view/edit own `TimeEntry` records
- **Date constraints enforced in both UI and API:**
  - Can only log hours for current month
  - Cannot log future dates
  - Cannot log dates from previous months
  - Validation: [employee-dashboard.tsx](components/dashboard/employee-dashboard.tsx) (client) and [app/api/hours/route.ts](app/api/hours/route.ts) (server)

**ADMIN** role capabilities:
- Query any user's data (use `userId` query param or `"all"`)
- Create users via [POST /api/users/create](app/api/users/create/route.ts)
- Export data as CSV/ZIP via [POST /api/export-csv](app/api/export-csv/route.ts)
- Access admin dashboard at [/dashboard/admin](app/dashboard/admin/page.tsx)

**Pattern**: All protected API routes call `getAuthSession()` first, return 401 if missing, then check `session.user.role !== "ADMIN"` for admin-only operations.

## Common Development Patterns

### Adding a New API Endpoint

1. Create handler in `app/api/{resource}/route.ts`
2. Call `getAuthSession()` at top; return 401 if session missing
3. Define **Zod schema** for request validation (safeParse pattern)
4. Check `session.user.role` for RBAC enforcement
5. **Critical**: Convert Prisma `Decimal` to number: `parseFloat(entry.hoursWorked.toString())`
6. Return `NextResponse.json(data, { status: ... })`

Example from [app/api/hours/route.ts](app/api/hours/route.ts):
```typescript
const querySchema = z.object({
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});
const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid query" }, { status: 400 });
}
```

### Server Component Data Fetching

- Use `getAuthSession()` for auth checks; redirect if unauthorized
- Query Prisma **directly** (not via API) for initial page data
- Convert Prisma types to **DTOs** before passing to client components
- Handle `Decimal` type: `import type { Decimal } from "@prisma/client/runtime/library"`

Example DTO pattern from [app/dashboard/page.tsx](app/dashboard/page.tsx):
```typescript
const toDto = (entry: TimeEntry) => ({
  ...entry,
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  workDate: entry.workDate.toISOString()
});
```

### Client Component Patterns

- Mark interactive components with `"use client"` directive
- Use `useTransition()` for form submissions (loading states)
- Fetch data via `/api/*` routes; manually handle 401 redirects
- Use `AbortController` to cancel fetch requests on unmount
- Store DTOs in state, **never** raw Prisma objects (Decimal serialization fails)

Example from [employee-dashboard.tsx](components/dashboard/employee-dashboard.tsx):
```typescript
const [isPending, startTransition] = useTransition();

const handleSubmit = async (data: FormData) => {
  startTransition(async () => {
    const response = await fetch('/api/hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    // Handle response...
  });
};
```

## Key API Endpoints

| Endpoint | Method | Purpose | RBAC |
|----------|--------|---------|------|
| `/api/auth/[...nextauth]` | ALL | NextAuth handler (login/logout) | Public |
| `/api/setup` | POST | Create first admin account | Public (only if DB empty) |
| `/api/hours` | GET | Fetch time entries (supports `userId`, `from`, `to` params) | Employees: own data; Admins: any user |
| `/api/hours` | POST | Create/update time entry | Employees: current month only; Admins: any date |
| `/api/hours` | DELETE | Delete time entry (requires `id` param) | Employees: own entries; Admins: any entry |
| `/api/users` | GET | List all users with total hours | Admin only |
| `/api/users/create` | POST | Create new user | Admin only |
| `/api/export-csv` | POST | Export hours as CSV/ZIP (requires `month`, `userIds[]`) | Admin only |

## Database Workflows

**Creating migrations:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npm run prisma:migrate
# Enter migration name (e.g., "add_overtime_field")
# 3. Prisma generates SQL in prisma/migrations/
```

**Applying migrations in production:**
```bash
npm run prisma:deploy  # Non-interactive, CI-friendly
```

**Resetting local database:**
```bash
docker compose down -v      # Delete volumes
docker compose up --build   # Recreate from scratch
npm run prisma:seed         # Re-populate test data
```

**Updating Prisma client after schema changes:**
```bash
npm run prisma:generate     # Regenerate types and client
```

## Critical Type Safety Considerations

### Prisma Decimal Type Handling

**Problem**: Prisma `Decimal` type (for `hoursWorked`, `overtimeHours`) is not JSON-serializable and causes runtime errors in client components.

**Solution**: Always convert to number before sending to client:
```typescript
// API routes and Server Components
const dto = {
  hoursWorked: parseFloat(timeEntry.hoursWorked.toString()),
  overtimeHours: parseFloat(timeEntry.overtimeHours.toString())
};
```

**Type imports**: Import `Decimal` as type-only to avoid bundling:
```typescript
import type { Decimal } from "@prisma/client/runtime/library";
```

### NextAuth Type Augmentation

Custom `role` field on session requires augmentation in [types/next-auth.d.ts](types/next-auth.d.ts):
```typescript
declare module "next-auth" {
  interface Session {
    user: { id: string; role: string; name?: string | null; email?: string | null; image?: string | null };
  }
}
```

## Project Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/route.ts    # NextAuth config entry point
│   ├── hours/route.ts                 # TimeEntry CRUD + RBAC filtering
│   ├── users/route.ts & create/       # Admin user management
│   ├── export-csv/route.ts            # CSV/ZIP export with archiver
│   └── setup/route.ts                 # Initial admin creation
├── dashboard/
│   ├── page.tsx                       # Routes to employee/admin dashboard
│   └── admin/page.tsx                 # Admin-specific view
├── setup/page.tsx                     # First-time setup flow
├── page.tsx                           # Login page (public)
└── layout.tsx                         # Root layout with metadata

components/
├── dashboard/
│   ├── employee-dashboard.tsx         # Interactive calendar + time entry modal
│   └── admin-dashboard.tsx            # User table, creation form, export UI
├── login-form.tsx                     # Email/password form
├── setup-form.tsx                     # Initial admin account creation
└── logout-button.tsx                  # Sign out trigger

lib/
├── auth.ts                            # NextAuth config, JWT/session callbacks
└── prisma.ts                          # Prisma client singleton

prisma/
├── schema.prisma                      # Data models + indexes
├── migrations/                        # Auto-generated SQL migrations
└── seed.ts                            # Test data (admin + employee + sample entries)

types/
└── next-auth.d.ts                     # TypeScript augmentations for session
```

## Debugging Tips

**Prisma query logs**: Set `log: ["query"]` in [lib/prisma.ts](lib/prisma.ts) (dev mode) to see SQL queries in console.

**Auth session issues**: Check `session.user` shape in JWT callback ([lib/auth.ts:54-71](lib/auth.ts#L54-L71)); verify `role` is being set.

**Decimal type errors**: If seeing "cannot serialize Decimal" or similar, ensure all Decimal fields are converted to `number` before passing to client components or returning from API.

**401/403 errors in client components**: Verify `getAuthSession()` is called in API route; check `session.user.role` matches required permission level.

**Date validation failures**: Employees can only log hours for current month up to today. Check client-side validation in [employee-dashboard.tsx](components/dashboard/employee-dashboard.tsx) and server-side validation in [app/api/hours/route.ts](app/api/hours/route.ts).

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/timetracker`)
- `NEXTAUTH_SECRET` - Random 32+ byte string for JWT signing
- `NEXTAUTH_URL` - Base URL of app (e.g., `http://localhost:3000`)

## Additional Notes

**Setup flow**: When database is empty, app redirects to `/setup` where first admin account is created via [POST /api/setup](app/api/setup/route.ts).

**Export functionality**: [POST /api/export-csv](app/api/export-csv/route.ts) uses `archiver` library to create ZIP files when multiple users selected; single user returns CSV directly.

**Time calculation**: Hours are calculated from `(end_time - start_time) / 60` for morning/afternoon shifts; overtime tracked separately in `overtimeHours` field.

**Docker deployment**: Multi-stage Dockerfile ([Dockerfile](Dockerfile)) optimizes build; [docker-compose.yml](docker-compose.yml) includes health checks and auto-runs `prisma migrate deploy` before starting app.
