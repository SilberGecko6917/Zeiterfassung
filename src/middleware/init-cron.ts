import { initCronJobs } from "../../scripts/init-cron";

let jobsInitialized = false;

export function initCronJobsMiddleware() {
  if (!jobsInitialized && process.env.NODE_ENV === "production") {
    console.log("Initializing Cron Jobs...");
    initCronJobs();
    jobsInitialized = true;
  }
}
