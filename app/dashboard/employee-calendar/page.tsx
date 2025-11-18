import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import Calendar, {
  type TimeEntryDTO,
} from "@/components/dashboard/calendar";

type PrismaEntry = {
  id: string;
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
  notes: string | null;
};

const toDto = (entry: PrismaEntry): TimeEntryDTO => ({
  id: entry.id,
  workDate: entry.workDate.toISOString().split("T")[0],
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  permessoHours: parseFloat(entry.permessoHours.toString()),
  sicknessHours: parseFloat(entry.sicknessHours.toString()),
  vacationHours: parseFloat(entry.vacationHours.toString()),
  morningStart: entry.morningStart,
  morningEnd: entry.morningEnd,
  afternoonStart: entry.afternoonStart,
  afternoonEnd: entry.afternoonEnd,
  notes: entry.notes,
});

export default async function EmployeeCalendarPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  // Fetch current month entries for the employee
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
      sicknessHours: true,
      vacationHours: true,
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
      <Calendar
        initialEntries={plain}
        userName={session.user.name ?? session.user.email}
        hideHeader={true}
      />
    </div>
  );
}
