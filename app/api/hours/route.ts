import type { Decimal } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createHoursSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).optional(),
  morningStart: z.string().optional(),
  morningEnd: z.string().optional(),
  afternoonStart: z.string().optional(),
  afternoonEnd: z.string().optional(),
  notes: z.string().max(500).optional(),
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
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toPlainEntry = (entry: RawEntry) => ({
  id: entry.id,
  userId: entry.userId,
  workDate: entry.workDate.toISOString(),
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  morningStart: entry.morningStart,
  morningEnd: entry.morningEnd,
  afternoonStart: entry.afternoonStart,
  afternoonEnd: entry.afternoonEnd,
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
    userId: session.user.role === "ADMIN" && userId ? userId : session.user.id,
  };

  if (session.user.role === "ADMIN" && userId === "all") {
    delete where.userId;
  }

  if (from || to) {
    where.workDate = {};
    if (from) {
      where.workDate.gte = new Date(from);
    }
    if (to) {
      where.workDate.lte = new Date(to);
    }
  }

  if (!where.userId) {
    const entries = (await prisma.timeEntry.findMany({
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

  const { workDate, hoursWorked, overtimeHours, morningStart, morningEnd, afternoonStart, afternoonEnd, notes } = parsed.data;

  // Employees can only enter hours for dates up to today in the current month
  if (session.user.role === "EMPLOYEE") {
    const entryDate = new Date(`${workDate}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);

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

  // Check if entry already exists for this date
  const existing = await prisma.timeEntry.findFirst({
    where: {
      userId: session.user.id,
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
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        notes,
      },
    })) as RawEntry;
  } else {
    // Create new entry
    entry = (await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        workDate: new Date(`${workDate}T00:00:00.000Z`),
        hoursWorked: hoursWorked.toString(),
        overtimeHours: (overtimeHours ?? 0).toString(),
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        notes,
      },
    })) as RawEntry;
  }

  return NextResponse.json(toPlainEntry(entry), { status: existing ? 200 : 201 });
}
