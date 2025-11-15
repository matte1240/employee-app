# 🕐 Employee Work Hours Tracker

A full-stack time tracking application built with **Next.js 16**, **Prisma**, **NextAuth**, and **PostgreSQL**. Employees can log their daily work hours through an interactive calendar interface, while administrators manage users and review team-wide activity from a centralized dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with NextAuth v4 and credentials provider
- **Role-based access control** (EMPLOYEE and ADMIN roles)
- **Automatic session timeout** after 30 minutes of inactivity with activity tracking
- **Password reset flow** with secure token-based email links
- **Session management** with automatic renewal for active users

### 👤 Employee Features
- **Interactive calendar interface** for logging work hours
- **Shift-based time entry** with morning and afternoon shifts (30-minute precision)
- **Automatic calculation** of regular hours (max 8h) and overtime (hours > 8)
- **Date restrictions** - can only log hours for current month up to today
- **Personal dashboard** with recent activity and quick entry form
- **Profile management** for updating personal information and password
- **Work reports** with monthly and historical data visualization

### 👨‍💼 Admin Features
- **Team overview dashboard** with total hours, overtime, and leave time
- **User management** - create, edit, delete users and reset passwords
- **Individual employee calendar view** for monitoring and editing entries
- **Excel export functionality** for selected users and date ranges
- **Server management tools** for database operations
- **Email notifications** for new user creation and password resets

### 💾 Data Management
- **PostgreSQL database** with Prisma ORM
- **Automated database backups** with retention policies
- **Database restore capabilities**
- **Migration system** for schema changes
- **Data seeding** for test accounts

### 🚀 Deployment
- **Docker Compose** setup with PostgreSQL container
- **Automated migrations** on container startup
- **Health checks** and dependency management
- **Volume persistence** for data and logs
- **Production-ready** multi-stage Dockerfile

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server Components
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript 5** - Type-safe development
- **date-fns** - Date manipulation library

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma 6.19** - Type-safe ORM
- **PostgreSQL 16** - Relational database
- **NextAuth v4** - Authentication solution
- **Zod** - Runtime schema validation

### Additional Tools
- **bcryptjs** - Password hashing
- **nodemailer** - Email sending
- **ExcelJS** - Excel file generation
- **Docker** - Containerization

---

## 📋 Prerequisites

- **Node.js** 20+ 
- **npm** 10+
- **PostgreSQL** 16+ (for local development)
- **Docker & Docker Compose** (for containerized deployment)

---

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

The fastest way to get the application running in production:

```bash
# 1. Clone the repository
git clone https://github.com/matte1240/employee-app.git
cd employee-app

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration section below)

# 3. Build and start containers
docker compose up -d --build

# 4. Access the application
open http://localhost:3001
```

The application will automatically:
- Start PostgreSQL database
- Run Prisma migrations
- Launch the Next.js application
- Configure health checks

**First-time setup**: The application will redirect to `/setup` where you can create the first admin account.

### Option 2: Automated First Deploy

For an interactive setup experience:

```bash
bash scripts/first-deploy.sh
```

This script will:
- Guide you through environment variable configuration
- Create necessary directories
- Build and start Docker containers
- Display the generated `.env` values for future reference

### Option 3: Local Development

For development without Docker:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL connection string

# 3. Generate Prisma Client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed test data (optional)
npm run prisma:seed

# 6. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

#### Test Accounts (from seed script)
- **Admin**: `admin@example.com` / `Admin123!`
- **Employee**: `employee@example.com` / `Employee123!`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# ========================================
# Application Configuration
# ========================================
APP_PORT=3001
APP_URL=http://localhost:3001

# ========================================
# Database Configuration
# ========================================
POSTGRES_USER=app
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=employee_tracker
DB_PORT=5433

# For local development (non-Docker)
DATABASE_URL=postgresql://app:your_secure_password_here@localhost:5433/employee_tracker?schema=public

# ========================================
# NextAuth Configuration
# ========================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# ========================================
# Email Configuration (Optional)
# ========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM_NAME=Work Hours Tracker

# ========================================
# Docker Configuration (Optional)
# ========================================
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=your_username
TAG=latest
```

### Important Configuration Notes

1. **NEXTAUTH_SECRET**: Generate a secure secret using:
   ```bash
   openssl rand -base64 32
   ```

2. **Database Password**: Use a strong password for production

3. **Email Configuration**: 
   - For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
   - See [EMAIL_SETUP.md](./docs/EMAIL_SETUP.md) for detailed configuration

4. **APP_URL**: Update this to your production domain when deploying

---

## 📖 Usage

### Employee Workflow

1. **Login**: Access the application and log in with your credentials
2. **Dashboard**: View your interactive calendar and recent time entries
3. **Log Hours**: 
   - Click on any date in the current month
   - Enter morning shift times (start/end)
   - Enter afternoon shift times (start/end)
   - Add optional notes
   - System automatically calculates regular hours and overtime
4. **View Reports**: Check your personal work history and statistics
5. **Update Profile**: Manage your account information and change password

### Admin Workflow

1. **Login**: Access with admin credentials
2. **Overview Dashboard**: View team-wide statistics and metrics
3. **Manage Users**:
   - Create new employees or admins
   - Edit user information
   - Reset user passwords
   - Delete users
4. **View Employee Calendars**: Monitor individual employee time entries
5. **Export Data**: Generate Excel reports for selected users and date ranges
6. **Server Management**: Access database backup and maintenance tools

---

## 🗄️ Database Schema

### Core Models

#### User
- `id`: Unique identifier
- `name`: User's full name
- `email`: Unique email address
- `passwordHash`: Bcrypt hashed password
- `role`: EMPLOYEE or ADMIN
- `tokenVersion`: For session invalidation
- `createdAt`, `updatedAt`: Timestamps

#### TimeEntry
- `id`: Unique identifier
- `userId`: Reference to User
- `workDate`: Date of work
- `hoursWorked`: Regular hours (Decimal)
- `overtimeHours`: Overtime hours (Decimal)
- `permessoHours`: Leave hours (Decimal)
- `morningStart`, `morningEnd`: Morning shift times
- `afternoonStart`, `afternoonEnd`: Afternoon shift times
- `notes`: Optional notes
- `createdAt`, `updatedAt`: Timestamps

---

## 🔌 API Documentation

### Authentication Endpoints

```
POST /api/auth/signin          - User login
POST /api/auth/signout         - User logout
GET  /api/auth/session         - Get current session
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Complete password reset
```

### Hours Management

```
GET    /api/hours              - Get time entries (with filters)
POST   /api/hours              - Create new time entry
PUT    /api/hours              - Update time entry
DELETE /api/hours              - Delete time entry
```

**Query Parameters for GET:**
- `userId`: Filter by user (admin only, use "all" for all users)
- `from`: Start date (ISO 8601 format)
- `to`: End date (ISO 8601 format)

### User Management (Admin Only)

```
GET    /api/users              - List all users with aggregated hours
POST   /api/users/create       - Create new user (sends email)
POST   /api/users/create-dev   - Create user without email
PUT    /api/users/[id]         - Update user information
DELETE /api/users/[id]         - Delete user
POST   /api/users/[id]/reset-password     - Reset password (sends email)
POST   /api/users/[id]/reset-password-dev - Reset password (returns password)
```

### Data Export

```
POST /api/export-excel         - Generate Excel report
```

### Health Check

```
GET /api/health                - Server health status
```

---

## 🐳 Docker Deployment

### Architecture

The application uses a multi-container Docker setup:

- **app**: Next.js application (port 3001)
- **postgres**: PostgreSQL 16 database (port 5433)

### Commands

```bash
# Build images
docker compose build

# Start services (detached)
docker compose up -d

# Build and start
docker compose up -d --build

# View logs
docker compose logs -f app
docker compose logs -f postgres

# Restart services
docker compose restart

# Stop services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

### Production Deployment

1. **Prepare environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and deploy**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify deployment**:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

4. **Access application**:
   - Open browser to configured APP_URL
   - Complete initial setup at `/setup`

### Docker Configuration

See [docs/DOCKER.md](./docs/DOCKER.md) for detailed Docker deployment guide.

---

## 💾 Database Management

### Migrations

```bash
# Development - create and apply migration
npm run prisma:migrate

# Production - apply migrations only
npm run prisma:deploy

# Generate Prisma Client
npm run prisma:generate
```

### Seeding

```bash
# Seed database with test users
npm run prisma:seed
```

Creates:
- Admin user: `admin@example.com` / `Admin123!`
- Employee user: `employee@example.com` / `Employee123!`

### Backup & Restore

```bash
# Create backup
npm run backup:db

# Restore from backup
npm run restore:db <backup-file>

# Clean old backups (based on retention policy)
npm run backup:cleanup
```

Backups are stored in `./backups/database/` with timestamp-based naming.

**Important**: Backup directory is in `.gitignore` and mounted as Docker volume.

See [docs/BACKUP_STRATEGY.md](./docs/BACKUP_STRATEGY.md) for complete backup documentation.

---

## 🔒 Security Features

### Session Management
- **30-minute inactivity timeout** with automatic logout
- **Activity tracking** monitors user interactions (clicks, scrolls, keyboard)
- **Automatic session renewal** every 5 minutes for active users
- **Server-side validation** ensures expired sessions cannot be used

See [docs/INACTIVITY_TIMEOUT.md](./docs/INACTIVITY_TIMEOUT.md) for implementation details.

### Authentication Security
- **Bcrypt password hashing** with secure salt rounds
- **JWT tokens** with signature verification
- **Token version tracking** for forced logout capability
- **Role-based access control** enforced at API level

### Data Protection
- **Server-side validation** with Zod schemas
- **Prisma ORM** prevents SQL injection
- **Environment variables** for sensitive configuration
- **Password reset tokens** expire after use

---

## 📁 Project Structure

```
employee-app/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── hours/            # Time entry management
│   │   ├── users/            # User management (admin)
│   │   ├── export-excel/     # Excel export
│   │   ├── health/           # Health check
│   │   ├── setup/            # Initial setup
│   │   └── db/               # Database utilities
│   ├── dashboard/            # Protected dashboards
│   ├── reset-password/       # Password reset page
│   ├── setup/                # Initial setup page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Login page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── dashboard/           # Dashboard components
│   │   ├── admin-calendar.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-overview.tsx
│   │   ├── employee-dashboard.tsx
│   │   ├── employee-profile.tsx
│   │   ├── employee-reports.tsx
│   │   ├── export-data.tsx
│   │   ├── manage-server.tsx
│   │   ├── manage-users.tsx
│   │   └── manage-users-dev.tsx
│   ├── activity-tracker.tsx  # Session activity monitor
│   ├── login-form.tsx        # Login component
│   ├── logout-button.tsx     # Logout component
│   ├── navbar.tsx            # Navigation bar
│   ├── session-provider.tsx  # NextAuth provider
│   └── setup-form.tsx        # Initial setup form
├── hooks/                    # Custom React hooks
│   └── use-activity-tracker.ts
├── lib/                      # Core utilities
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client
│   └── email.ts             # Email utilities
├── prisma/                   # Database
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seed script
│   └── migrations/          # Migration files
├── scripts/                  # Maintenance scripts
│   ├── backup-db.sh         # Database backup
│   ├── restore-db.sh        # Database restore
│   ├── cleanup-backups.sh   # Backup cleanup
│   └── first-deploy.sh      # Interactive deployment
├── docs/                     # Documentation
│   ├── BACKUP_STRATEGY.md
│   ├── CHANGELOG.md
│   ├── DOCKER.md
│   ├── EMAIL_SETUP.md
│   ├── INACTIVITY_TIMEOUT.md
│   └── ...
├── types/                    # TypeScript definitions
├── public/                   # Static assets
├── docker-compose.yml        # Docker orchestration
├── Dockerfile               # Production image
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind configuration
└── package.json             # Dependencies and scripts
```

---

## 🛠️ Development

### Available Scripts

#### Development
```bash
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Create production build
npm run start       # Start production server
npm run lint        # Run ESLint
```

#### Database
```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create and apply migration (dev)
npm run prisma:deploy    # Apply migrations (production)
npm run prisma:seed      # Seed test data
```

#### Backup & Restore
```bash
npm run backup:db        # Create database backup
npm run restore:db       # Restore from backup
npm run backup:cleanup   # Remove old backups
```

#### Docker
```bash
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View container logs
npm run docker:restart   # Restart containers
npm run docker:deploy    # Full deployment (build + start)
```

### Development Workflow

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Make changes** to code

3. **Test changes** in browser (hot reload enabled)

4. **Create database migration** (if schema changed):
   ```bash
   npm run prisma:migrate
   ```

5. **Lint code**:
   ```bash
   npm run lint
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration with TypeScript rules
- **Formatting**: Consistent with project conventions
- **Components**: Use "use client" directive for client components
- **API Routes**: Validate with Zod schemas
- **Database**: Use Prisma for all database operations

---

## 📚 Documentation

Additional documentation is available in the [`docs/`](./docs/) directory:

- **[DOCKER.md](./docs/DOCKER.md)** - Complete Docker deployment guide
- **[DOCKER_SETUP.md](./docs/DOCKER_SETUP.md)** - Docker setup summary
- **[BACKUP_STRATEGY.md](./docs/BACKUP_STRATEGY.md)** - Database backup strategy
- **[EMAIL_SETUP.md](./docs/EMAIL_SETUP.md)** - Email configuration guide
- **[INACTIVITY_TIMEOUT.md](./docs/INACTIVITY_TIMEOUT.md)** - Session timeout implementation
- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and changes
- **[GITHUB_SECRETS_EMAIL.md](./docs/GITHUB_SECRETS_EMAIL.md)** - GitHub secrets configuration
- **[CLAUDE.md](./docs/CLAUDE.md)** - AI assistant integration notes

---

## 🐛 Troubleshooting

### Common Issues

#### Cannot connect to database
**Symptom**: Application fails to start with database connection error

**Solution**:
1. Check PostgreSQL is running (Docker or local)
2. Verify `DATABASE_URL` in `.env` matches your setup
3. Ensure database exists: `createdb employee_tracker`
4. Check ports are not in use: `lsof -i :5433`

#### Session expires too quickly
**Symptom**: Getting logged out unexpectedly

**Solution**:
- Session timeout is 30 minutes of inactivity (configurable in `lib/auth.ts`)
- Activity tracker should auto-renew active sessions
- Check browser console for activity tracker errors

#### Email not sending
**Symptom**: Welcome emails or password reset emails not received

**Solution**:
1. Verify email configuration in `.env`
2. For Gmail, ensure you're using an App Password, not account password
3. Check email logs in application console
4. See [EMAIL_SETUP.md](./docs/EMAIL_SETUP.md) for detailed setup

#### Docker containers not starting
**Symptom**: `docker compose up` fails

**Solution**:
1. Check Docker daemon is running: `docker ps`
2. Verify `.env` file exists with required variables
3. Check port conflicts: `lsof -i :3001 -i :5433`
4. View logs: `docker compose logs`
5. Try rebuilding: `docker compose up -d --build`

#### Migration errors
**Symptom**: Prisma migration fails

**Solution**:
1. Check database is running and accessible
2. Ensure `DATABASE_URL` is correct
3. For production: use `npm run prisma:deploy` instead of `migrate`
4. If stuck, reset database (⚠️ loses data):
   ```bash
   docker compose down -v
   docker compose up -d
   ```

#### Build failures
**Symptom**: `npm run build` fails

**Solution**:
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Delete `.next` folder: `rm -rf .next`
3. Regenerate Prisma Client: `npx prisma generate`
4. Check TypeScript errors: `npx tsc --noEmit`

### Getting Help

If you encounter issues not covered here:

1. Check the [documentation files](./docs/) for specific feature guidance
2. Review the [CHANGELOG.md](./docs/CHANGELOG.md) for recent changes
3. Inspect application logs: `docker compose logs -f app`
4. Check database logs: `docker compose logs -f postgres`

---

## 🤝 Contributing

This is a private project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Test all changes locally before submitting
- Update documentation for new features
- Ensure Docker deployment still works

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth](https://next-auth.js.org/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Docker](https://www.docker.com/) - Containerization

---

## 📞 Support

For questions or support:
- Review the [documentation](./docs/)
- Check the [troubleshooting section](#-troubleshooting)
- Contact the project maintainer

---

**Made with ❤️ using Next.js, Prisma, and PostgreSQL**
