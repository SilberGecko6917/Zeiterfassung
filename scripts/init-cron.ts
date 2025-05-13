import { processBreaks } from "./process-breaks";

let initialized = false;

export function initCronJobs() {
  if (initialized) {
    console.log("Cron jobs already initialized, skipping...");
    return;
  }

  console.log("Initializing cron jobs...");

  processBreaks();

  initialized = true;
  console.log("Cron jobs initialization complete.");
}

export { processBreaks };
