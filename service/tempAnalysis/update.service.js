import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000

export const updateTempAnalysis = async (req) => {
    try {
        const { id } = req.params

        if (!id) {
            throw new AppError("Analysis ID is required", 400)
        }

        // check the if clerkId exist then stop , because this is for only temp guest user 
        const dbUser = await getAuthUser(req)
        if (dbUser?.id) {
            throw new AppError("Failed to Update.", 400)
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

        const {
            resumeRawText,
            resumeStructuredText,
            jobRawText,
            jobStructuredText,
            atsScore,
            matchedSkills,
            missingSkills,
            matchedKeywords,
            insights,
            result,
            resumeContentHash,
            jobContentHash,
        } = req.body

        const updated = await prisma.tempAnalysis.update({
            where: { id },
            data: {
                ...(resumeRawText !== undefined && { resumeRawText }),
                ...(resumeStructuredText !== undefined && { resumeStructuredText }),
                ...(jobRawText !== undefined && { jobRawText }),
                ...(jobStructuredText !== undefined && { jobStructuredText }),
                ...(atsScore !== undefined && { atsScore }),
                ...(matchedSkills !== undefined && { matchedSkills }),
                ...(missingSkills !== undefined && { missingSkills }),
                ...(matchedKeywords !== undefined && { matchedKeywords }),
                ...(insights !== undefined && { insights }),
                ...(result !== undefined && { result }),
                ...(resumeContentHash !== undefined && { resumeContentHash }),
                ...(jobContentHash !== undefined && { jobContentHash }),
                updatedAt: new Date(),
            },
        })

        return updated
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Update Temp Analysis Error:", error)
        throw new AppError(error.message || "Failed to update temporary analysis", 500)
    }
}
