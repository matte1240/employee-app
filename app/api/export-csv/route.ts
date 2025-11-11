import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import archiver from "archiver";
import { Readable } from "stream";

const exportSchema = z.object({
  userIds: z.array(z.string()),
  month: z.string().regex(/^\d{4}-\d{2}$/), // Format: YYYY-MM
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = exportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userIds, month } = parsed.data;
  const [year, monthNum] = month.split("-");
  const startDate = new Date(`${year}-${monthNum}-01T00:00:00.000Z`);
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month
  endDate.setUTCHours(23, 59, 59, 999);

  try {
    // Function to generate CSV content for a user
    const generateCSV = async (userId: string): Promise<{ csv: string; userName: string }> => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const entries = await prisma.timeEntry.findMany({
        where: {
          userId,
          workDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { workDate: "asc" },
      });

      // CSV Header
      let csv = "Date,Morning Start,Morning End,Afternoon Start,Afternoon End,Hours Worked,Overtime,Total Hours,Notes\n";

      // CSV Rows
      entries.forEach((entry) => {
        const workDate = entry.workDate.toISOString().split("T")[0];
        const hoursWorked = parseFloat(entry.hoursWorked.toString());
        const overtime = parseFloat(entry.overtimeHours.toString());
        const totalHours = hoursWorked + overtime;
        const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : "";

        csv += `${workDate},${entry.morningStart || ""},${entry.morningEnd || ""},${entry.afternoonStart || ""},${entry.afternoonEnd || ""},${hoursWorked.toFixed(2)},${overtime.toFixed(2)},${totalHours.toFixed(2)},${notes}\n`;
      });

      // Add summary row
      const totalHoursSum = entries.reduce((sum, e) => sum + parseFloat(e.hoursWorked.toString()), 0);
      const totalOvertimeSum = entries.reduce((sum, e) => sum + parseFloat(e.overtimeHours.toString()), 0);
      const grandTotal = totalHoursSum + totalOvertimeSum;

      csv += `\nSummary,,,,,,,,\n`;
      csv += `Total Hours Worked,,,,,,${totalHoursSum.toFixed(2)},${totalOvertimeSum.toFixed(2)},${grandTotal.toFixed(2)},\n`;

      return { csv, userName: user.name || user.email };
    };

    // Single user: return CSV
    if (userIds.length === 1) {
      const { csv, userName } = await generateCSV(userIds[0]);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${userName.replace(/[^a-z0-9]/gi, "_")}_${month}.csv"`,
        },
      });
    }

    // Multiple users: create ZIP
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    // Collect archive data
    archive.on("data", (chunk) => chunks.push(chunk));

    // Add CSV files to archive
    for (const userId of userIds) {
      const { csv, userName } = await generateCSV(userId);
      archive.append(csv, { name: `${userName.replace(/[^a-z0-9]/gi, "_")}_${month}.csv` });
    }

    // Finalize archive
    await archive.finalize();

    // Wait for all chunks
    await new Promise((resolve) => {
      archive.on("end", resolve);
    });

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="hours_export_${month}.zip"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
