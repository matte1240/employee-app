/**
 * Utility functions for user working schedule management
 */

import { prisma } from "@/lib/prisma";
import { WorkingScheduleDTO } from "@/types/models";
import { calculateHours } from "./time-utils";

// Default working schedule: Mon-Fri 8-12, 14-18 (8 hours/day)
export const DEFAULT_SCHEDULE = {
  morningStart: "08:00",
  morningEnd: "12:00",
  afternoonStart: "14:00",
  afternoonEnd: "18:00",
  totalHours: 8,
};

// Days that are working days by default (Monday to Friday)
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

/**
 * Calculate total hours from shift times
 */
export function calculateTotalHoursFromShifts(
  morningStart: string | null,
  morningEnd: string | null,
  afternoonStart: string | null,
  afternoonEnd: string | null
): number {
  let total = 0;
  if (morningStart && morningEnd) {
    total += calculateHours(morningStart, morningEnd);
  }
  if (afternoonStart && afternoonEnd) {
    total += calculateHours(afternoonStart, afternoonEnd);
  }
  return total;
}

/**
 * Get all working schedules for a user
 */
export async function getUserSchedules(
  userId: string
): Promise<WorkingScheduleDTO[]> {
  const schedules = await prisma.workingSchedule.findMany({
    where: { userId },
    orderBy: { dayOfWeek: "asc" },
  });

  return schedules.map((s: { id: string; userId: string; dayOfWeek: number; morningStart: string | null; morningEnd: string | null; afternoonStart: string | null; afternoonEnd: string | null; totalHours: { toString(): string }; isWorkingDay: boolean }) => ({
    id: s.id,
    userId: s.userId,
    dayOfWeek: s.dayOfWeek,
    morningStart: s.morningStart,
    morningEnd: s.morningEnd,
    afternoonStart: s.afternoonStart,
    afternoonEnd: s.afternoonEnd,
    totalHours: parseFloat(s.totalHours.toString()),
    isWorkingDay: s.isWorkingDay,
  }));
}

/**
 * Get schedule for a specific day of week
 */
export async function getUserScheduleForDay(
  userId: string,
  dayOfWeek: number
): Promise<WorkingScheduleDTO | null> {
  const schedule = await prisma.workingSchedule.findUnique({
    where: {
      userId_dayOfWeek: { userId, dayOfWeek },
    },
  });

  if (!schedule) return null;

  return {
    id: schedule.id,
    userId: schedule.userId,
    dayOfWeek: schedule.dayOfWeek,
    morningStart: schedule.morningStart,
    morningEnd: schedule.morningEnd,
    afternoonStart: schedule.afternoonStart,
    afternoonEnd: schedule.afternoonEnd,
    totalHours: parseFloat(schedule.totalHours.toString()),
    isWorkingDay: schedule.isWorkingDay,
  };
}

/**
 * Get base hours for a specific date based on user's schedule
 * Returns 0 if the day is not a working day or Sunday
 */
export async function getBaseHoursForDate(
  userId: string,
  date: Date
): Promise<number> {
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Sunday is always non-working (blocked)
  if (dayOfWeek === 0) {
    return 0;
  }

  const schedule = await getUserScheduleForDay(userId, dayOfWeek);

  // If no schedule exists, use default (8h for Mon-Fri, 0 for Sat)
  if (!schedule) {
    return DEFAULT_WORKING_DAYS.includes(dayOfWeek) ? 8 : 0;
  }

  // If not a working day, return 0 (all hours will be overtime)
  if (!schedule.isWorkingDay) {
    return 0;
  }

  return schedule.totalHours;
}

/**
 * Check if a date is a working day for the user
 */
export async function isUserWorkingDay(
  userId: string,
  date: Date
): Promise<boolean> {
  const dayOfWeek = date.getDay();

  // Sunday is always non-working
  if (dayOfWeek === 0) {
    return false;
  }

  const schedule = await getUserScheduleForDay(userId, dayOfWeek);

  // If no schedule exists, use default (Mon-Fri are working days)
  if (!schedule) {
    return DEFAULT_WORKING_DAYS.includes(dayOfWeek);
  }

  return schedule.isWorkingDay;
}

/**
 * Create default working schedules for a user (Mon-Fri, 8-12, 14-18)
 */
export async function createDefaultSchedulesForUser(
  userId: string
): Promise<void> {
  const scheduleData = DEFAULT_WORKING_DAYS.map((dayOfWeek) => ({
    userId,
    dayOfWeek,
    morningStart: DEFAULT_SCHEDULE.morningStart,
    morningEnd: DEFAULT_SCHEDULE.morningEnd,
    afternoonStart: DEFAULT_SCHEDULE.afternoonStart,
    afternoonEnd: DEFAULT_SCHEDULE.afternoonEnd,
    totalHours: DEFAULT_SCHEDULE.totalHours,
    isWorkingDay: true,
  }));

  // Use createMany for efficiency
  await prisma.workingSchedule.createMany({
    data: scheduleData,
    skipDuplicates: true,
  });
}

/**
 * Update or create a schedule for a specific day
 */
export async function upsertScheduleForDay(
  userId: string,
  dayOfWeek: number,
  data: {
    morningStart?: string | null;
    morningEnd?: string | null;
    afternoonStart?: string | null;
    afternoonEnd?: string | null;
    isWorkingDay?: boolean;
  }
): Promise<WorkingScheduleDTO> {
  const totalHours = calculateTotalHoursFromShifts(
    data.morningStart ?? null,
    data.morningEnd ?? null,
    data.afternoonStart ?? null,
    data.afternoonEnd ?? null
  );

  const schedule = await prisma.workingSchedule.upsert({
    where: {
      userId_dayOfWeek: { userId, dayOfWeek },
    },
    update: {
      morningStart: data.morningStart,
      morningEnd: data.morningEnd,
      afternoonStart: data.afternoonStart,
      afternoonEnd: data.afternoonEnd,
      totalHours,
      isWorkingDay: data.isWorkingDay ?? true,
    },
    create: {
      userId,
      dayOfWeek,
      morningStart: data.morningStart ?? null,
      morningEnd: data.morningEnd ?? null,
      afternoonStart: data.afternoonStart ?? null,
      afternoonEnd: data.afternoonEnd ?? null,
      totalHours,
      isWorkingDay: data.isWorkingDay ?? true,
    },
  });

  return {
    id: schedule.id,
    userId: schedule.userId,
    dayOfWeek: schedule.dayOfWeek,
    morningStart: schedule.morningStart,
    morningEnd: schedule.morningEnd,
    afternoonStart: schedule.afternoonStart,
    afternoonEnd: schedule.afternoonEnd,
    totalHours: parseFloat(schedule.totalHours.toString()),
    isWorkingDay: schedule.isWorkingDay,
  };
}

/**
 * Update all schedules for a user at once
 */
export async function updateUserSchedules(
  userId: string,
  schedules: Array<{
    dayOfWeek: number;
    morningStart?: string | null;
    morningEnd?: string | null;
    afternoonStart?: string | null;
    afternoonEnd?: string | null;
    isWorkingDay?: boolean;
  }>
): Promise<WorkingScheduleDTO[]> {
  const results: WorkingScheduleDTO[] = [];

  for (const schedule of schedules) {
    const result = await upsertScheduleForDay(userId, schedule.dayOfWeek, schedule);
    results.push(result);
  }

  return results.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/**
 * Convert schedules to a map for quick lookup by dayOfWeek
 */
export function schedulesToMap(
  schedules: WorkingScheduleDTO[]
): Map<number, WorkingScheduleDTO> {
  return new Map(schedules.map((s) => [s.dayOfWeek, s]));
}

/**
 * Get base hours from schedule map (for client-side use)
 */
export function getBaseHoursFromScheduleMap(
  scheduleMap: Map<number, WorkingScheduleDTO>,
  dayOfWeek: number
): number {
  // Sunday is always 0
  if (dayOfWeek === 0) {
    return 0;
  }

  const schedule = scheduleMap.get(dayOfWeek);

  if (!schedule) {
    // Default: Mon-Fri = 8h, Sat = 0
    return DEFAULT_WORKING_DAYS.includes(dayOfWeek) ? 8 : 0;
  }

  if (!schedule.isWorkingDay) {
    return 0;
  }

  return schedule.totalHours;
}

/**
 * Check if day is working from schedule map (for client-side use)
 */
export function isWorkingDayFromScheduleMap(
  scheduleMap: Map<number, WorkingScheduleDTO>,
  dayOfWeek: number
): boolean {
  if (dayOfWeek === 0) {
    return false;
  }

  const schedule = scheduleMap.get(dayOfWeek);

  if (!schedule) {
    return DEFAULT_WORKING_DAYS.includes(dayOfWeek);
  }

  return schedule.isWorkingDay;
}
