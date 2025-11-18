/**
 * Shared types for the employee management application
 * Centralized type definitions to avoid duplication across components
 */

// User roles
export type UserRole = "EMPLOYEE" | "ADMIN";

// Base user type
export type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
};

// Time entry data transfer object
export type TimeEntryDTO = {
  id: string;
  userId: string;
  workDate: string;
  hoursWorked: number;
  overtimeHours?: number;
  permessoHours?: number;
  sicknessHours?: number;
  vacationHours?: number;
  morningStart?: string | null;
  morningEnd?: string | null;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
  medicalCertificate?: string | null;
  notes?: string | null;
};
