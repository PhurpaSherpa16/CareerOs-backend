import prisma from "../../lib/prisma.js"

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000

export const cleanExpiredTempAnalyses = async () => {
    try {
        const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_IN_MS)
        const result = await prisma.tempAnalysis.deleteMany({
            where: {
                createdAt: {
                    lt: fiveDaysAgo,
                },
            },
        })
        if (result.count > 0) {
            console.log(`[Cron] Cleaned up ${result.count} expired TempAnalysis records older than 5 days.`)
        }
        return result
    } catch (error) {
        console.error("[Cron Error] Failed to delete expired TempAnalysis records:", error)
    }
}
