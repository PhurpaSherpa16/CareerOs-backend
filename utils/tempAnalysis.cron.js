import cron from "node-cron"
import { cleanExpiredTempAnalyses } from "../service/tempAnalysis/cleanup.service.js"

export const initTempAnalysisCron = () => {
    // Run cleanup immediately on server startup
    cleanExpiredTempAnalyses()

    // Schedule cron job to run every hour (0 * * * *)
    cron.schedule("0 * * * *", async () => {
        console.log("[Cron] Running scheduled cleanup for expired TempAnalysis records...")
        await cleanExpiredTempAnalyses()
    })

    console.log("[Cron] TempAnalysis 5-day auto-deletion cron job initialized.")
}
