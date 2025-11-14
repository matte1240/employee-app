import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

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
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Time Tracker";
    workbook.created = new Date();

    // Function to add a worksheet for a user
    const addUserSheet = async (userId: string) => {
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

      // Create worksheet with user name
      const sheetName = (user.name || user.email).replace(/[^a-z0-9 ]/gi, "_").substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      // Set column widths
      worksheet.columns = [
        { key: "date", width: 12 },
        { key: "morningStart", width: 14 },
        { key: "morningEnd", width: 14 },
        { key: "afternoonStart", width: 16 },
        { key: "afternoonEnd", width: 16 },
        { key: "hoursWorked", width: 14 },
        { key: "overtime", width: 12 },
        { key: "permessoHours", width: 15 },
        { key: "totalHours", width: 12 },
        { key: "notes", width: 40 },
      ];

      // Add title row
      const titleRow = worksheet.addRow([
        `Time Entries - ${user.name || user.email} - ${month}`,
      ]);
      titleRow.font = { size: 14, bold: true };
      worksheet.mergeCells("A1:J1");
      titleRow.alignment = { horizontal: "center", vertical: "middle" };
      titleRow.height = 25;

      // Add header row
      const headerRow = worksheet.addRow([
        "Date",
        "Morning Start",
        "Morning End",
        "Afternoon Start",
        "Afternoon End",
        "Hours Worked",
        "Overtime",
        "Permesso Hours",
        "Total Hours",
        "Notes",
      ]);

      // Style header row
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 20;

      // Add data rows
      let totalHoursSum = 0;
      let totalOvertimeSum = 0;
      let totalPermessoSum = 0;

      entries.forEach((entry) => {
        const hoursWorked = parseFloat(entry.hoursWorked.toString());
        const overtime = parseFloat(entry.overtimeHours.toString());
        const permessoHours = entry.permessoHours
          ? parseFloat(entry.permessoHours.toString())
          : 0;
        const totalHours = hoursWorked + overtime;

        totalHoursSum += hoursWorked;
        totalOvertimeSum += overtime;
        totalPermessoSum += permessoHours;

        const row = worksheet.addRow({
          date: entry.workDate,
          morningStart: entry.morningStart || "",
          morningEnd: entry.morningEnd || "",
          afternoonStart: entry.afternoonStart || "",
          afternoonEnd: entry.afternoonEnd || "",
          hoursWorked: hoursWorked,
          overtime: overtime,
          permessoHours: permessoHours,
          totalHours: totalHours,
          notes: entry.notes || "",
        });

        // Format date cell
        row.getCell(1).numFmt = "dd/mm/yyyy";

        // Format number cells (2 decimals)
        row.getCell(6).numFmt = "0.00"; // Hours Worked
        row.getCell(7).numFmt = "0.00"; // Overtime
        row.getCell(8).numFmt = "0.00"; // Permesso Hours
        row.getCell(9).numFmt = "0.00"; // Total Hours

        // Alternate row colors
        if (worksheet.rowCount % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        }
      });

      // Add empty row
      worksheet.addRow([]);

      // Add summary row
      const summaryRow = worksheet.addRow([
        "TOTAL",
        "",
        "",
        "",
        "",
        totalHoursSum,
        totalOvertimeSum,
        totalPermessoSum,
        totalHoursSum + totalOvertimeSum,
        "",
      ]);

      summaryRow.font = { bold: true, size: 12 };
      summaryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD966" },
      };

      // Format summary numbers
      summaryRow.getCell(6).numFmt = "0.00";
      summaryRow.getCell(7).numFmt = "0.00";
      summaryRow.getCell(8).numFmt = "0.00";
      summaryRow.getCell(9).numFmt = "0.00";

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }
      });

      // Center align time cells
      worksheet.getColumn(2).alignment = { horizontal: "center" };
      worksheet.getColumn(3).alignment = { horizontal: "center" };
      worksheet.getColumn(4).alignment = { horizontal: "center" };
      worksheet.getColumn(5).alignment = { horizontal: "center" };

      // Right align number cells
      worksheet.getColumn(6).alignment = { horizontal: "right" };
      worksheet.getColumn(7).alignment = { horizontal: "right" };
      worksheet.getColumn(8).alignment = { horizontal: "right" };
      worksheet.getColumn(9).alignment = { horizontal: "right" };
    };

    // Add a sheet for each user
    for (const userId of userIds) {
      await addUserSheet(userId);
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hours_export_${month}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
