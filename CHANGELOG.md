# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Working Schedule Management**: Per-user, per-day working schedule configuration
  - Custom start/end times for morning and afternoon shifts
  - Sunday work permission flag (`canWorkSunday`)
  - Manual hours mode (`useManualHours`) to bypass automatic calculations
  - UI component for admin schedule editing
- **Leave Request System**: Complete workflow for employee leave management
  - Request types: Vacation, Sickness, Permission, Permesso 104, Paternity Leave
  - Approval/rejection flow for administrators
  - Google Calendar integration for approved requests
  - Email notifications for status updates
- **Enhanced Time Entry Types**:
  - Permesso 104 hours tracking (`permesso104Hours`)
  - Paternity leave hours tracking (`paternityHours`)
  - Medical certificate attachment support
- **Progressive Web App (PWA)**: Installable app with offline support
  - Manifest configuration with app icons
  - Service worker for offline functionality
  - Optimized caching strategy
- **Automated Database Backup System**:
  - Scheduled PostgreSQL backups via cron
  - Backup storage in `/backups/database/`
  - Email notifications for backup status
  - Health check endpoint `/api/health`
- **Activity Tracking & Session Management**:
  - Automatic session timeout after 30 minutes of inactivity
  - Activity detection (mouse, keyboard, scroll, touch)
  - Session extension for active users
  - Auto-logout with warning notifications

### Changed
- **Component Naming**: Renamed for clarity and consistency
  - `calendar.tsx` → `timesheet-calendar.tsx`
  - `export-data.tsx` → `admin-reports.tsx`
  - `employee-reports.tsx` → `user-reports.tsx`
- **Favicon**: Updated to use `logo40.svg` with transparent background
- **Holiday Handling**: Fixed timezone issues in holiday calculations

### Fixed
- Docker deployment: Next.js binding to `0.0.0.0` to prevent bad gateway errors
- PostgreSQL image downgrade from v17 to v16 for compatibility
- Volume path corrections in Docker configurations

---

## [0.7.0](https://github.com/matte1240/employee-app/compare/v0.6.0...v0.7.0) (2025-11-18)

### Features
- **auth:** Add logout button and session provider components ([6b706d8](https://github.com/matte1240/employee-app/commit/6b706d895672e525b339d936299ecec91c1c92bd))
- **calendar:** Replace AdminTimesheet with UserSelector for user selection ([3a1eeca](https://github.com/matte1240/employee-app/commit/3a1eeca84c41b87b53aff09984e2d2c9b6c8a09e))
- **holidays:** Implement holiday checks in timesheet and date utilities ([b1ed50f](https://github.com/matte1240/employee-app/commit/b1ed50f9ce730072dc3755832465fb37d3ec9092))
- Update font styles and translations, enhance password reset flow, and improve session handling ([3bda771](https://github.com/matte1240/employee-app/commit/3bda771485a8365c79eb708d5b055547ff51f8c9))
- Update year selection logic in reports and calendar components to include a range of three years before and after the current year ([f728ef1](https://github.com/matte1240/employee-app/commit/f728ef1a2fdad4662aa7078349528dc7733afa55))

---

## [0.6.0](https://github.com/matte1240/employee-app/compare/v0.5.0...v0.6.0) (2025-11-18)

### Features
- Add DEV mode for user management with manual password setting and reset functionality ([e957a3a](https://github.com/matte1240/employee-app/commit/e957a3a38e41e2f90e58a36f9762acff286912e9))

---

## [0.5.0](https://github.com/matte1240/employee-app/compare/v0.4.0...v0.5.0) (2025-11-17)

### Features
- Add sickness hours tracking to time entries and update related logic ([a75f50c](https://github.com/matte1240/employee-app/commit/a75f50c964b8370e18c960b34944c7cbda459843))
- Add vacation hours tracking across dashboard components ([c970d3c](https://github.com/matte1240/employee-app/commit/c970d3c7cb8ce4bb675d825ebfbfc0e8cf7f0be5))
- Refactor admin dashboard to use AdminOverview component and add leaderboard functionality ([7de5753](https://github.com/matte1240/employee-app/commit/7de5753bb2f4329ffb948bbb9ca655517b818e98))
- Remove top stats cards and update related text to Italian ([6676639](https://github.com/matte1240/employee-app/commit/667663950e990695a6bba62579577879953773fe))
- Update dashboard layout to include an additional column for stats cards ([6dfa79d](https://github.com/matte1240/employee-app/commit/6dfa79d7bd3ec99dde653dbcf8548e60707d182e))
- Update time tracking to consolidate vacation and permission hours, and enhance dashboard statistics ([976baf8](https://github.com/matte1240/employee-app/commit/976baf88488ca3eeba9d6e5641b98fe517619bfd))

---

## [0.4.0](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.4.0) (2025-11-17)

### Bug Fixes
- Add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
- Correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
- Downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
- Update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
- Update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
- Update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
- Update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))

### Features
- Add medical certificate field to time entries and update related logic ([c733015](https://github.com/matte1240/employee-app/commit/c733015bbc6b3c299385526c2eed639752dcca74))

---

## [0.3.1](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.3.1) (2025-11-16)

### Bug Fixes
- Add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
- Correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
- Downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
- Update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
- Update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
- Update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
- Update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))
