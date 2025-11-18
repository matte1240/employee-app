/**
 * Application constants
 * Centralized constants to avoid magic strings throughout the codebase
 */

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

// Route paths
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  DASHBOARD_ADMIN: "/dashboard/admin",
  DASHBOARD_EMPLOYEE_CALENDAR: "/dashboard/employee-calendar",
  DASHBOARD_EMPLOYEE_REPORTS: "/dashboard/employee-reports",
  DASHBOARD_PROFILE: "/dashboard/profile",
  DASHBOARD_USERS: "/dashboard/users",
  DASHBOARD_USERS_DEV: "/dashboard/users-dev",
  DASHBOARD_CALENDAR: "/dashboard/calendar",
  DASHBOARD_REPORTS: "/dashboard/reports",
  DASHBOARD_MANAGE_SERVER: "/dashboard/manage-server",
  RESET_PASSWORD: "/reset-password",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH_SIGNIN: "/api/auth/signin",
  AUTH_SIGNOUT: "/api/auth/signout",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password",
  AUTH_REQUEST_RESET: "/api/auth/request-reset",
  USERS: "/api/users",
  USERS_CREATE_DEV: "/api/users/create-dev",
  HOURS: "/api/hours",
  ADMIN_STATS: "/api/admin/stats",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

// Time constants (in milliseconds)
export const TIME = {
  POLLING_INTERVAL: 30000, // 30 seconds
  REDIRECT_DELAY: 3000, // 3 seconds
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO_DATE: "yyyy-MM-dd",
  DISPLAY_DATE: "MMM d, yyyy",
  DISPLAY_DATE_TIME: "MMM d, yyyy HH:mm",
} as const;
