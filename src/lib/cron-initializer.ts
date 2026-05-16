import { initCronJobs } from "../../scripts/init-cron";

let initialized = false;

export function initializeServerCron() {
  if (!initialized) {
    initCronJobs();
    initialized = true;
  }
}
