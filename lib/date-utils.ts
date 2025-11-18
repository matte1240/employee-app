/**
 * Utility functions for date-related operations
 */

/**
 * Check if a date is editable based on business rules
 * - Must be in current month or later
 * - Must not be in the future
 * - Sundays are blocked for employees (unless isAdmin is true)
 * 
 * @param date The date to check
 * @param isAdmin Whether the current user is an admin (bypasses Sunday restriction)
 * @returns true if the date is editable, false otherwise
 */
export function isDateEditable(date: Date, isAdmin = false): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Block Sundays (0 = Sunday) only for employees
  if (!isAdmin) {
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0) {
      return false;
    }
  }
  
  return checkDate >= currentMonthStart && checkDate <= today;
}
