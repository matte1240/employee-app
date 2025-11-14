import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import AdminOverview from "@/components/dashboard/admin-overview";
import EmployeeDashboard, {
  type TimeEntryDTO,
} from "@/components/dashboard/employee-dashboard";
import { endOfMonth, startOfMonth } from "date-fns";

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

type UserAggregate = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
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
  workDate: entry.workDate.toISOString().split('T')[0],
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  permessoHours: parseFloat(entry.permessoHours.toString()),
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

  // ADMIN: Show overview with user statistics
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

    // Calculate totals for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`);
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay}T23:59:59.999Z`);

    const totals = await prisma.timeEntry.groupBy({
      by: ["userId"],
      _sum: { hoursWorked: true, overtimeHours: true, permessoHours: true },
      where: {
        workDate: {
          gte: firstDay,
          lte: lastDayDate,
        },
      },
    });

    const regularHoursMap = new Map<string, number>();
    const overtimeHoursMap = new Map<string, number>();
    const permessoHoursMap = new Map<string, number>();

    for (const row of totals) {
      const hoursWorked = row._sum.hoursWorked ? parseFloat(row._sum.hoursWorked.toString()) : 0;
      const overtimeHours = row._sum.overtimeHours ? parseFloat(row._sum.overtimeHours.toString()) : 0;
      const permessoHours = row._sum.permessoHours ? parseFloat(row._sum.permessoHours.toString()) : 0;
      const regularHours = hoursWorked - overtimeHours;

      regularHoursMap.set(row.userId, regularHours);
      overtimeHoursMap.set(row.userId, overtimeHours);
      permessoHoursMap.set(row.userId, permessoHours);
    }

    const rows: UserAggregate[] = users.map((user) => ({
      ...user,
      regularHours: regularHoursMap.get(user.id) ?? 0,
      overtimeHours: overtimeHoursMap.get(user.id) ?? 0,
      permessoHours: permessoHoursMap.get(user.id) ?? 0,
    }));

    return <AdminOverview users={rows} />;
  }

  // EMPLOYEE: Show personal dashboard with calendar
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <EmployeeDashboard
        initialEntries={plain}
        userName={session.user.name ?? session.user.email}
        hideHeader={true}
      />
    </div>
  );
}
