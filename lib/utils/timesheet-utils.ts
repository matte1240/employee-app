/**
 * Utility functions for timesheet reminder logic.
 * Checks if users have missing time entries for expected working days.
 */

import prisma from "@/lib/prisma";
import { isHoliday } from "./holiday-utils";
import { isUserWorkingDay } from "./schedule-utils";

/**
 * Go back `lookbackDays` calendar days (excluding today) and find which ones
 * were expected working days for this user but have no TimeEntry or approved LeaveRequest.
 *
 * @param userId  - The user's ID
 * @param lookbackDays - How many calendar days to look back (default 5)
 * @returns Array of Date objects for missing days (local midnight)
 */
export async function getMissingDaysForUser(
  userId: string,
  lookbackDays = 5
): Promise<Date[]> {
  const missingDates: Date[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= lookbackDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Skip holidays
    if (isHoliday(date)) continue;

    // Skip non-working days per user's schedule
    const working = await isUserWorkingDay(userId, date);
    if (!working) continue;

    // Build a UTC date string to match Prisma workDate storage
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateUtc = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

    // Check for existing TimeEntry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: { userId, workDate: dateUtc },
      select: { id: true },
    });
    if (timeEntry) continue;

    // Check for approved LeaveRequest covering this date
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: dateUtc },
        endDate: { gte: dateUtc },
      },
      select: { id: true },
    });
    if (leaveRequest) continue;

    missingDates.push(date);
  }

  return missingDates;
}

/**
 * Format an array of Dates into a human-readable Italian string suitable for email bodies.
 * Example output for HTML: "<span class='date-tag'>Lunedì 27 Febbraio 2026</span>, ..."
 *
 * @param dates - Array of Date objects
 * @param html  - If true, wraps each date in a styled HTML span.
 */
export function formatMissingDatesIT(dates: Date[], html = true): string {
  if (dates.length === 0) return "";

  const formatted = dates.map((d) =>
    d.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  if (html) {
    return formatted.map((label) => `<span class="date-tag">${label}</span>`).join(" ");
  }

  return formatted.join(", ");
}

/**
 * Check all EMPLOYEE users and return those who have 2 or more missing days
 * in the last `lookbackDays` calendar days.
 * Used by the automated daily cron job.
 *
 * @param lookbackDays - How many calendar days to check (default 5)
 * @returns Array of { user, missingDates } objects
 */
export async function getUsersWithMissingTimesheets(lookbackDays = 5) {
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true, email: true },
  });

  const results: { user: { id: string; name: string | null; email: string }; missingDates: Date[] }[] = [];

  for (const user of users) {
    const missingDates = await getMissingDaysForUser(user.id, lookbackDays);
    if (missingDates.length >= 2) {
      results.push({ user, missingDates });
    }
  }

  return results;
}
