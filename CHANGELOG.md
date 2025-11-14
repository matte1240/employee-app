# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> **Note**: For complete documentation on the new route structure and layout architecture, see the [CLAUDE.md](CLAUDE.md) file, specifically the "Application Routes & Navigation" section.

### Added
- Custom scrollbar hiding CSS for all browsers (Firefox, Chrome, Safari, IE/Edge)
- Consistent page layout with `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8` wrapper across all dashboard pages
- Centralized employee pages under `/dashboard` structure:
  - `/dashboard/employee-reports` - View and export personal work hours
  - `/dashboard/profile` - User profile and password management

### Changed
- **BREAKING**: Reorganized employee routes structure
  - Removed `/calendar` page (functionality already in `/dashboard`)
  - Moved `/reports` → `/dashboard/employee-reports`
  - Moved `/profile` → `/dashboard/profile`
- Updated Navbar component with new employee navigation links
- Improved layout consistency across all pages:
  - `components/dashboard/export-data.tsx` - Added container wrapper
  - `components/dashboard/manage-users.tsx` - Added container wrapper
  - `components/dashboard/admin-dashboard.tsx` - Removed duplicate header/main tags, streamlined layout
  - `app/dashboard/page.tsx` - Added wrapper for employee dashboard
- All dashboard pages now use shared layout with Navbar and consistent spacing

### Fixed
- Layout shift between pages with different content heights
- Duplicate header/main tags in AdminDashboard component causing layout conflicts
- Inconsistent padding and max-width across dashboard pages
- Employee navigation not properly reflecting new route structure

### Removed
- `/app/calendar` directory - Duplicate of dashboard calendar functionality
- Custom import of `LogoutButton` from `admin-dashboard.tsx` (no longer needed)
- Custom scrollbar styling (reverted to hidden scrollbar)

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
/dashboard         → Admin overview (user statistics)
/dashboard/admin   → Full admin dashboard with tabs
/dashboard/users   → User management
/dashboard/calendar → User calendar view
/dashboard/reports → Data export for all users
```

### Layout Improvements

All dashboard pages now follow consistent structure:
1. Shared layout (`app/dashboard/layout.tsx`) provides:
   - Authentication check and redirect
   - Navbar component with role-based navigation
   - Background gradient (`from-gray-50 to-blue-50`)
2. Page-level wrapper with standard container classes
3. Component-level content with proper spacing

---

## Previous Versions

### Initial Release
- Full-stack time tracking application
- Employee time entry with calendar interface
- Admin dashboard with user management
- Excel export functionality
- PostgreSQL database with Prisma ORM
- NextAuth authentication with JWT
