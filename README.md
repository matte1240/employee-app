## Work Hours Tracker

Full stack time tracking portal built with Next.js App Router, Prisma, NextAuth, and PostgreSQL. Employees can log their daily work hours on a calendar while administrators review team-wide activity from a dedicated dashboard.

### Features

- Email and password authentication backed by NextAuth and Prisma.
- Employee dashboard with interactive calendar, quick entry form, and recent activity list.
- Admin dashboard summarising total hours, last activity date, and join date for every user.
- REST API routes for logging hours and managing users, secured by session and role checks.
- Prisma schema with seed script that provisions sample admin and employee accounts.
- Docker Compose setup for local development with PostgreSQL.

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional, for container based workflows)

### Environment Variables

Copy `.env` and update values as needed. At minimum set:

- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_SECRET` (random 32 byte string)
- `NEXTAUTH_URL` (base URL of the app)

### Local Development

Install dependencies and generate the Prisma client:

```bash
npm install
npx prisma generate
```

Create the database schema and seed sample data:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Launch the Next.js development server:

```bash
npm run dev
```

Sample credentials provided by the seed script:

- Admin: `admin@example.com` / `Admin123!`
- Employee: `employee@example.com` / `Employee123!`

### Docker Workflow

Build and start PostgreSQL plus the Next.js app:

```bash
docker compose up --build
```

The `web` service runs database migrations before starting the production server on port 3000.

### Useful Scripts

- `npm run lint` - lint the project with ESLint.
- `npm run build` - create an optimised production build.
- `npm run prisma:generate` - regenerate the Prisma client.
- `npm run prisma:migrate` - run development migrations.
- `npm run prisma:deploy` - apply migrations in production environments.
- `npm run prisma:seed` - seed the database with sample users and entries.

### Project Structure

- `app/` - Next.js App Router routes, including employee and admin dashboards.
- `app/api/` - Route handlers for authentication, hours, and user management.
- `components/` - Client components for login and dashboard experiences.
- `prisma/` - Database schema and seed script.
- `docker-compose.yml` - Local services for the app and PostgreSQL.
