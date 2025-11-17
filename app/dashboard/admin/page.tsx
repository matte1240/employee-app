import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

type UserAggregate = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  lastEntry?: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
};

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

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
    _sum: { hoursWorked: true, overtimeHours: true, permessoHours: true, sicknessHours: true },
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

  const regularHoursMap = new Map<string, number>();
  const overtimeHoursMap = new Map<string, number>();
  const permessoHoursMap = new Map<string, number>();
  const sicknessHoursMap = new Map<string, number>();

  for (const row of totals) {
    if (row._sum) {
      const regularHours = row._sum.hoursWorked ? parseFloat(row._sum.hoursWorked.toString()) : 0;
      const overtimeHours = row._sum.overtimeHours ? parseFloat(row._sum.overtimeHours.toString()) : 0;
      const permessoHours = row._sum.permessoHours ? parseFloat(row._sum.permessoHours.toString()) : 0;
      const sicknessHours = row._sum.sicknessHours ? parseFloat(row._sum.sicknessHours.toString()) : 0;

      console.log(`[SERVER] userId: ${row.userId}, hoursWorked: ${regularHours}, overtime: ${overtimeHours}, permesso: ${permessoHours}, sickness: ${sicknessHours}`);

      // hoursWorked already contains only regular hours (max 8 per day)
      regularHoursMap.set(row.userId, regularHours);
      overtimeHoursMap.set(row.userId, overtimeHours);
      permessoHoursMap.set(row.userId, permessoHours);
      sicknessHoursMap.set(row.userId, sicknessHours);
    }
  }

  const lastEntryMap = new Map<string, string | null>();
  for (const row of lastEntries) {
    lastEntryMap.set(row.userId, row._max.workDate ? row._max.workDate.toISOString() : null);
  }

  const rows: UserAggregate[] = users.map((user) => ({
    ...user,
    regularHours: regularHoursMap.get(user.id) ?? 0,
    overtimeHours: overtimeHoursMap.get(user.id) ?? 0,
    permessoHours: permessoHoursMap.get(user.id) ?? 0,
    sicknessHours: sicknessHoursMap.get(user.id) ?? 0,
    lastEntry: lastEntryMap.get(user.id) ?? null,
  }));

  const currentUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  return <AdminDashboard users={rows} currentUser={currentUser} />;
}
