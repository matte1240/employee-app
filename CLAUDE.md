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

# Database backup & restore
npm run backup:db              # Create immediate backup (gzipped)
npm run restore:db <file>      # Restore from backup (requires confirmation)
npm run backup:cleanup         # Remove old backups per retention policy

# Production (PM2)
npm run pm2:start              # Start app with PM2 process manager
npm run pm2:stop               # Stop the application
npm run pm2:restart            # Restart the application
npm run pm2:delete             # Remove from PM2
npm run pm2:logs               # View application logs
npm run pm2:monit              # Monitor resources in real-time
```

**Test credentials (after seeding):**
- Admin: `admin@example.com` / `Admin123!`
- Employee: `employee@example.com` / `Employee123!`

## Local Development Setup

**First-time setup:**
```bash
# 1. Clone repository and install dependencies
git clone <repository-url>
cd employee-app
npm install

# 2. Setup PostgreSQL database (see Environment Variables section)

# 3. Create .env file with required variables
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Run migrations and seed data
npm run prisma:migrate
npm run prisma:seed

# 5. Start development server
npm run dev
# Access at http://localhost:3000
```

**Daily development workflow:**
```bash
npm run dev                    # Start dev server with hot reload
npm run prisma:generate        # After schema changes
npm run prisma:migrate         # Create and apply new migrations
npm run lint                   # Check code quality
```

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
- **Time Entry UI**: Click calendar cells to open modal with:
  - Morning shift: start/end time (30-minute precision)
  - Afternoon shift: start/end time (30-minute precision)
  - Automatic calculation of regular hours (max 8h) and overtime (hours > 8)
  - Optional notes field

**ADMIN** role capabilities:
- Query any user's data (use `userId` query param or `"all"`)
- Create users via [POST /api/users/create](app/api/users/create/route.ts)
- Export data as CSV/ZIP via [POST /api/export-csv](app/api/export-csv/route.ts)
- Access admin dashboard at [/dashboard/admin](app/dashboard/admin/page.tsx)

**Pattern**: All protected API routes call `getAuthSession()` first, return 401 if missing, then check `session.user.role !== "ADMIN"` for admin-only operations.

### Time Entry Calculation Logic

**Core Principle**: Work hours are split into **regular hours** (capped at 8 per day) and **overtime hours** (anything above 8).

#### Calculation Flow

**1. User Input** ([employee-dashboard.tsx](components/dashboard/employee-dashboard.tsx))
- Morning shift: start/end time (e.g., `08:00` → `12:00`)
- Afternoon shift: start/end time (e.g., `14:00` → `18:30`)

**2. Hours Calculation** ([employee-dashboard.tsx:48-55](components/dashboard/employee-dashboard.tsx#L48-L55))
```typescript
function calculateHours(start: string, end: string): number {
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}
```

**3. Regular vs Overtime Split** ([employee-dashboard.tsx:183-188](components/dashboard/employee-dashboard.tsx#L183-L188))
```typescript
const morning = calculateHours(morningStart, morningEnd);      // e.g., 4h
const afternoon = calculateHours(afternoonStart, afternoonEnd);  // e.g., 4.5h
const total = morning + afternoon;                             // e.g., 8.5h
const regular = Math.min(total, 8);                           // e.g., 8h
const overtime = Math.max(0, total - 8);                       // e.g., 0.5h
```

**4. Permesso Hours** (calculated on backend and frontend)
- Only applies on **weekdays** (Monday-Friday)
- When `total < 8`: `permessoHours = 8 - total`
- Represents leave/absence hours to reach 8-hour workday
- Example: Work 6h on Monday → 2h permesso

#### Field Definitions

| Field | Contains | Formula | Example (9h day) |
|-------|----------|---------|------------------|
| `hoursWorked` | Regular hours only (max 8/day) | `Math.min(total, 8)` | 8 |
| `overtimeHours` | Hours beyond 8/day | `Math.max(0, total - 8)` | 1 |
| `permessoHours` | Leave hours (weekdays, when total < 8) | `8 - total` (if < 8) | 0 |
| **Total hours** | Sum of worked hours | `hoursWorked + overtimeHours` | 9 |

#### Display Logic

**Employee Calendar:**
- **Individual day cells**: Show `hoursWorked + overtimeHours` (total worked)
- **Month Total card**: Sums `hoursWorked + overtimeHours` for all entries
- **Overtime badge**: Shows `overtimeHours` separately

**Admin Dashboard:**
- **Total Hours column**: Shows `regularHours + overtimeHours` per user
- **Ore Straordinarie column**: Shows `overtimeHours` separately
- **Ore di Permesso column**: Shows `permessoHours` separately
- **Month total card**: Sums all users' `regularHours + overtimeHours`

#### Examples

| Morning | Afternoon | Total | hoursWorked | overtimeHours | permessoHours (weekday) |
|---------|-----------|-------|-------------|---------------|-------------------------|
| 08:00-12:00 (4h) | 14:00-18:00 (4h) | 8h | 8 | 0 | 0 |
| 08:00-12:00 (4h) | 14:00-18:30 (4.5h) | 8.5h | 8 | 0.5 | 0 |
| 08:00-12:00 (4h) | 14:00-20:00 (6h) | 10h | 8 | 2 | 0 |
| 08:00-11:00 (3h) | 14:00-16:00 (2h) | 5h | 5 | 0 | 3 |
| 08:00-12:00 (4h) | None | 4h | 4 | 0 | 4 |

**Key Point**: The database stores hours **correctly** with this split. Display logic must always sum `hoursWorked + overtimeHours` to show total hours worked.

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
| `/api/hours` | POST | Create/update time entry (upsert by workDate) | Employees: current month only; Admins: any date |
| `/api/hours` | DELETE | Delete time entry (requires `id` param) | Employees: own entries; Admins: any entry |
| `/api/users` | GET | List all users with total hours | Admin only |
| `/api/users/create` | POST | Create new user | Admin only |
| `/api/export-csv` | POST | Export hours as CSV/ZIP (requires `month`, `userIds[]`) | Admin only |

**Query Parameter Details:**
- **GET /api/hours**:
  - `userId`: Specific user ID, or `"all"` (admin only) for all users
  - `from`: Start date (YYYY-MM-DD format)
  - `to`: End date (YYYY-MM-DD format)
  - Example: `/api/hours?userId=all&from=2025-01-01&to=2025-01-31`

**Response Format:**
- Success: `{ data: [...] }` with HTTP 200/201
- Error: `{ error: "message" }` with HTTP 400/401/403/500
- All time entries converted from Prisma Decimal to number before JSON response

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

## Database Backup System

**Automated backups via PM2 cron jobs:**
- **Daily backup**: 2:00 AM (`db-backup-cron` process)
- **Weekly cleanup**: Sundays 3:00 AM (`backup-cleanup-cron` process)
- **Retention policy**: 30 days, minimum 7 backups retained
- **Location**: `backups/database/backup_YYYYMMDD_HHMMSS.sql.gz`
- **Logs**: `logs/backup-out.log`, `logs/backup-error.log`, `logs/cleanup-out.log`

**Managing backup cron jobs:**
```bash
pm2 list                       # View all PM2 processes including cron jobs
pm2 logs db-backup-cron        # View backup job logs
pm2 restart db-backup-cron     # Force immediate backup
```

**Important**: After restoring a backup, always run `npm run prisma:deploy` to apply any missing migrations.

See [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md) for complete backup documentation.

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

scripts/
├── backup-db.sh                       # Database backup script
├── restore-db.sh                      # Database restore with safety checks
└── cleanup-backups.sh                 # Retention policy enforcement

backups/
└── database/                          # Backup files (gitignored)

logs/                                  # PM2 logs (gitignored)
├── pm2-*.log                          # Main app logs
├── backup-*.log                       # Backup cron logs
└── cleanup-*.log                      # Cleanup cron logs

types/
└── next-auth.d.ts                     # TypeScript augmentations for session
```

## Debugging Tips

**Prisma query logs**: Set `log: ["query"]` in [lib/prisma.ts](lib/prisma.ts) (dev mode) to see SQL queries in console.

**Auth session issues**: Check `session.user` shape in JWT callback ([lib/auth.ts:54-71](lib/auth.ts#L54-L71)); verify `role` is being set.

**Decimal type errors**: If seeing "cannot serialize Decimal" or similar, ensure all Decimal fields are converted to `number` before passing to client components or returning from API.

**401/403 errors in client components**: Verify `getAuthSession()` is called in API route; check `session.user.role` matches required permission level.

**Date validation failures**: Employees can only log hours for current month up to today. Check client-side validation in [employee-dashboard.tsx](components/dashboard/employee-dashboard.tsx) and server-side validation in [app/api/hours/route.ts](app/api/hours/route.ts).

## Known Limitations & Important Notes

**Time Zone Handling:**
- All dates stored as UTC midnight in database
- No time zone conversion in UI
- Application assumes single-timezone deployment
- If multi-timezone needed, requires significant refactoring

**Session Management:**
- JWT sessions cannot be invalidated server-side (logout only clears cookie)
- Role changes propagate on next JWT refresh (not immediately)
- JWT refresh queries DB to sync role changes without re-login

**Scalability:**
- Current setup: Single PM2 instance (no horizontal scaling)
- Local file backups only (no offsite redundancy)
- No caching layer (Redis, etc.)
- No database connection pooling configured
- For scaling beyond single server, consider: Redis sessions, read replicas, CDN, containerization

**Security:**
- No rate limiting on API routes (consider express-rate-limit for production)
- No Content Security Policy configured
- Setup endpoint (`/api/setup`) has no race condition handling (acceptable for one-time use)
- Session cookies use `secure: false` to support HTTP on LAN deployments

**Component Architecture:**
- Admin dashboard supports embedded employee calendar via props: `hideHeader`, `targetUserId`, `onEntrySaved`
- Large client components (679 and 1102 lines) could be split for better maintainability
- No lazy loading implemented (consider for future performance optimization)

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/timetracker`)
- `NEXTAUTH_SECRET` - Random 32+ byte string for JWT signing (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Base URL of app (e.g., `http://localhost:3000` or `http://192.168.1.100:3000` for LAN access)

**Optional (set by PM2 automatically):**
- `NODE_ENV` - Environment mode (production/development)
- `PORT` - Server port (default: 3000)
- `HOSTNAME` - Bind address (default: 0.0.0.0)

**PostgreSQL Setup:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-client

# Create database
sudo -u postgres psql
CREATE DATABASE timetracker;
CREATE USER youruser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE timetracker TO youruser;
\q

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/timetracker?schema=public"
```

## Additional Notes

**Setup flow**: When database is empty, app redirects to `/setup` where first admin account is created via [POST /api/setup](app/api/setup/route.ts).

**Export functionality**: [POST /api/export-csv](app/api/export-csv/route.ts) uses `archiver` library to create ZIP files when multiple users selected; single user returns CSV directly.

**Time calculation**: See detailed [Time Entry Calculation Logic](#time-entry-calculation-logic) section above for complete explanation of how `hoursWorked`, `overtimeHours`, and `permessoHours` are calculated and displayed.

**PM2 configuration**: [ecosystem.config.js](ecosystem.config.js) defines three processes:
- `employee-tracker`: Main Next.js app (port 3000, binds to 0.0.0.0, 1GB memory limit, auto-restart on crash)
- `db-backup-cron`: Daily database backup at 2:00 AM
- `backup-cleanup-cron`: Weekly backup retention cleanup (Sundays 3:00 AM, 30-day policy)

**Production deployment workflow:**
```bash
# 1. Install dependencies
npm install

# 2. Build application
npm run build

# 3. Apply database migrations
npm run prisma:deploy

# 4. Start with PM2 (includes main app + backup cron jobs)
npm run pm2:start

# 5. Verify all processes running
pm2 list

# 6. Monitor logs
npm run pm2:logs
```

**CSV/ZIP Export**: [POST /api/export-csv](app/api/export-csv/route.ts) uses `archiver` library. Single user exports as CSV directly; multiple users creates ZIP archive with individual CSV files per user. Filenames sanitized (non-alphanumeric replaced with underscore). Each CSV includes summary row with total hours.

## Common Troubleshooting

**"Cannot find module '@prisma/client'"**
- Run `npm run prisma:generate` after pulling schema changes
- Check that `postinstall` script ran during `npm install`

**"Error: P1001: Can't reach database server"**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env matches your database configuration
- Test connection: `psql -h localhost -U youruser -d timetracker`

**"NextAuth configuration error"**
- Ensure NEXTAUTH_SECRET is set in .env (generate with `openssl rand -base64 32`)
- Verify NEXTAUTH_URL matches your deployment URL (include port for dev)
- Check that lib/auth.ts exports authOptions correctly

**"Type error: Property 'role' does not exist on type 'Session'"**
- Ensure types/next-auth.d.ts is in TypeScript include paths
- Restart TypeScript server in VSCode (Cmd/Ctrl+Shift+P → "Restart TS Server")
- Verify tsconfig.json includes types directory

**PM2 processes not starting**
- Check logs: `pm2 logs` or `cat logs/pm2-error.log`
- Verify scripts have execute permissions: `chmod +x scripts/*.sh`
- Ensure .env file exists and is readable
- Test scripts manually: `bash scripts/backup-db.sh`

**Backup/restore failures**
- Install PostgreSQL client tools: `sudo apt-get install postgresql-client`
- Check DATABASE_URL parsing: `cat .env | grep DATABASE_URL`
- Verify database user has required privileges (CREATE, DROP, etc.)
- Ensure backups/ directory exists and is writable

**Port 3000 already in use**
- Check running processes: `lsof -i :3000` or `netstat -tulpn | grep 3000`
- Stop conflicting process or change PORT in ecosystem.config.js
- For PM2: `npm run pm2:stop` before restarting

## Best Practices for Development

**Before committing:**
```bash
npm run lint                   # Fix linting errors
npm run build                  # Ensure production build succeeds
npm run prisma:generate        # Regenerate client if schema changed
```

**When modifying Prisma schema:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate
# 3. Enter descriptive migration name
# 4. Update DTOs in affected API routes/components
# 5. Test with npm run dev
```

**When adding new API endpoint:**
1. Create route handler in `app/api/{resource}/route.ts`
2. Add Zod schema for request validation at top of file
3. Call `getAuthSession()` first, return 401 if missing
4. Implement RBAC checks based on `session.user.role`
5. Convert Prisma Decimal types to number for JSON response
6. Return consistent error format: `{ error: "message" }`
7. Test with both admin and employee accounts

**When creating new client component:**
1. Add `"use client"` directive at top of file
2. Use `useTransition()` for mutations (not useState for loading)
3. Implement AbortController for fetch cleanup on unmount
4. Store DTOs in state, never raw Prisma objects
5. Handle 401 responses by redirecting to login
6. Validate user input before API calls (Zod on client too)

**Security checklist:**
- Never commit .env file (already in .gitignore)
- Rotate NEXTAUTH_SECRET periodically in production
- Review Prisma queries for SQL injection risks (use parameterized queries)
- Validate all user input with Zod schemas
- Check RBAC at API level, not just UI level
- Use HTTPS in production (update NEXTAUTH_URL)
- Monitor logs for suspicious activity: `npm run pm2:logs`
