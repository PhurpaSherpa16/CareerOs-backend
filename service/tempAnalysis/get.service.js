import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000

export const getTempAnalysis = async (req) => {
    try {
        const { id } = req.params

        if (!id) {
            throw new AppError("Analysis ID is required", 400)
        }

        const tempAnalysis = await prisma.tempAnalysis.findUnique({
            where: { id },
        })

        if (!tempAnalysis) {
            throw new AppError("Temporary analysis not found", 404)
        }

        // Check if record is older than 5 days
        const isExpired = (Date.now() - new Date(tempAnalysis.createdAt).getTime()) > FIVE_DAYS_IN_MS

        if (isExpired) {
            // Auto delete expired record from database
            await prisma.tempAnalysis.delete({
                where: { id },
            })
            throw new AppError("Analysis expired and deleted", 404)
        }

        return tempAnalysis
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Get Temp Analysis Error:", error)
        throw new AppError(error.message || "Failed to fetch temporary analysis", 500)
    }
}
