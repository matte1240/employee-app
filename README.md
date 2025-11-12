## Work Hours Tracker

Full stack time tracking portal built with Next.js App Router, Prisma, NextAuth, and PostgreSQL. Employees can log their daily work hours on a calendar while administrators review team-wide activity from a dedicated dashboard.

### Features

- Email and password authentication backed by NextAuth and Prisma.
- Employee dashboard with interactive calendar, quick entry form, and recent activity list.
- Admin dashboard summarising total hours, last activity date, and join date for every user.
- REST API routes for logging hours and managing users, secured by session and role checks.
- Prisma schema with seed script that provisions sample admin and employee accounts.
- PM2 process manager for production deployment with automatic restart and monitoring.

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (running as a service)

### Environment Variables

Copy `.env` and update values as needed. At minimum set:

- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_SECRET` (random 32 byte string)
- `NEXTAUTH_URL` (base URL of the app)

### Local Development

1. **Install dependencies and generate the Prisma client:**

```bash
npm install
npx prisma generate
```

2. **Create the database schema and seed sample data:**

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

3. **Launch the Next.js development server:**

```bash
npm run dev
```

Sample credentials provided by the seed script:

- Admin: `admin@example.com` / `Admin123!`
- Employee: `employee@example.com` / `Employee123!`

### Production Deployment

1. **Build the application:**

```bash
npm run build
```

2. **Apply database migrations:**

```bash
npm run prisma:deploy
```

3. **Start with PM2:**

```bash
npm run pm2:start
```

4. **Manage the application:**

```bash
npm run pm2:logs      # View application logs
npm run pm2:monit     # Monitor resources in real-time
npm run pm2:restart   # Restart the application
npm run pm2:stop      # Stop the application
npm run pm2:delete    # Remove from PM2
```

PM2 configuration is in `ecosystem.config.js`. The app runs on port 3000 by default with automatic restart on crashes and memory limit of 1GB.

### Useful Scripts

**Development:**
- `npm run dev` - start development server.
- `npm run lint` - lint the project with ESLint.

**Database:**
- `npm run prisma:generate` - regenerate the Prisma client.
- `npm run prisma:migrate` - run development migrations.
- `npm run prisma:deploy` - apply migrations in production environments.
- `npm run prisma:seed` - seed the database with sample users and entries.

**Production:**
- `npm run build` - create an optimised production build.
- `npm run pm2:start` - start application with PM2.
- `npm run pm2:stop` - stop the PM2 process.
- `npm run pm2:restart` - restart the application.
- `npm run pm2:logs` - view application logs.
- `npm run pm2:monit` - monitor resources in real-time.
- `npm run pm2:delete` - remove application from PM2.

### Project Structure

- `app/` - Next.js App Router routes, including employee and admin dashboards.
- `app/api/` - Route handlers for authentication, hours, and user management.
- `components/` - Client components for login and dashboard experiences.
- `prisma/` - Database schema and seed script.
- `ecosystem.config.js` - PM2 configuration for production deployment.
- `logs/` - PM2 application logs (gitignored).
