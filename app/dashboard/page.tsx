import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import EmployeeDashboard, {
  type TimeEntryDTO,
} from "@/components/dashboard/employee-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

type PrismaEntry = {
  id: string;
  workDate: Date;
  hoursWorked: Decimal;
  overtimeHours: Decimal;
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
  notes: string | null;
};

type UserAggregate = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
  totalHours: number;
  lastEntry?: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
};

const toDto = (entry: PrismaEntry): TimeEntryDTO => ({
  id: entry.id,
  workDate: entry.workDate.toISOString().split('T')[0], // Return only date part (YYYY-MM-DD)
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  morningStart: entry.morningStart,
  morningEnd: entry.morningEnd,
  afternoonStart: entry.afternoonStart,
  afternoonEnd: entry.afternoonEnd,
  notes: entry.notes,
});

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  // If user is ADMIN, show admin dashboard
  if (session.user.role === "ADMIN") {
    const users = (await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })) as UserRow[];

    // Filter by current month only (to match calendar view)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`);
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay}T23:59:59.999Z`);

    const totals = await prisma.timeEntry.groupBy({
      by: ["userId"],
      _sum: { hoursWorked: true, overtimeHours: true },
      where: {
        workDate: {
          gte: firstDay,
          lte: lastDayDate,
        },
      },
    });

    const lastEntries = await prisma.timeEntry.groupBy({
      by: ["userId"],
      _max: { workDate: true },
    });

    const hoursMap = new Map<string, number>();
    for (const row of totals) {
      const hoursWorked = row._sum.hoursWorked ? parseFloat(row._sum.hoursWorked.toString()) : 0;
      const overtimeHours = row._sum.overtimeHours ? parseFloat(row._sum.overtimeHours.toString()) : 0;
      hoursMap.set(row.userId, hoursWorked + overtimeHours);
    }

    const lastEntryMap = new Map<string, string | null>();
    for (const row of lastEntries) {
      lastEntryMap.set(row.userId, row._max.workDate ? row._max.workDate.toISOString() : null);
    }

    const rows: UserAggregate[] = users.map((user) => ({
      ...user,
      totalHours: hoursMap.get(user.id) ?? 0,
      lastEntry: lastEntryMap.get(user.id) ?? null,
    }));

    return <AdminDashboard users={rows} />;
  }

  // Otherwise, show employee dashboard
  const now = new Date();

  const entries = (await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <EmployeeDashboard
        initialEntries={plain}
        userName={session.user.name ?? session.user.email}
      />
    </main>
  );
}
