import { isHoliday } from "./holiday-utils";

/**
 * Utility functions for date-related operations
 */

/**
 * Check if a date is editable based on business rules
 * - Must be in current month or (if before the 5th) previous month
 * - Must not be in the future
 * - Sundays are blocked for employees (unless isAdmin is true)
 * 
 * @param date The date to check
 * @param isAdmin Whether the current user is an admin (bypasses Sunday restriction)
 * @param canWorkSunday Whether the employee is allowed to work on Sundays
 * @returns true if the date is editable, false otherwise
 */
export function isDateEditable(date: Date, isAdmin = false, canWorkSunday = false): boolean {
  // Admins can edit any date, past or future
  if (isAdmin) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Determine the earliest editable date
  const currentDay = today.getDate();
  let earliestEditableDate: Date;
  
  if (currentDay <= 5) {
    // If before or on the 5th, allow editing previous month
    earliestEditableDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  } else {
    // Otherwise, only current month
    earliestEditableDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  
  // Block Sundays (0 = Sunday) unless allowed, and Holidays always for employees
  if (!isAdmin) {
    const dayOfWeek = checkDate.getDay();
    if ((dayOfWeek === 0 && !canWorkSunday) || isHoliday(checkDate)) {
      return false;
    }
  }
  
  return checkDate >= earliestEditableDate && checkDate <= today;
}
