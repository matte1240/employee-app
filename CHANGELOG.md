# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased - Dev Branch]

### 🎯 Major Features

#### Email System Integration
- **NEW**: Complete email functionality with nodemailer integration
  - Welcome emails for new users with temporary credentials
  - Password reset flow with secure token-based links
  - HTML templates with professional styling
  - Support for Gmail SMTP (configurable)
  - Email verification system
- **NEW**: Password reset endpoints:
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/reset-password` - Complete password reset with token
  - `app/reset-password/page.tsx` - User-facing reset password page
- **NEW**: Documentation files:
  - `EMAIL_SETUP.md` - Complete email configuration guide
  - `GITHUB_SECRETS_EMAIL.md` - GitHub Actions secrets setup

#### User Management Enhancement
- **NEW**: Dual user management system:
  - `dashboard/users` - Production user management with email integration
  - `dashboard/users-dev` - Development mode (no email requirements)
- **NEW**: Create user endpoints:
  - `/api/users/create` - Production mode (sends welcome email)
  - `/api/users/create-dev` - Development mode (no email)
- **NEW**: Reset password endpoints:
  - `/api/users/[id]/reset-password` - Production (sends email)
  - `/api/users/[id]/reset-password-dev` - Development (returns password)
- **NEW**: Complete user management UI:
  - `components/dashboard/manage-users.tsx` - Production interface
  - `components/dashboard/manage-users-dev.tsx` - Development interface
  - Create, edit, delete, and reset password functionalities
  - Role-based user filtering and search
  - Responsive table design with mobile support

#### Session & Security Management
- **NEW**: Automatic inactivity timeout (30 minutes)
  - `hooks/use-activity-tracker.ts` - Custom React hook for activity tracking
  - `components/activity-tracker.tsx` - Global activity tracker component
  - Tracks mouse, keyboard, scroll, and touch events
  - Automatic session extension for active users
  - Alert and redirect on session expiration
  - `INACTIVITY_TIMEOUT.md` - Complete implementation documentation
- **ENHANCED**: Session management in `lib/auth.ts`:
  - JWT callback with activity timestamp tracking
  - Session callback with role enrichment
  - Automatic token refresh on user activity

#### Navigation & UI Improvements
- **NEW**: Responsive Navbar component (`components/navbar.tsx`):
  - Mobile-first design with hamburger menu
  - Role-based navigation (Admin vs Employee)
  - Active route highlighting
  - User info dropdown with logout
  - Smooth animations and transitions
  - Sticky positioning for easy access
  - Support for keyboard navigation (ESC to close)
- **NEW**: Enhanced login form (`components/login-form.tsx`):
  - Password visibility toggle
  - "Forgot Password?" link
  - Improved error messaging
  - Better mobile responsiveness
  - Session expiration detection
- **NEW**: Employee dashboard pages:
  - `/dashboard/employee-reports` - Personal work hours reports
  - `/dashboard/profile` - User profile and password management
  - `/dashboard/calendar` - Admin calendar view

### 🎨 UI/UX Enhancements

#### Modal & Layout Improvements
- Enhanced modal styling with improved responsiveness
- Modal scroll locking when open
- Better layout structure across all dashboard pages
- Consistent page wrapper: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8`
- Custom scrollbar hiding for cleaner UI
- Gradient backgrounds: `from-gray-50 to-blue-50`

#### Component Enhancements
- `components/dashboard/admin-calendar.tsx` - New admin calendar component
- `components/dashboard/admin-overview.tsx` - Enhanced admin overview with stats
- `components/dashboard/admin-dashboard.tsx` - Streamlined layout
- `components/dashboard/employee-dashboard.tsx` - Enhanced employee interface
- `components/dashboard/employee-profile.tsx` - Complete profile management
- `components/dashboard/employee-reports.tsx` - Comprehensive reporting interface
- `components/dashboard/export-data.tsx` - Data export functionality

### 🔧 Technical Improvements

#### Dependencies
- **Added**: `nodemailer@^7.0.10` - Email sending
- **Added**: `@types/nodemailer@^7.0.3` - TypeScript types
- **Removed**: `yarn.lock` - Switched to npm

#### API Enhancements
- Enhanced `/api/hours` with additional filtering options
- Improved error handling across all API routes
- Better Zod validation schemas
- Consistent response formatting

#### Deployment & CI/CD
- Updated GitHub Actions workflows:
  - `.github/workflows/deploy-production.yml`
  - `.github/workflows/deploy-staging.yml`
- Better environment variable handling
- Improved build and deployment processes

### 📚 Documentation
- **NEW**: `EMAIL_SETUP.md` - Complete email configuration guide
- **NEW**: `GITHUB_SECRETS_EMAIL.md` - GitHub secrets configuration
- **NEW**: `INACTIVITY_TIMEOUT.md` - Session timeout implementation details
- **ENHANCED**: `CLAUDE.md` - Updated with new features and patterns
- **ENHANCED**: `README.md` - Added email and session management info

### 🐛 Bug Fixes
- Fixed layout shift between pages with different content heights
- Fixed duplicate header/main tags in AdminDashboard
- Fixed inconsistent padding and max-width across pages
- Fixed employee navigation routing issues
- Fixed session persistence issues
- Fixed mobile menu scroll behavior

### 🔄 Changed
- **BREAKING**: Reorganized employee routes structure
  - Removed standalone `/calendar` page
  - Moved `/reports` → `/dashboard/employee-reports`
  - Moved `/profile` → `/dashboard/profile`
- Updated user role display and translations
- Improved session provider with activity tracking
- Enhanced logout button with better UX

### 🗑️ Removed
- `/app/calendar` directory (duplicate functionality)
- `yarn.lock` (switched to npm)
- Custom scrollbar styling (reverted to hidden)
- Unused LogoutButton imports- `yarn.lock` (switched to npm)
- Custom scrollbar styling (reverted to hidden)
- Unused LogoutButton imports

---

## Project Structure Changes

### New Route Organization

**Employee Routes:**
```
/dashboard                    → Employee dashboard (calendar + stats)
/dashboard/employee-reports   → Personal reports and export
/dashboard/profile           → User profile management
```

**Admin Routes:**
```
/dashboard              → Admin overview (user statistics)
/dashboard/admin        → Full admin dashboard with tabs
/dashboard/users        → User management (production)
/dashboard/users-dev    → User management (development)
/dashboard/calendar     → User calendar view
/dashboard/reports      → Data export for all users
```

### New Components

**Authentication & Session:**
- `components/activity-tracker.tsx` - Global activity tracking
- `components/session-provider.tsx` - Enhanced session provider
- `hooks/use-activity-tracker.ts` - Activity tracking hook

**Navigation:**
- `components/navbar.tsx` - Responsive navigation with role-based menus
- `components/login-form.tsx` - Enhanced login with password reset

**Admin Components:**
- `components/dashboard/admin-calendar.tsx` - Admin calendar view
- `components/dashboard/admin-overview.tsx` - Statistics overview
- `components/dashboard/manage-users.tsx` - Production user management
- `components/dashboard/manage-users-dev.tsx` - Development user management
- `components/dashboard/export-data.tsx` - Data export interface

**Employee Components:**
- `components/dashboard/employee-dashboard.tsx` - Enhanced employee dashboard
- `components/dashboard/employee-profile.tsx` - Profile management
- `components/dashboard/employee-reports.tsx` - Personal reports

### New API Endpoints

**Authentication & Password Reset:**
```
POST /api/auth/forgot-password          - Request password reset
POST /api/auth/reset-password           - Complete password reset
```

**User Management:**
```
POST /api/users/create                  - Create user (production)
POST /api/users/create-dev              - Create user (development)
POST /api/users/[id]/reset-password     - Reset password (production)
POST /api/users/[id]/reset-password-dev - Reset password (development)
```

### New Library Modules

- `lib/email.ts` - Complete email service with templates:
  - `verifyEmailConnection()` - Test SMTP connection
  - `sendWelcomeEmail()` - Send credentials to new users
  - `sendPasswordResetEmail()` - Send password reset link
  - `sendPasswordChangedNotification()` - Confirm password change

### Layout Improvements

All dashboard pages now follow consistent structure:
1. **Shared layout** (`app/dashboard/layout.tsx`) provides:
   - Authentication check and redirect
   - Navbar component with role-based navigation
   - Activity tracking for session timeout
   - Background gradient (`from-gray-50 to-blue-50`)
2. **Page-level wrapper** with standard container classes
3. **Component-level content** with proper spacing

### Environment Variables

New required variables for email functionality:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Time Tracker

# Required for password reset links
NEXTAUTH_URL=https://your-domain.com
```

---

## Migration Guide (main → dev)

### For Developers

1. **Install new dependencies:**
   ```bash
   npm install
   ```

2. **Configure email (optional for dev):**
   - See `EMAIL_SETUP.md` for Gmail setup
   - Use `-dev` endpoints if email not configured

3. **Update environment variables:**
   - Add `EMAIL_*` variables for production
   - Ensure `NEXTAUTH_URL` is set

4. **Test new features:**
   - Try the inactivity timeout (30 min)
   - Test responsive navbar on mobile
   - Try password reset flow

### For Production Deployment

1. **Set GitHub Secrets:**
   - Follow `GITHUB_SECRETS_EMAIL.md`
   - Add all `EMAIL_*` variables

2. **Database:**
   - No migrations required (schema unchanged)

3. **PM2:**
   - Restart with `npm run pm2:restart`
   - Monitor logs: `npm run pm2:logs`

---

## Commit History (main → dev)

- `fb27724` - feat: enhance modal styling for improved layout and responsiveness
- `6841e7b` - feat: improve modal layout and styling for enhanced user experience
- `c49f690` - feat: add modal scroll locking and improve modal layout
- `207ecc5` - feat: add email functionality and DEV user management
- `07fba6c` - feat: update user role display and translations
- `02d1bd8` - feat: implement automatic session timeout after 30 minutes
- `fb7ce51` - feat: enhance application structure and navigation
- `e4037f0` - feat: implement user management dashboard

---

## Previous Versions

### Initial Release
- Full-stack time tracking application
- Employee time entry with calendar interface
- Admin dashboard with user management
- Excel export functionality
- PostgreSQL database with Prisma ORM
- NextAuth authentication with JWT
