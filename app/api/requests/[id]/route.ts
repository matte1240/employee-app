import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/utils/user-utils";
import { isHoliday } from "@/lib/utils/holiday-utils";
import { createCalendarEvent } from "@/lib/google-calendar";
import { addDays, isWeekend } from "date-fns";

const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session || !isAdmin(session)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const { status } = updateStatusSchema.parse(json);
    const { id } = await params;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    if (request.status !== "PENDING") {
      return new NextResponse("Request is already processed", { status: 400 });
    }

    // Update status
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
    });

    if (status === "APPROVED") {
      // Generate TimeEntries
      const entriesToCreate = [];
      let currentDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      while (currentDate <= endDate) {
        // Skip weekends and holidays
        if (!isWeekend(currentDate) && !isHoliday(currentDate)) {
          const entryData: any = {
            userId: request.userId,
            workDate: new Date(currentDate),
            hoursWorked: 0, 
          };

          // Assuming 8 hours for a full day of leave
          const hours = 8; 

          if (request.type === "VACATION") {
            entryData.vacationHours = hours;
          } else if (request.type === "SICKNESS") {
            entryData.sicknessHours = hours;
          } else if (request.type === "PERMESSO") {
            entryData.permessoHours = hours;
          }

          entriesToCreate.push(entryData);
        }
        currentDate = addDays(currentDate, 1);
      }

      // Transaction to create entries
      if (entriesToCreate.length > 0) {
          await prisma.$transaction(
              entriesToCreate.map(data => prisma.timeEntry.create({ data }))
          );
      }

      // Create Google Calendar Event
      const eventTitle = `${request.user.name || 'Employee'} - ${request.type}`;
      // Google Calendar end date is exclusive for all-day events, so we add 1 day to the end date
      await createCalendarEvent({
        title: eventTitle,
        start: request.startDate,
        end: addDays(request.endDate, 1), 
        description: request.reason || undefined,
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}
