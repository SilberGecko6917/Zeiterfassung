import { subDays } from "date-fns";
import cron from "node-cron";

let taskRegistered = false;

async function processBreaksForDate(targetDate: Date) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/time/auto-breaks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRONEJOB_KEY}`,
      },
      body: JSON.stringify({
        date: targetDate.toISOString(),
      }),
    });

    // Check if response is OK before parsing
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        console.error("Failed to process breaks:", errorData.error || `HTTP ${response.status}`);
      } else {
        const errorText = await response.text();
        console.error("Failed to process breaks:", errorText || `HTTP ${response.status}`);
      }
      return;
    }

    // Parse JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid response format: expected JSON but got", contentType);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log(
        `Successfully processed breaks for ${result.processedUsers} users`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.breaks.forEach((breakInfo: any) => {
        console.log(
          `- User: ${breakInfo.userName}, Break duration: ${breakInfo.breakDuration} minutes`
        );
      });
    } else {
      console.error("Failed to process breaks:", result.error);
    }
  } catch (error) {
    console.error("Error running break distribution:", error);
  }
}

export async function processBreaks() {
  if (!taskRegistered) {
    console.log("Registering cron job for automatic break processing...");

    cron.schedule("59 23 * * *", async () => {
      console.log("Running scheduled automatic break processing...");
      const yesterday = subDays(new Date(), 1);
      await processBreaksForDate(yesterday);
    });

    taskRegistered = true;
  }

  const yesterday = subDays(new Date(), 1);
  await processBreaksForDate(yesterday);
}

if (require.main === module) {
  processBreaks()
    .then(() => console.log("Manual execution completed"))
    .catch((err) => {
      console.error("Fatal error during manual execution:", err);
      process.exit(1);
    });
}
