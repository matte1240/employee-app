import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  handleError,
} from "@/lib/api-responses";
import {
  getUserSchedules,
  createDefaultSchedulesForUser,
} from "@/lib/utils/schedule-utils";

/**
 * GET /api/users/me/schedule
 * Get the current user's working schedules
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;

    // Get user's canWorkSunday flag
    const userWithFlags = await prisma.user.findUnique({
      where: { id: userId },
      select: { canWorkSunday: true },
    });

    // Get schedules
    let schedules = await getUserSchedules(userId);

    // If no schedules exist, create default ones
    if (schedules.length === 0) {
      await createDefaultSchedulesForUser(userId);
      schedules = await getUserSchedules(userId);
    }

    return successResponse({
      schedules,
      canWorkSunday: userWithFlags?.canWorkSunday ?? false,
    });
  } catch (err) {
    return handleError(err);
  }
}
