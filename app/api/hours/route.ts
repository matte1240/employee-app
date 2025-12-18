import type { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { isHoliday } from "@/lib/utils/holiday-utils";
import { requireAuth, isAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-responses";
import { serializeTimeEntry, serializeTimeEntries } from "@/lib/utils/serialization";

const createHoursSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).optional(),
  permessoHours: z.number().min(0).optional(),
  sicknessHours: z.number().min(0).optional(),
  vacationHours: z.number().min(0).optional(),
  permesso104Hours: z.number().min(0).optional(),
  paternityHours: z.number().min(0).optional(),
  morningStart: z.string().nullable().optional(),
  morningEnd: z.string().nullable().optional(),
  afternoonStart: z.string().nullable().optional(),
  afternoonEnd: z.string().nullable().optional(),
  medicalCertificate: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  userId: z.string().optional(), // Admin can specify userId
});

const querySchema = z.object({
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

type RawEntry = {
  id: string;
  userId: string;
  workDate: Date;
  hoursWorked: Decimal;
  overtimeHours: Decimal;
  permessoHours: Decimal;
  sicknessHours: Decimal;
  vacationHours: Decimal;
  permesso104Hours: Decimal;
  paternityHours: Decimal;
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
  medicalCertificate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return badRequestResponse("Invalid query");
  }

  const { userId, from, to } = parsed.data;

  const where: {
    userId?: string;
    workDate?: { gte?: Date; lte?: Date };
  } = {
    userId: isAdmin(session) && userId ? userId : session.user.id,
  };

  if (isAdmin(session) && userId === "all") {
    delete where.userId;
  }

  if (from || to) {
    where.workDate = {};
    if (from) {
      where.workDate.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      where.workDate.lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  // If userId is not set (meaning "all" for admin), still apply date filters
  if (!where.userId) {
    const entries = (await prisma.timeEntry.findMany({
      where: where.workDate ? { workDate: where.workDate } : undefined,
      orderBy: { workDate: "desc" },
    })) as RawEntry[];
    return successResponse(serializeTimeEntries(entries));
  }

  const entries = (await prisma.timeEntry.findMany({
    where,
    orderBy: { workDate: "desc" },
  })) as RawEntry[];

  return successResponse(serializeTimeEntries(entries));
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = createHoursSchema.safeParse(body);

  if (!parsed.success) {
    return badRequestResponse("Invalid payload");
  }

  const { workDate, hoursWorked, overtimeHours, morningStart, morningEnd, afternoonStart, afternoonEnd, medicalCertificate, notes, userId: requestedUserId } = parsed.data;

  // Determine which userId to use: admin can specify, employee uses their own
  const targetUserId = isAdmin(session) && requestedUserId ? requestedUserId : session.user.id;

  // Employees can only enter hours for dates up to today, and:
  // - Current month always allowed
  // - Previous month allowed only if today is on or before the 5th
  if (!isAdmin(session)) {
    const entryDate = new Date(`${workDate}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Determine the earliest editable date
    const currentDay = today.getUTCDate();
    let earliestEditableDate: Date;
    
    if (currentDay <= 5) {
      // If before or on the 5th, allow editing previous month
      earliestEditableDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    } else {
      // Otherwise, only current month
      earliestEditableDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    }

    // Block Sundays (0 = Sunday)
    const dayOfWeek = entryDate.getUTCDay();
    if (dayOfWeek === 0 || isHoliday(workDate)) {
      return forbiddenResponse("Cannot enter hours on Sundays or Holidays");
    }

    if (entryDate > today) {
      return forbiddenResponse("Cannot enter hours for future dates");
    }

    if (entryDate < earliestEditableDate) {
      const errorMessage = currentDay <= 5
        ? "Can only enter hours for the current month or previous month (until the 5th of the current month)"
        : "Can only enter hours for the current month";
      return forbiddenResponse(errorMessage);
    }
  }

  // Calculate permessoHours only for weekdays when hours < 8 AND not vacation/sickness
  const entryDate = new Date(`${workDate}T00:00:00.000Z`);
  const dayOfWeek = entryDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday(workDate);

  let permessoHours = parsed.data.permessoHours ?? 0;
  const sicknessHours = parsed.data.sicknessHours ?? 0;
  const vacationHours = parsed.data.vacationHours ?? 0;
  const permesso104Hours = parsed.data.permesso104Hours ?? 0;
  const paternityHours = parsed.data.paternityHours ?? 0;

  // Only auto-calculate permesso if not already provided and not vacation/sickness/104/paternity
  if (!parsed.data.permessoHours && sicknessHours === 0 && vacationHours === 0 && permesso104Hours === 0 && paternityHours === 0) {
    if (isWeekday && hoursWorked < 8) {
      permessoHours = 8 - hoursWorked;
    }
  }

  const existing = await prisma.timeEntry.findUnique({
    where: {
      userId_workDate: {
        userId: targetUserId,
        workDate: entryDate,
      },
    },
  });

  // --- VALIDATION LOGIC ---
  
  // 1. Permesso 104 Validation (Max 24h/month)
  if (permesso104Hours > 0) {
    const entryDateObj = new Date(`${workDate}T00:00:00.000Z`);
    const startOfMonth = new Date(Date.UTC(entryDateObj.getUTCFullYear(), entryDateObj.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(entryDateObj.getUTCFullYear(), entryDateObj.getUTCMonth() + 1, 0, 23, 59, 59));

    const monthlyEntries = await prisma.timeEntry.findMany({
      where: {
        userId: targetUserId,
        workDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude current entry if updating
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      select: {
        permesso104Hours: true,
      },
    });

    const currentTotal = monthlyEntries.reduce((sum, e) => sum + Number(e.permesso104Hours), 0);
    
    if (currentTotal + permesso104Hours > 24) {
      return badRequestResponse(`Limite Permesso 104 superato. Hai già usato ${currentTotal}h questo mese. Massimo consentito: 24h.`);
    }
  }

  // 2. Paternity Leave Validation (Max 10 days total)
  if (paternityHours > 0) {
    // Count distinct days with paternity leave
    // Note: This is a simple total count. For "per event" logic, we'd need a more complex system linking leaves to events.
    // Assuming "per event" means we just warn or block based on a reasonable history or manual reset, 
    // but for now we implement a total count check.
    
    const paternityEntries = await prisma.timeEntry.findMany({
      where: {
        userId: targetUserId,
        paternityHours: { gt: 0 },
        // Exclude current entry if updating
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      select: {
        id: true, // Just need to count rows
      },
    });

    if (paternityEntries.length >= 10) {
      return badRequestResponse(`Limite Congedo Paternità superato. Hai già usato ${paternityEntries.length} giorni. Massimo consentito: 10 giorni.`);
    }
  }

  // --- END VALIDATION ---

  let entry: RawEntry;

  if (existing) {
    // Update existing entry
    entry = (await prisma.timeEntry.update({
      where: { id: existing.id },
      data: {
        hoursWorked: hoursWorked.toString(),
        overtimeHours: (overtimeHours ?? 0).toString(),
        permessoHours: permessoHours.toString(),
        sicknessHours: sicknessHours.toString(),
        vacationHours: vacationHours.toString(),
        permesso104Hours: permesso104Hours.toString(),
        paternityHours: paternityHours.toString(),
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        medicalCertificate,
        notes,
      },
    })) as RawEntry;
  } else {
    // Create new entry
    entry = (await prisma.timeEntry.create({
      data: {
        userId: targetUserId,
        workDate: new Date(`${workDate}T00:00:00.000Z`),
        hoursWorked: hoursWorked.toString(),
        overtimeHours: (overtimeHours ?? 0).toString(),
        permessoHours: permessoHours.toString(),
        sicknessHours: sicknessHours.toString(),
        vacationHours: vacationHours.toString(),
        permesso104Hours: permesso104Hours.toString(),
        paternityHours: paternityHours.toString(),
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        medicalCertificate,
        notes,
      },
    })) as RawEntry;
  }

  return successResponse(serializeTimeEntry(entry), existing ? 200 : 201);
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const url = new URL(request.url);
  const entryId = url.searchParams.get("id");

  if (!entryId) {
    return badRequestResponse("Entry ID required");
  }

  // Find the entry
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return notFoundResponse("Entry not found");
  }

  // Check permissions: employees can only delete their own entries, admins can delete any
  if (!isAdmin(session) && entry.userId !== session.user.id) {
    return forbiddenResponse("Forbidden");
  }

  // Delete the entry
  await prisma.timeEntry.delete({
    where: { id: entryId },
  });

  return successResponse({ success: true });
}
