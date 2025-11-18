import type { Decimal } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/user-utils";

const createHoursSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).optional(),
  permessoHours: z.number().min(0).optional(),
  sicknessHours: z.number().min(0).optional(),
  vacationHours: z.number().min(0).optional(),
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
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
  medicalCertificate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toPlainEntry = (entry: RawEntry) => ({
  id: entry.id,
  userId: entry.userId,
  workDate: entry.workDate.toISOString().split('T')[0], // Return only date part (YYYY-MM-DD)
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  permessoHours: parseFloat(entry.permessoHours.toString()),
  sicknessHours: parseFloat(entry.sicknessHours.toString()),
  vacationHours: parseFloat(entry.vacationHours.toString()),
  morningStart: entry.morningStart,
  morningEnd: entry.morningEnd,
  afternoonStart: entry.afternoonStart,
  afternoonEnd: entry.afternoonEnd,
  medicalCertificate: entry.medicalCertificate,
  notes: entry.notes,
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
});

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
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
    const payload = entries.map((entry) => toPlainEntry(entry));
    return NextResponse.json(payload);
  }

  const entries = (await prisma.timeEntry.findMany({
    where,
    orderBy: { workDate: "desc" },
  })) as RawEntry[];

  return NextResponse.json(entries.map((entry) => toPlainEntry(entry)));
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createHoursSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { workDate, hoursWorked, overtimeHours, morningStart, morningEnd, afternoonStart, afternoonEnd, medicalCertificate, notes, userId: requestedUserId } = parsed.data;

  // Determine which userId to use: admin can specify, employee uses their own
  const targetUserId = isAdmin(session) && requestedUserId ? requestedUserId : session.user.id;

  // Employees can only enter hours for dates up to today in the current month
  if (!isAdmin(session)) {
    const entryDate = new Date(`${workDate}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);

    // Block Sundays (0 = Sunday)
    const dayOfWeek = entryDate.getUTCDay();
    if (dayOfWeek === 0) {
      return NextResponse.json(
        { error: "Cannot enter hours on Sundays" },
        { status: 403 }
      );
    }

    if (entryDate > today) {
      return NextResponse.json(
        { error: "Cannot enter hours for future dates" },
        { status: 403 }
      );
    }

    if (entryDate < currentMonthStart) {
      return NextResponse.json(
        { error: "Can only enter hours for the current month" },
        { status: 403 }
      );
    }
  }

  // Calculate permessoHours only for weekdays when hours < 8 AND not vacation/sickness
  const entryDate = new Date(`${workDate}T00:00:00.000Z`);
  const dayOfWeek = entryDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  let permessoHours = parsed.data.permessoHours ?? 0;
  let sicknessHours = parsed.data.sicknessHours ?? 0;
  let vacationHours = parsed.data.vacationHours ?? 0;

  // Only auto-calculate permesso if not already provided and not vacation/sickness
  if (!parsed.data.permessoHours && sicknessHours === 0 && vacationHours === 0) {
    if (isWeekday && hoursWorked < 8) {
      permessoHours = 8 - hoursWorked;
    }
  }

  // Check if entry already exists for this date
  const existing = await prisma.timeEntry.findFirst({
    where: {
      userId: targetUserId,
      workDate: new Date(`${workDate}T00:00:00.000Z`),
    },
  });

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
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        medicalCertificate,
        notes,
      },
    })) as RawEntry;
  }

  return NextResponse.json(toPlainEntry(entry), { status: existing ? 200 : 201 });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const entryId = url.searchParams.get("id");

  if (!entryId) {
    return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
  }

  // Find the entry
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  // Check permissions: employees can only delete their own entries, admins can delete any
  if (!isAdmin(session) && entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete the entry
  await prisma.timeEntry.delete({
    where: { id: entryId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
