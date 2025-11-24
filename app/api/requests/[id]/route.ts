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

const updateRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["VACATION", "SICKNESS", "PERMESSO"]).optional(),
  reason: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
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

    // Allow status change even if not pending (admin override)

    // Update status
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
    });

    if (status === "APPROVED") {
      // Generate TimeEntries only for VACATION and SICKNESS
      // PERMESSO requests are just marked in the calendar, user enters hours manually
      if (request.type !== "PERMESSO") {
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session || !isAdmin(session)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = updateRequestSchema.parse(json);
    const { id } = await params;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // Validate PERMESSO constraints
    if (body.type === "PERMESSO" || (body.type === undefined && request.type === "PERMESSO")) {
      const startDate = body.startDate ? new Date(body.startDate) : request.startDate;
      const endDate = body.endDate ? new Date(body.endDate) : request.endDate;
      
      if (startDate.getTime() !== endDate.getTime()) {
        return new NextResponse("Permesso requests must be for a single day", { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.type) updateData.type = body.type;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.status) updateData.status = body.status;

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session || !isAdmin(session)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    await prisma.leaveRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}
