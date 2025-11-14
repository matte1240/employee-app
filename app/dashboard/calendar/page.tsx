import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import EmployeeDashboard, {
  type TimeEntryDTO,
} from "@/components/dashboard/employee-dashboard";
import AdminCalendar from "@/components/dashboard/admin-calendar";

type PrismaEntry = {
  id: string;
  workDate: Date;
  hoursWorked: Decimal;
  overtimeHours: Decimal;
  permessoHours: Decimal;
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
  notes: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
};

const toDto = (entry: PrismaEntry): TimeEntryDTO => ({
  id: entry.id,
  workDate: entry.workDate.toISOString().split("T")[0],
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  permessoHours: parseFloat(entry.permessoHours.toString()),
  morningStart: entry.morningStart,
  morningEnd: entry.morningEnd,
  afternoonStart: entry.afternoonStart,
  afternoonEnd: entry.afternoonEnd,
  notes: entry.notes,
});

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get all users for the dropdown
  const users = (await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })) as UserRow[];

  // Await searchParams (Next.js 15+)
  const params = await searchParams;

  // Determine which user's calendar to show
  const targetUserId = params.userId || session.user.id;
  const targetUser = users.find((u) => u.id === targetUserId) || {
    id: session.user.id,
    name: session.user.name || null,
    email: session.user.email,
  };

  // Fetch entries for the target user
  const now = new Date();
  const entries = (await prisma.timeEntry.findMany({
    where: {
      userId: targetUserId,
      workDate: {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      },
    },
    select: {
      id: true,
      workDate: true,
      hoursWorked: true,
      overtimeHours: true,
      permessoHours: true,
      morningStart: true,
      morningEnd: true,
      afternoonStart: true,
      afternoonEnd: true,
      notes: true,
    },
    orderBy: { workDate: "asc" },
  })) as PrismaEntry[];

  const plain = entries.map(toDto);

  return (
    <AdminCalendar
      users={users}
      selectedUserId={targetUserId}
      selectedUser={targetUser}
      initialEntries={plain}
    />
  );
}
