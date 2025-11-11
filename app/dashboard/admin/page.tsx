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

  const totals = await prisma.timeEntry.groupBy({
    by: ["userId"],
    _sum: { hoursWorked: true },
  });

  const lastEntries = await prisma.timeEntry.groupBy({
    by: ["userId"],
    _max: { workDate: true },
  });

  const hoursMap = new Map<string, number>();
  for (const row of totals) {
    const value = row._sum.hoursWorked;
    hoursMap.set(row.userId, value ? parseFloat(value.toString()) : 0);
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
