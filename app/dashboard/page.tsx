import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import EmployeeDashboard, {
  type TimeEntryDTO,
} from "@/components/dashboard/employee-dashboard";
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

const toDto = (entry: PrismaEntry): TimeEntryDTO => ({
  id: entry.id,
  workDate: entry.workDate.toISOString(),
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
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <EmployeeDashboard
        initialEntries={plain}
        userName={session.user.name ?? session.user.email}
      />
    </main>
  );
}
