import { NextRequest, NextResponse } from "next/server";
import { formatDate, formatTime } from "@/lib/format-utils";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, checkPermission } from "@/lib/server/auth-actions";
import { format, subDays, subMonths, subYears } from "date-fns";

interface UserSummary {
  name: string;
  email: string;
  totalDuration: number;
  totalBreakDuration: number;
  entryCount: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission - admin or manager with export_reports permission
    const isAdmin = await checkIsAdmin();
    const hasExportPermission = await checkPermission("export_reports");
    
    if (!isAdmin && !hasExportPermission) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "month";
    const userId = url.searchParams.get("userId") || undefined;

    let startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "day":
        startDate = subDays(endDate, 1);
        break;
      case "month":
        startDate = subMonths(endDate, 1);
        break;
      case "year":
        startDate = subYears(endDate, 1);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }

    // Get time entries from database
    const timeEntries = await prisma.trackedTime.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { name: "asc" } }, { startTime: "asc" }],
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Zeiterfassung System";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    
    // Create overview sheet
    const summarySheet = workbook.addWorksheet("Übersicht");
    
    // Create header row
    summarySheet.mergeCells('A1:G1');
    const titleRow = summarySheet.getCell('A1');
    titleRow.value = "ARBEITSZEITNACHWEIS";
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: 'center' };
    
    // Format dates for header
    const formattedStartDate = await formatDate(startDate);
    const formattedEndDate = await formatDate(endDate);
    const formattedCreationDate = await formatDate(new Date());
    
    summarySheet.mergeCells('A2:G2');
    const periodRow = summarySheet.getCell('A2');
    periodRow.value = `Zeitraum: ${formattedStartDate} bis ${formattedEndDate}`;
    periodRow.font = { size: 12, italic: true };
    periodRow.alignment = { horizontal: 'center' };
    
    summarySheet.mergeCells('A4:B4');
    summarySheet.getCell('A4').value = "Erstellt am:";
    summarySheet.getCell('A4').font = { bold: true };
    
    summarySheet.getCell('C4').value = formattedCreationDate;
    
    const userSummary: Record<string, UserSummary> = {};
    timeEntries.forEach(entry => {
      const userId = entry.user?.id || 'unknown';
      if (!userSummary[userId]) {
        userSummary[userId] = {
          name: entry.user?.name || 'Unbekannt',
          email: entry.user?.email || '',
          totalDuration: 0,
          totalBreakDuration: 0,
          entryCount: 0
        };
      }
      
      userSummary[userId].totalDuration += Number(entry.duration);
      userSummary[userId].entryCount += 1;
      
      // Add break duration if entry is a break
      if (entry.isBreak && entry.duration > 0) {
        userSummary[userId].totalBreakDuration += Number(entry.duration || 0);
      }
    });
    
    // Create summary table
    summarySheet.addRow([]);
    summarySheet.addRow(['Mitarbeiter', 'E-Mail', 'Einträge', 'Arbeitszeit (h)', 'Pausenzeit (h)', 'Nettoarbeitszeit (h)']);
    
    // Header styling
    const summaryHeaderRow = summarySheet.lastRow;
    if (summaryHeaderRow) {
      summaryHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });
    }
    
    Object.values(userSummary).forEach(user => {
      const totalHours = user.totalDuration / 3600;
      const totalBreakHours = user.totalBreakDuration / 3600;
      const netHours = totalHours - totalBreakHours;
      
      summarySheet.addRow([
        user.name,
        user.email,
        user.entryCount,
        totalHours.toFixed(2),
        totalBreakHours.toFixed(2),
        netHours.toFixed(2)
      ]);
    });
    
    // Worktime details sheet
    const worksheet = workbook.addWorksheet("Zeiteinträge");

    // Define Header
    worksheet.columns = [
      { header: "Mitarbeiter", key: "user", width: 25 },
      { header: "E-Mail", key: "email", width: 30 },
      { header: "Datum", key: "date", width: 15 },
      { header: "Start", key: "start", width: 10 },
      { header: "Ende", key: "end", width: 10 },
      { header: "Dauer (h)", key: "duration", width: 12 },
      { header: "Pausen (h)", key: "breakDuration", width: 12 },
      { header: "Netto (h)", key: "netDuration", width: 12 },
      { header: "Details", key: "details", width: 40 }
    ];

    // Header-Styling
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    
    // Alternate row coloring
    worksheet.addConditionalFormatting({
      ref: 'A2:I1000',
      rules: [
        {
          type: 'expression',
          formulae: ['MOD(ROW(),2)=0'],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: {argb: 'FFE6F0FF'}
            }
          }
        }
      ]
    });

    // Add data to worksheet
    for (const entry of timeEntries) {
      const formattedDate = await formatDate(entry.startTime);
      const formattedStartTime = await formatTime(entry.startTime);
      const formattedEndTime = entry.endTime ? await formatTime(entry.endTime) : "Läuft";

      // Calculate duration in hours
      const durationHours = Number(entry.duration) / 3600;
      
      // Pausendauer berechnen
      let totalBreakDuration = 0;
      let breakDetails = '';
      
      if (entry.isBreak && entry.duration > 0) {
        totalBreakDuration += Number(entry.duration || 0);
        const breakStart = entry.startTime ? format(new Date(entry.startTime), "HH:mm") : "?";
        const breakEnd = entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "?";
        breakDetails += `${breakStart}-${breakEnd} (${(Number(entry.duration || 0)/3600).toFixed(2)}h), `;
        
        if (breakDetails.length > 2) {
          breakDetails = breakDetails.slice(0, -2); // Remove last comma and space
        }
      }
      
      const breakDurationHours = totalBreakDuration / 3600;
      const netDurationHours = durationHours - breakDurationHours;
      
      worksheet.addRow({
        user: entry.user?.name || "Unbekannt",
        email: entry.user?.email || "",
        date: formattedDate,
        start: formattedStartTime,
        end: formattedEndTime,
        duration: durationHours.toFixed(2),
        breakDuration: breakDurationHours.toFixed(2),
        netDuration: netDurationHours.toFixed(2),
        details: breakDetails || "Keine Pausen"
      });
    }

    // Auto-filter for the header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    // Save workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the buffer as a downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Arbeitszeitnachweis-${format(
          startDate,
          "yyyy-MM-dd"
        )}-bis-${format(
          endDate,
          "yyyy-MM-dd"
        )}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
