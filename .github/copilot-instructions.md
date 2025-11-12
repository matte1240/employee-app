# Copilot Instructions for Employee Work Hours Tracker

## Project Overview
This is a **Next.js 16 + Prisma + NextAuth + PostgreSQL** time tracking application. Employees log work hours via an interactive calendar; admins review team-wide data from a centralized dashboard.

## Architecture & Data Flow

### Core Stack
- **Frontend**: Next.js App Router with React 19, Server Components, Tailwind CSS v4
- **Auth**: NextAuth v4 with JWT sessions, credentials provider, Prisma adapter
- **Database**: PostgreSQL (external service) with Prisma ORM (migrations in `prisma/migrations/`)
- **Validation**: Zod for runtime schema validation on API routes
- **Process Manager**: PM2 for production deployment with automatic restart and monitoring

### Key Components
- **`lib/auth.ts`**: NextAuth configuration, JWT callbacks, session/user enrichment with `role` field
- **`lib/prisma.ts`**: Global Prisma client singleton (prevents connection pooling issues in dev)
- **`types/next-auth.d.ts`**: TypeScript augmentation for Session, User, JWT with custom `role` field
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth handler (delegated from config)
- **`prisma/schema.prisma`**: Data models (User, TimeEntry, Account, Session, VerificationToken)

### Data Model Patterns
- **User**: Role-based (ENUM: EMPLOYEE, ADMIN); passwordHash for credentials auth
- **TimeEntry**: `workDate` + `hoursWorked` (Decimal); indexed by `(userId, workDate)` for fast queries
- **Session/Account**: NextAuth adapter models (required for JWT strategy + optional OAuth)

## Common Workflows

### Adding a New API Endpoint
1. Create handler in `app/api/{resource}/route.ts`
2. Call `getAuthSession()` at the top; return 401 if missing
3. Check `session.user.role` for ADMIN-only endpoints
4. Use **Zod schema** (top of file) for request validation
5. Convert Prisma Decimal types to JSON-safe numbers: `parseFloat(entry.hoursWorked.toString())`
6. Return `NextResponse.json(data, { status: ... })`

Example (from `app/api/hours/route.ts`):
```typescript
const querySchema = z.object({ userId: z.string().optional(), from: z.string().optional() });
const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
```

### Server Component Data Fetching
- Use `getAuthSession()` for auth checks; redirect if unauthorized
- Query Prisma directly (not via API) for initial page data
- Convert Prisma types to **DTOs** before passing to client components (see `toDto` in `app/dashboard/page.tsx`)
- Properly type Prisma Decimal: `import type { Decimal } from "@prisma/client/runtime/library"`

### Client Component Patterns
- Mark interactive components with `"use client"` at the top
- Use `useTransition()` for form submissions (see `employee-dashboard.tsx`)
- Fetch data via `/api/` routes; handle 401 redirects manually
- Abort fetch requests on unmount (use `AbortController`)
- Store DTOs in state, not raw Prisma objects

## Critical Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) + watch mode |
| `npm run build` | Production build (validates TS) |
| `npm run prisma:migrate` | Create/apply dev migrations |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Populate test data (admin + employee users) |
| `npm run lint` | Run ESLint |
| `npm run pm2:start` | Start app with PM2 in production |
| `npm run pm2:logs` | View PM2 application logs |
| `npm run pm2:monit` | Monitor PM2 resources in real-time |
| `npm run pm2:restart` | Restart the PM2 process |
| `npm run pm2:stop` | Stop the PM2 process |

### Database Workflows
- **New migration**: `npm run prisma:migrate` → enter name → Prisma creates SQL
- **Seed test data**: `npm run prisma:seed` (uses bcryptjs to hash passwords)
- **Production deployment**: `npm run prisma:deploy` to apply migrations without prompts

### Production Deployment
- **Build**: `npm run build` → creates `.next/` optimized bundle
- **Deploy**: `npm run pm2:start` → starts app with PM2 (auto-restart on crash)
- **Monitor**: `npm run pm2:monit` or `npm run pm2:logs` for real-time monitoring
- **Configuration**: Edit `ecosystem.config.js` for PM2 settings (port, instances, memory limit)

## Project Conventions

### Role-Based Access Control (RBAC)
- **EMPLOYEE**: Can only view/edit own TimeEntry records; no admin query params
  - **Date restriction**: Can only log hours for the current month up to and including today
  - Validated on both client (`employee-dashboard.tsx`) and server (`app/api/hours/route.ts`)
  - Future dates and dates from previous months are blocked with appropriate error messages
  - **Time Entry UI**: Click on calendar cells opens a modal with:
    - Morning shift: start/end time (30-minute precision)
    - Afternoon shift: start/end time (30-minute precision)
    - Automatic calculation of regular hours (max 8h) and overtime (hours > 8)
    - Notes field (optional)
- **ADMIN**: Can query any user's data; use `userId === "all"` for reports
- **Pattern**: Check `session.user.role` in API handlers before filtering queries

### Type Safety Across Boundaries
- Define **Zod schemas** for all request/response validation
- Use **DTOs** (Data Transfer Objects) to serialize Prisma complex types (Decimal → number)
- Augment NextAuth types in `types/next-auth.d.ts` when adding session fields (e.g., `role`)

### File Organization
```
app/
  ├── api/
  │   ├── auth/[...nextauth]/    # NextAuth config
  │   ├── hours/route.ts         # TimeEntry CRUD + filtering
  │   └── users/route.ts         # Admin user queries
  ├── dashboard/                  # Protected employee/admin views
  ├── layout.tsx                  # Root layout + metadata
  └── page.tsx                    # Login page
components/
  └── dashboard/
      ├── employee-dashboard.tsx  # Interactive calendar (client)
      └── admin-dashboard.tsx     # Team summary (client)
lib/
  ├── auth.ts                     # NextAuth + JWT callbacks
  └── prisma.ts                   # Prisma singleton
ecosystem.config.js               # PM2 configuration
logs/                             # PM2 logs (gitignored)
```

## Debugging Tips
- **Prisma logs**: Set `DATABASE_URL` + `npm run dev` sees `query` logs in dev mode
- **Auth issues**: Check `session.user` shape in JWT callback (`lib/auth.ts` lines 54–71)
- **Type errors on Decimal**: Always import `type { Decimal }` for type annotations only
- **CORS/401 errors in client**: Verify `getAuthSession()` is called before sensitive operations
