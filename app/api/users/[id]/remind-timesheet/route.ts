import { sendMissingTimesheetReminderEmail } from "@/lib/email";
import { findUserById } from "@/lib/utils/user-utils";
import { requireAdmin } from "@/lib/api-middleware";
import { successResponse, notFoundResponse, handleError } from "@/lib/api-responses";
import { getMissingDaysForUser, formatMissingDatesIT } from "@/lib/utils/timesheet-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id: userId } = await params;

    const user = await findUserById(userId);
    if (!user) {
      return notFoundResponse("Utente non trovato");
    }

    // Find missing working days in the last 5 days (any 2 missing triggers the check)
    const missingDates = await getMissingDaysForUser(userId, 5);

    let missingDatesFormatted: string;
    if (missingDates.length === 0) {
      // Admin manually triggered: send the reminder even if no missing days detected
      const today = new Date();
      today.setDate(today.getDate() - 1);
      const fallback = today.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      missingDatesFormatted = fallback;
    } else {
      missingDatesFormatted = formatMissingDatesIT(missingDates);
    }

    const result = await sendMissingTimesheetReminderEmail(
      user.email,
      user.name ?? user.email,
      missingDatesFormatted
    );

    if (!result.success) {
      return handleError(new Error("Impossibile inviare l'email. Controlla la configurazione SMTP."));
    }

    console.log(`✅ Promemoria timesheet inviato a ${user.email} dall'admin`);
    return successResponse({
      message: `Promemoria inviato con successo a ${user.email}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
