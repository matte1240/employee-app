import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Admin dashboard</h1>
          <p className="text-sm text-zinc-500">
            Review employee activity and invite teammates.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-800">Team overview</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Total hours</th>
                <th scope="col" className="px-4 py-3">Last activity</th>
                <th scope="col" className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {row.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-700">
                    {row.totalHours.toFixed(1)} h
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {row.lastEntry
                      ? format(new Date(row.lastEntry), "MMM d, yyyy")
                      : "No activity"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {format(row.createdAt, "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
