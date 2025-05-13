import { checkIsAdmin } from "@/lib/server/auth-actions";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/server/user-service";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const formated: boolean = url.searchParams.get("formated") === "true";

    const end = endOfDay(new Date()); // Today
    const daysCount = daysParam ? parseInt(daysParam, 10) : 7; // Default to 7 days if not specified
    const start = startOfDay(subDays(end, daysCount));

    const logs = await prisma.log.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    if (formated) {
      // Create an array of promises for user data fetching
      const logsWithUserPromises = logs.map(async (log) => ({
        ...log,
        date: log.date.toISOString(),
        user: log.userId ? await getUserById(log.userId) : null,
      }));

      // Resolve all promises
      const formattedLogs = await Promise.all(logsWithUserPromises);

      return new Response(JSON.stringify(formattedLogs), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(logs), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
