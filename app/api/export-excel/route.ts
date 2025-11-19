import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/utils/user-utils";

const exportSchema = z.object({
  userIds: z.array(z.string()),
  month: z.string().regex(/^\d{4}-\d{2}$/), // Format: YYYY-MM
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = exportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userIds, month } = parsed.data;

  // Check permissions: admin can export any users, employees can only export themselves
  if (!isAdmin(session)) {
    if (userIds.length !== 1 || userIds[0] !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }
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

      // Check if this specific user has any medical certificates in this month
      const includeMedicalCertificate = entries.some(
        (e) => e.medicalCertificate !== null && e.medicalCertificate !== ""
      );

      // Create worksheet with user name
      const sheetName = (user.name || user.email).replace(/[^a-z0-9 ]/gi, "_").substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      // Set column widths
      const columns = [
        { key: "date", width: 12 },
        { key: "morningStart", width: 14 },
        { key: "morningEnd", width: 14 },
        { key: "afternoonStart", width: 16 },
        { key: "afternoonEnd", width: 16 },
        { key: "hoursWorked", width: 14 },
        { key: "overtime", width: 12 },
        { key: "permFerieHours", width: 15 },
        { key: "sicknessHours", width: 15 },
        { key: "totalHours", width: 12 },
      ];

      if (includeMedicalCertificate) {
        columns.push({ key: "certificatoMedico", width: 18 });
      }

      columns.push({ key: "notes", width: 40 });
      worksheet.columns = columns;

      // Format month for title (Italian)
      const [y, m] = month.split("-");
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
      const monthName = dateObj.toLocaleString("it-IT", { month: "long" });
      const capitalizedMonth =
        monthName.charAt(0).toUpperCase() + monthName.slice(1);

      // Add title row
      const titleRow = worksheet.addRow([
        `Presenze - ${user.name || user.email} - ${capitalizedMonth} ${y}`,
      ]);
      titleRow.font = { size: 14, bold: true };
      const lastColumn = includeMedicalCertificate ? "K" : "J";
      worksheet.mergeCells(`A1:${lastColumn}1`);
      titleRow.alignment = { horizontal: "left", vertical: "middle" };
      titleRow.height = 25;

      // Add header row
      const headerColumns = [
        "Data",
        "Inizio Mattina",
        "Fine Mattina",
        "Inizio Pomeriggio",
        "Fine Pomeriggio",
        "Ore Ordinarie",
        "Straordinario",
        "Ore Perm/Ferie",
        "Ore Malattia",
        "Totale Ore",
      ];

      if (includeMedicalCertificate) {
        headerColumns.push("Certificato Medico");
      }

      headerColumns.push("Note");

      const headerRow = worksheet.addRow(headerColumns);

      // Style header row
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 20;
      for (let i = 1; i <= columns.length; i++) {
        headerRow.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
      }

      // Add data rows
      let totalHoursSum = 0;
      let totalOvertimeSum = 0;
      let totalPermFerieSum = 0;
      let totalSicknessSum = 0;

      entries.forEach((entry) => {
        const hoursWorked = parseFloat(entry.hoursWorked.toString());
        const overtime = parseFloat(entry.overtimeHours.toString());
        const permessoHours = entry.permessoHours
          ? parseFloat(entry.permessoHours.toString())
          : 0;
        const sicknessHours = entry.sicknessHours
          ? parseFloat(entry.sicknessHours.toString())
          : 0;
        const vacationHours = entry.vacationHours
          ? parseFloat(entry.vacationHours.toString())
          : 0;
        const permFerieHours = permessoHours + vacationHours;
        const totalHours = hoursWorked + overtime;

        // Extract medical certificate from the dedicated field
        const certificatoMedico = entry.medicalCertificate || "";

        totalHoursSum += hoursWorked;
        totalOvertimeSum += overtime;
        totalPermFerieSum += permFerieHours;
        totalSicknessSum += sicknessHours;

        // Helper to remove "PERM" from time fields
        const cleanTimeValue = (val: string | null) => (val === "PERM" ? "" : val || "");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowData: Record<string, any> = {
          date: entry.workDate,
          morningStart: cleanTimeValue(entry.morningStart),
          morningEnd: cleanTimeValue(entry.morningEnd),
          afternoonStart: cleanTimeValue(entry.afternoonStart),
          afternoonEnd: cleanTimeValue(entry.afternoonEnd),
          hoursWorked: hoursWorked,
          overtime: overtime,
          permFerieHours: permFerieHours,
          sicknessHours: sicknessHours,
          totalHours: totalHours,
        };

        if (includeMedicalCertificate) {
          rowData.certificatoMedico = certificatoMedico;
        }

        rowData.notes = entry.notes || "";

        const row = worksheet.addRow(rowData);

        // Set formula for Total Hours (Column J / 10) = F + G
        row.getCell(10).value = {
          formula: `F${row.number}+G${row.number}`,
          result: totalHours,
        };

        // Format date cell
        row.getCell(1).numFmt = "dd/mm/yyyy";

        // Format number cells (2 decimals)
        row.getCell(6).numFmt = "0.00"; // Hours Worked
        row.getCell(7).numFmt = "0.00"; // Overtime
        row.getCell(8).numFmt = "0.00"; // Perm/Ferie Hours
        row.getCell(9).numFmt = "0.00"; // Sickness Hours
        row.getCell(10).numFmt = "0.00"; // Total Hours

        // Alternate row colors
        if (worksheet.rowCount % 2 === 0) {
          for (let i = 1; i <= columns.length; i++) {
            row.getCell(i).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          }
        }
      });

      const lastDataRow = worksheet.rowCount;
      const firstDataRow = 3;

      // Add empty row
      worksheet.addRow([]);

      // Add summary row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summaryColumns: any[] = [
        "TOTALE",
        "",
        "",
        "",
        "",
        { formula: `SUM(F${firstDataRow}:F${lastDataRow})`, result: totalHoursSum },
        { formula: `SUM(G${firstDataRow}:G${lastDataRow})`, result: totalOvertimeSum },
        { formula: `SUM(H${firstDataRow}:H${lastDataRow})`, result: totalPermFerieSum },
        { formula: `SUM(I${firstDataRow}:I${lastDataRow})`, result: totalSicknessSum },
        { formula: `SUM(J${firstDataRow}:J${lastDataRow})`, result: totalHoursSum + totalOvertimeSum },
      ];

      if (includeMedicalCertificate) {
        summaryColumns.push("");
      }

      summaryColumns.push("");

      const summaryRow = worksheet.addRow(summaryColumns);

      summaryRow.font = { bold: true, size: 12 };
      for (let i = 1; i <= columns.length; i++) {
        summaryRow.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
      }

      // Format summary numbers
      summaryRow.getCell(6).numFmt = "0.00";
      summaryRow.getCell(7).numFmt = "0.00";
      summaryRow.getCell(8).numFmt = "0.00";
      summaryRow.getCell(9).numFmt = "0.00";
      summaryRow.getCell(10).numFmt = "0.00";

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
      worksheet.getColumn(10).alignment = { horizontal: "right" };
      worksheet.getColumn(11).alignment = { horizontal: "right" };
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
