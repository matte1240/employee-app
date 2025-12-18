import type { Decimal } from "@prisma/client/runtime/library";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import TimesheetCalendar, {
  type TimeEntryDTO,
} from "@/components/dashboard/timesheet-calendar";
import UserSelector from "@/components/dashboard/user-selector";

type PrismaEntry = {
  id: string;
  userId: string;
  workDate: Date;
  hoursWorked: Decimal;
  overtimeHours: Decimal;
  permessoHours: Decimal;
  vacationHours: Decimal;
  sicknessHours: Decimal;
  permesso104Hours: Decimal;
  paternityHours: Decimal;
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
  hasPermesso104: boolean;
  hasPaternityLeave: boolean;
};

const toDto = (entry: PrismaEntry): TimeEntryDTO => ({
  id: entry.id,
  userId: entry.userId,
  workDate: entry.workDate.toISOString().split("T")[0],
  hoursWorked: parseFloat(entry.hoursWorked.toString()),
  overtimeHours: parseFloat(entry.overtimeHours.toString()),
  permessoHours: parseFloat(entry.permessoHours.toString()),
  vacationHours: parseFloat(entry.vacationHours.toString()),
  sicknessHours: parseFloat(entry.sicknessHours.toString()),
  permesso104Hours: parseFloat(entry.permesso104Hours.toString()),
  paternityHours: parseFloat(entry.paternityHours.toString()),
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

  const now = new Date();
  const params = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  // Common query selection
  const querySelect = {
    id: true,
    userId: true,
    workDate: true,
    hoursWorked: true,
    overtimeHours: true,
    permessoHours: true,
    permesso104Hours: true,
    paternityHours: true,
    vacationHours: true,
    sicknessHours: true,
    morningStart: true,
    morningEnd: true,
    afternoonStart: true,
    afternoonEnd: true,
    notes: true,
  };

  let users: UserRow[] = [];
  let targetUserId = session.user.id;
  let targetUserName = session.user.name ?? session.user.email;
  let targetUserFeatures = {
    hasPermesso104: session.user.hasPermesso104,
    hasPaternityLeave: session.user.hasPaternityLeave,
  };

  if (isAdmin) {
    // Get all users for the dropdown
    users = (await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        hasPermesso104: true,
        hasPaternityLeave: true,
      },
    })) as UserRow[];

    // Determine which user's calendar to show
    if (params.userId) {
      targetUserId = params.userId;
      const targetUser = users.find((u) => u.id === targetUserId);
      if (targetUser) {
        targetUserName = targetUser.name ?? targetUser.email;
        targetUserFeatures = {
          hasPermesso104: targetUser.hasPermesso104,
          hasPaternityLeave: targetUser.hasPaternityLeave,
        };
      }
    } else {
      const me = users.find((u) => u.id === session.user.id);
      if (me) {
        targetUserFeatures = {
          hasPermesso104: me.hasPermesso104,
          hasPaternityLeave: me.hasPaternityLeave,
        };
      }
    }
  }

  // Fetch entries for the target user
  const entries = (await prisma.timeEntry.findMany({
    where: {
      userId: targetUserId,
      workDate: {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      },
    },
    select: querySelect,
    orderBy: { workDate: "asc" },
  })) as PrismaEntry[];

  const plain = entries.map(toDto);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {isAdmin && (
        <UserSelector users={users} selectedUserId={targetUserId} />
      )}
      
      <TimesheetCalendar
        initialEntries={plain}
        userName={targetUserName}
        hideHeader={true}
        targetUserId={isAdmin ? targetUserId : undefined}
        userFeatures={targetUserFeatures}
        isAdmin={isAdmin}
      />
    </div>
  );
}
