import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/utils/user-utils";

const createRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["VACATION", "SICKNESS", "PERMESSO"]),
  reason: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = createRequestSchema.parse(json);
    const userId = session.user.id;

    if (body.type === "PERMESSO") {
      if (!body.startTime || !body.endTime) {
        return new NextResponse("Start time and end time are required for Permesso", { status: 400 });
      }
      if (body.startDate !== body.endDate) {
        return new NextResponse("Permesso requests must be for a single day", { status: 400 });
      }
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (endDate < startDate) {
      return new NextResponse("End date must be after start date", { status: 400 });
    }

    // Check for overlaps with existing requests
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (existingRequest) {
      return new NextResponse("Request overlaps with an existing request", { status: 409 });
    }
    
    // Check for overlaps with existing TimeEntries
    const existingEntry = await prisma.timeEntry.findFirst({
        where: {
            userId,
            workDate: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    if (existingEntry) {
        return new NextResponse("Request overlaps with existing time entries", { status: 409 });
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate,
        endDate,
        type: body.type,
        reason: body.reason,
        startTime: body.startTime,
        endTime: body.endTime,
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  const statusParam = searchParams.get("status");

  // Only admin can view other users' requests
  if (userIdParam && userIdParam !== session.user.id && !isAdmin(session)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const where: any = {};
  
  if (userIdParam) {
    where.userId = userIdParam;
  } else if (!isAdmin(session)) {
    // If not admin and no userId specified, show own requests
    where.userId = session.user.id;
  }
  // If admin and no userId, show all (or filter by status)

  if (statusParam) {
    where.status = statusParam;
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(requests);
}
