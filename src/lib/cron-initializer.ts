import { initCronJobs } from "../../scripts/init-cron";

let initialized = false;

export function initializeServerCron() {
  if (!initialized) {
    console.log("Initializing cron jobs at server startup...");
    initCronJobs();
    initialized = true;
  }
}
