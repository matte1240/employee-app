# 🕐 Employee Work Hours Tracker

A modern, full-stack time tracking application built with **Next.js 16**, **React 19**, **Prisma**, **NextAuth**, and **PostgreSQL**. Designed for teams to track work hours, manage overtime, and generate reports with an intuitive calendar interface.

**⚠️ IMPORTANT:** This application runs exclusively in **Docker Compose** for production deployments.

---

## 🌟 Features

### For Employees
- 📅 **Interactive Calendar Interface** - Click any day to log work hours with visual feedback
- ⏰ **Shift Tracking** - Record morning and afternoon shifts separately (30-minute precision)
- 📊 **Automatic Calculations** - Regular hours (max 8h/day), overtime, and permission hours computed automatically
- 📝 **Notes & Details** - Add contextual information for each workday
- 🔒 **Personal Dashboard** - View only your own time entries
- 📈 **Activity Reports** - Track personal metrics and trends
- **Time Restrictions** - Can only log hours for current month up to today (enforced server-side)

### For Administrators
- 👥 **Team Overview** - Real-time view of all employee hours, overtime, and totals
- 📋 **User Management** - Create, edit, and manage employee accounts
- 📊 **Advanced Reports** - Filter by user, date range, export to Excel
- 📥 **Data Export** - Generate Excel reports for payroll and analytics
- 🔑 **Role-Based Access** - Full control over team data and settings
- 🔐 **Password Management** - Reset employee passwords and manage credentials

### General
- 🔐 **NextAuth v4 Security** - Credential-based authentication with bcryptjs hashing
- ⏱️ **Auto Logout** - 30-minute inactivity timeout for security
- 🎨 **Tailwind CSS v4** - Modern, responsive UI with smooth animations
- 📱 **Mobile-Friendly** - Works seamlessly on desktop, tablet, and mobile
- 🐳 **Docker Ready** - Complete containerization with PostgreSQL and volumes

---

## 🏗️ Architecture

### Tech Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Next.js App Router | 16.0.3 |
| **UI Library** | React | 19.2.0 |
| **Styling** | Tailwind CSS | v4 |
| **Database** | PostgreSQL | 16 (Alpine) |
| **ORM** | Prisma | 6.19.0 |
| **Authentication** | NextAuth.js | 4.24.13 |
| **Validation** | Zod | 4.1.12 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Reports** | ExcelJS | 4.4.0 |
| **Runtime** | Node.js | 20 (Alpine) |

### Data Model
```
User (id, email, passwordHash, role, name, image, tokenVersion, createdAt, updatedAt)
  ├── TimeEntry (workDate, hoursWorked, overtimeHours, permessoHours, shifts, notes)
  ├── Account (OAuth/NextAuth adapter)
  ├── Session (NextAuth sessions)
  └── VerificationToken (password resets)
```

### Deployment Architecture
```
┌─────────────────────────────────────────────┐
│   Docker Compose (docker-compose.yml)      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │   Next.js App    │  │   PostgreSQL   │  │
│  │  (port 3001)     │  │   (port 5433)  │  │
│  │                  │  │                │  │
│  │  - Server: Node  │  │  - Data        │  │
│  │  - API routes    │  │  - Backups     │  │
│  │  - Frontend SSR  │  │  - Volumes     │  │
│  └──────────────────┘  └────────────────┘  │
│          │                     │            │
│          └─────────────────────┘            │
│      (DATABASE_URL connection)              │
│                                             │
│  Volumes:                                   │
│  - postgres_data (DB persistence)           │
│  - ./backups (Database backups)             │
│  - ./logs (Application logs)                │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- Docker (20.10+)
- Docker Compose (2.0+)
- 2GB+ free RAM
- Internet connection (for pulling images)

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/employee-app.git
cd employee-app

# Copy environment template
cp .env.example .env

# Edit configuration (secrets, database credentials)
nano .env
```

### 2. Start the Application

```bash
# Build images and start containers (first time)
docker compose up -d --build

# On subsequent runs
docker compose up -d

# View logs
docker compose logs -f app

# Stop containers
docker compose down
```

### 3. Access the Application

- **URL**: http://localhost:3001
- **Default Admin**: `admin@example.com` / `Admin123!`
- **Default Employee**: `employee@example.com` / `Employee123!`

---

## 🔧 Environment Configuration

### `.env` File (Usato per Sviluppo E Docker)

**Database Configuration:**
```env
# PostgreSQL
POSTGRES_USER=app
POSTGRES_PASSWORD=SecureDockerPassword123
POSTGRES_DB=employee_tracker
DB_PORT=5433
```

**Application Configuration:**
```env
# NextAuth & Security
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NODE_ENV=production
APP_URL=http://localhost:3001
```

**Email Configuration (Optional):**
```env
# SMTP for password resets and notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Time Tracker
```

**Ports:**
```env
APP_PORT=3001        # Next.js app port
DB_PORT=5433         # PostgreSQL port
```

### Generate NEXTAUTH_SECRET

```bash
# Generate a secure random secret
openssl rand -base64 32
```

---

## 📊 Common Tasks

### View Application Logs
```bash
# Real-time logs
docker compose logs -f app

# Database logs
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100 app
```

### Database Management

#### Create a Database Backup
```bash
docker compose exec postgres pg_dump \
  -U app \
  -d employee_tracker \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

#### Restore from Backup
```bash
docker compose exec -T postgres psql \
  -U app \
  -d employee_tracker \
  < backup-20250115-120000.sql
```

#### Access PostgreSQL CLI
```bash
docker compose exec postgres psql -U app -d employee_tracker
```

### Container Management

```bash
# Restart services
docker compose restart

# Restart specific service
docker compose restart app

# Stop all containers
docker compose down

# Stop and remove all data (WARNING: data loss)
docker compose down -v

# Remove unused resources
docker system prune -a --volumes
```

### View Running Containers
```bash
docker compose ps
```

---

## 🔐 Role-Based Access Control (RBAC)

### Employee Permissions
- ✅ View/edit own time entries only
- ✅ Log hours for current month up to today
- ✅ View personal dashboard and reports
- ✅ Export personal data
- ❌ Access admin functions
- ❌ View other employees' data
- ❌ Manage users

### Admin Permissions
- ✅ View all time entries (all employees)
- ✅ Create/edit/delete user accounts
- ✅ Reset employee passwords
- ✅ Generate team reports and export data
- ✅ Access system settings
- ✅ View all user activity

### Date Restrictions (Enforced Server-Side)
```
✅ Allowed:  Current month entries (01 to today)
❌ Blocked:  Future dates
❌ Blocked:  Previous months
❌ Blocked:  Cross-user access (for employees)
```

---

## 📡 API Endpoints

All endpoints require authentication. Responses use JSON format.

### Authentication
- `POST /api/auth/signin` - Login with email/password
- `POST /api/auth/callback/credentials` - Credential submission
- `POST /api/auth/session` - Get current session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Time Entries
- `GET /api/hours` - Get time entries (filtered by role)
- `POST /api/hours` - Create/update time entry
- `GET /api/hours?userId=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD` - Query with filters (admin only)

### Users (Admin Only)
- `GET /api/users` - List all users with totals
- `POST /api/users/create` - Create new user
- `GET /api/users/[id]` - Get user details
- `POST /api/users/[id]/reset-password` - Reset user password

### Data Export
- `POST /api/export-excel` - Generate Excel report

### System
- `GET /api/health` - Health check
- `GET /api/setup` - Check if setup is needed

---

## 📂 Project Structure

```
employee-app/
├── app/
│   ├── api/                          # API routes
│   │   ├── auth/[...nextauth]/       # NextAuth handlers
│   │   ├── hours/                    # Time entry CRUD
│   │   ├── users/                    # User management
│   │   ├── export-excel/             # Report generation
│   │   ├── db/                       # Database operations
│   │   └── health/                   # Health checks
│   ├── dashboard/                    # Protected pages
│   │   ├── page.tsx                  # Main dashboard (role-based)
│   │   ├── calendar/                 # Calendar view
│   │   ├── reports/                  # Reports
│   │   ├── users/                    # User management (admin)
│   │   ├── profile/                  # User profile
│   │   └── manage-server/            # System settings
│   ├── page.tsx                      # Login page
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
│
├── components/
│   ├── dashboard/
│   │   ├── employee-dashboard.tsx    # Calendar & time entry UI
│   │   ├── admin-dashboard.tsx       # Team overview
│   │   ├── manage-users.tsx          # User admin
│   │   └── export-data.tsx           # Export functionality
│   ├── login-form.tsx
│   ├── navbar.tsx
│   └── session-provider.tsx
│
├── lib/
│   ├── auth.ts                       # NextAuth config & JWT
│   ├── email.ts                      # Email service
│   └── prisma.ts                     # Prisma singleton
│
├── prisma/
│   ├── schema.prisma                 # Data models
│   ├── seed.ts                       # Database seeding
│   └── migrations/                   # Prisma migrations
│
├── public/                           # Static assets
├── types/
│   └── next-auth.d.ts               # NextAuth type augmentation
│
├── docker-compose.yml               # Docker configuration
├── Dockerfile                       # Multi-stage build
├── .env.example                     # Development environment template
├── .env.production.example          # Production environment template
├── next.config.ts                   # Next.js config
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind config
├── package.json                     # Dependencies
└── README.md                        # This file
```

---

## 🛠️ Development (Local Setup)

For development without Docker:

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with local database URL

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed sample data
npm run prisma:seed

# Start development server
npm run dev
```

Development server runs on http://localhost:3000

---

## 📝 Available NPM Scripts

```bash
# Development
npm run dev              # Start dev server (hot reload)
npm run build            # Production build
npm start                # Start production server

# Database
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run dev migrations
npm run prisma:deploy    # Apply migrations in production
npm run prisma:seed      # Populate test data

# Code Quality
npm run lint             # Run ESLint

# Docker (custom scripts in package.json)
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:restart   # Restart containers
npm run docker:logs      # View logs
npm run docker:deploy    # Build & start (full deployment)
```

---

## 🔑 Key Features Explained

### 1. Calendar Time Entry System
- Employees click any date in the current month to open a modal
- Input morning shift (start/end) and afternoon shift (start/end)
- Hours automatically calculated: regular (max 8h) + overtime
- All changes immediately saved to database
- Visual indicators for days with entries

### 2. Session Management
- **Strategy**: JWT (JSON Web Tokens) with server-side validation
- **Duration**: 30 minutes of inactivity = auto logout
- **Tokens**: Include user ID, role, and tokenVersion for security
- **Invalidation**: Password changes increment tokenVersion to revoke all active sessions

### 3. Authentication Flow
```
Login Form
    ↓
Credentials → NextAuth Provider
    ↓
bcryptjs Compare with passwordHash
    ↓
JWT Token Generated (user + role)
    ↓
Session Stored (browser cookie + server)
    ↓
Dashboard (role-based routing)
```

### 4. Report Generation
- **Monthly Reports**: Filter by user and date range
- **Excel Export**: Multi-sheet workbooks with formatting
- **Data Included**: All shifts, hours, overtime, notes
- **Admin Only**: Can export for any user or all users

### 5. Email System (Optional)
- Password reset links sent via SMTP
- Configurable email templates
- Uses Nodemailer for SMTP integration
- Requires environment variables for Gmail/other providers

---

## 🐳 Docker Volumes & Persistence

### `postgres_data`
- **Purpose**: PostgreSQL data persistence
- **Location**: `/var/lib/postgresql/data` (container)
- **Backed up**: Automatic backups in `./backups/database/`
- **Survival**: Persists across container restarts
- **Reset**: `docker compose down -v` (WARNING: deletes data)

### `./backups/database/`
- **Purpose**: Database backup directory
- **Format**: SQL dumps (`.sql` files)
- **Cleanup**: Remove old backups manually to save space
- **Restore**: Use `psql` or restore endpoint

### `./logs/`
- **Purpose**: Application logs
- **Format**: Structured JSON logs (if configured)
- **Cleanup**: Rotate logs manually for large deployments

---

## ⚠️ Important Notes

### Production Deployment
1. **Never** expose `.env.docker` in version control
2. **Generate** a strong NEXTAUTH_SECRET with `openssl rand -base64 32`
3. **Use** HTTPS in production (configure reverse proxy like Nginx)
4. **Set** `NEXTAUTH_URL` to your production domain
5. **Backup** database regularly with automated scripts
6. **Monitor** logs: `docker compose logs -f`

### Security Best Practices
- ✅ Use strong passwords for database and NextAuth
- ✅ Keep Docker images updated: `docker pull postgres:16-alpine`
- ✅ Use environment variables for all secrets
- ✅ Enable firewall rules (restrict DB port access)
- ✅ Implement SSL/TLS with reverse proxy
- ❌ Never hardcode secrets in code
- ❌ Never disable authentication
- ❌ Never expose database ports publicly

### Performance Tips
- Database indexed on `(userId, workDate)` for fast queries
- Session timeout configured at 30 minutes
- Prisma uses connection pooling
- Next.js builds with `output: 'standalone'` for small Docker image
- Consider Redis cache for high-traffic deployments

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs app postgres

# Verify database is healthy
docker compose ps

# Restart everything
docker compose down
docker compose up -d --build
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker compose exec postgres pg_isready -U app

# Verify DATABASE_URL in .env.docker
# Format: postgresql://app:password@postgres:5432/employee_tracker
```

### Migrations Failed
```bash
# Run migrations manually
docker compose exec app npx prisma migrate deploy

# Check migration status
docker compose exec app npx prisma migrate status
```

### Forgot Admin Password
```bash
# Access the database
docker compose exec postgres psql -U app -d employee_tracker

# Run SQL reset
UPDATE "User" SET "passwordHash" = '$2a$10$...' WHERE "email" = 'admin@example.com';
```

### Port Already in Use
```bash
# Change ports in .env.docker
APP_PORT=3002
DB_PORT=5434

# Then restart
docker compose down
docker compose up -d
```

---

## 🌐 Deployment to Servers

### Overview

L'applicazione supporta **deployment automatico** su due server separati:

- **🟡 Staging Server**: Ambiente di test per validare nuove funzionalità
- **🟢 Production Server**: Ambiente di produzione per gli utenti finali

### Deployment Workflow

```
Developer → dev branch → Push
                ↓
         GitHub Actions
                ↓
         Build Docker :dev
                ↓
         Test Locally
                ↓
    Merge dev → staging → Push
                ↓
    🟡 Auto Deploy to Staging Server
                ↓
         Test on Staging
                ↓
    Merge staging → main → Push
                ↓
    🟢 Auto Deploy to Production Server
```

### Quick Setup

#### 1. Setup Servers

Run the automated setup script on both servers:

```bash
# On staging server
wget https://raw.githubusercontent.com/matte1240/employee-app/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh staging

# On production server
wget https://raw.githubusercontent.com/matte1240/employee-app/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh production
```

#### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

**Staging Secrets:**
- `STAGING_HOST` - Server hostname (e.g., `staging.example.com`)
- `STAGING_USER` - SSH username
- `STAGING_SSH_KEY` - SSH private key
- `STAGING_PORT` - SSH port (default: 22)
- `STAGING_APP_DIR` - App directory (default: `/opt/employee-app`)

**Production Secrets:**
- `PRODUCTION_HOST` - Server hostname
- `PRODUCTION_USER` - SSH username
- `PRODUCTION_SSH_KEY` - SSH private key
- `PRODUCTION_PORT` - SSH port (default: 22)
- `PRODUCTION_APP_DIR` - App directory (default: `/opt/employee-app`)

#### 3. Deploy Workflow

```bash
# Development
git checkout dev
# ... make changes ...
git push origin dev  # Builds :dev image

# Staging deployment
git checkout staging
git merge dev
git push origin staging  # ⚡ Auto-deploys to staging server!

# Production deployment (after staging tests pass)
git checkout main
git merge staging
git push origin main  # ⚡ Auto-deploys to production server!
```

### What Happens During Deployment

**Staging Deployment (automatic on push to `staging`):**
1. Build Docker image with `:staging` tag
2. Push to GitHub Container Registry
3. SSH to staging server
4. Pull latest code from `staging` branch
5. Pull Docker image `:staging`
6. Restart containers with zero-downtime
7. Health check validation
8. Cleanup old images

**Production Deployment (automatic on push to `main`):**
1. **Automatic database backup** before deployment
2. Build Docker image with `:main` tag
3. Push to GitHub Container Registry
4. SSH to production server
5. Pull latest code from `main` branch
6. Apply Prisma migrations
7. Pull Docker image `:main`
8. Rolling update with zero-downtime
9. Health check validation
10. Cleanup old images

### Manual Deployment (Emergency)

If automated deployment fails:

```bash
# SSH to the server
ssh user@your-server.com

# Navigate to app directory
cd /opt/employee-app

# Pull latest changes
git pull origin main  # or staging

# Pull Docker image
docker compose pull

# Restart containers
docker compose down && docker compose up -d

# Check logs
docker compose logs -f
```

### Monitoring Deployments

- **GitHub Actions**: https://github.com/matte1240/employee-app/actions
- **Staging Health**: `https://staging.example.com/api/health`
- **Production Health**: `https://production.example.com/api/health`

**📖 Complete deployment guide:** See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed setup instructions, SSH configuration, troubleshooting, and rollback procedures.

---

## 🚢 Creating Releases

### Quick Release Steps

```bash
# 1. Ensure main branch is deployed and tested
git checkout main
git pull origin main

# 2. Create a version tag (semantic versioning)
git tag -a v1.0.0 -m "Release v1.0.0: Description"

# 3. Push the tag to trigger GitHub Actions
git push origin v1.0.0
```

GitHub Actions will automatically:
- ✅ Build Docker images for multiple platforms (amd64, arm64)
- ✅ Push to GitHub Container Registry (ghcr.io) with `:1.0.0` and `:latest` tags
- ✅ Create GitHub Release with auto-generated changelog
- ✅ Attach release notes and artifacts

### Using Released Images

After a release, update your `docker-compose.yml`:

```yaml
services:
  app:
    # Use specific version (recommended for production)
    image: ghcr.io/matte1240/employee-app:1.0.0
    
    # Or use latest stable
    image: ghcr.io/matte1240/employee-app:latest
```

**📖 Full documentation:** See [docs/RELEASE_GUIDE.md](docs/RELEASE_GUIDE.md) for complete release workflow, semantic versioning, and troubleshooting.

---

## 📞 Support & Documentation

### Additional Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Docker Documentation](https://docs.docker.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Project Documentation
See `docs/` folder for additional guides:
- **DEPLOYMENT_GUIDE.md** - Complete server setup and deployment guide
- **BRANCHING_STRATEGY.md** - Git workflow and deployment strategy
- **RELEASE_GUIDE.md** - How to create GitHub releases
- **DOCKER.md** - Detailed Docker configuration
- **BACKUP_STRATEGY.md** - Database backup procedures
- **EMAIL_SETUP.md** - Email configuration guide
- **INACTIVITY_TIMEOUT.md** - Session timeout details
- **CHANGELOG.md** - Version history and updates

---

## 📄 License

This project is private. Do not distribute without permission.

---

## 👤 Author

**Matteo** - [GitHub](https://github.com/matte1240)

---

## 🎯 Roadmap

- [ ] Two-factor authentication (2FA)
- [ ] Attendance alerts for missing days
- [ ] Mobile app (React Native)
- [ ] Integration with payroll systems
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Time tracking with desktop app

---

**Last Updated**: November 2025 | **Version**: 1.0.0 | **Docker Compose**: Production-Ready ✅
