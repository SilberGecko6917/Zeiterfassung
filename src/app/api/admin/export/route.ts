import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server/auth-actions";
import { format, subDays, subMonths, subYears } from "date-fns";
import * as ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    // Administratorzugriff prüfen
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parameter aus der URL abrufen
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "month";
    const userId = url.searchParams.get("userId") || undefined;

    // Zeitraum berechnen
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

    // Zeiteinträge abrufen
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

    // Excel-Workbook erstellen
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Zeiterfassung";
    workbook.created = new Date();

    // Arbeitsblatt erstellen
    const worksheet = workbook.addWorksheet("Zeiteinträge");

    // Header definieren
    worksheet.columns = [
      { header: "Benutzer", key: "user", width: 25 },
      { header: "E-Mail", key: "email", width: 30 },
      { header: "Datum", key: "date", width: 15 },
      { header: "Start", key: "start", width: 10 },
      { header: "Ende", key: "end", width: 10 },
      { header: "Dauer (h)", key: "duration", width: 12 },
      { header: "Dauer (HH:MM:SS)", key: "durationFormatted", width: 15 },
    ];

    // Header-Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Daten hinzufügen
    timeEntries.forEach((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : new Date();

      // Dauer in Stunden mit 2 Dezimalstellen
      const durationHours = Number(entry.duration) / 3600;

      // Dauer im Format HH:MM:SS
      const hours = Math.floor(Number(entry.duration) / 3600);
      const minutes = Math.floor((Number(entry.duration) % 3600) / 60);
      const seconds = Number(entry.duration) % 60;
      const durationFormatted = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      worksheet.addRow({
        user: entry.user?.name || "Unbekannt",
        email: entry.user?.email || "",
        date: format(startTime, "dd.MM.yyyy"),
        start: format(startTime, "HH:mm"),
        end: format(endTime, "HH:mm"),
        duration: durationHours.toFixed(2),
        durationFormatted,
      });
    });

    // Automatische Filter aktivieren
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 },
    };

    // Excel-Datei als Buffer speichern
    const buffer = await workbook.xlsx.writeBuffer();

    // Response mit Excel-Datei zurückgeben
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=zeiterfassung-export-${format(
          new Date(),
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
