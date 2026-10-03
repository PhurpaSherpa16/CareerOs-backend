import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const updateAnalysis = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        const { id } = req.params
        if (!id) throw new AppError("Analysis ID is required in route parameter", 400)

        // 2. Fetch existing analysis by ID
        const existingAnalysis = await prisma.analysis.findUnique({
            where: { id },
        })

        if (!existingAnalysis) {
            throw new AppError("Analysis record not found", 404)
        }

        // Get resumeId and jobId directly from the existing analysis record
        const { resumeId, jobId } = existingAnalysis


        // 3. Verify resume existence & user ownership
        const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
        })

        if (!resume) throw new AppError("Resume not found", 404)

        if (resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission for this resume", 403)
        }

        // 4. Verify job existence
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        })

        if (!job) throw new AppError("Job not found", 404)

        // 5. Extract updated analysis fields from req.body
        const {
            atsScore,
            atsScoreReason,
            fit,
            jobMatch,
            matchMetrics,
            matchedSkills,
            missingSkills,
            matchedKeywords,
            missingKeywords,
            insights,
            insight,
            summary,
            result,
        } = req.body

        const updatePayload = {
            ...(atsScore !== undefined && { atsScore }),
            ...(atsScoreReason !== undefined && { atsScoreReason }),
            ...(fit !== undefined && { fit }),
            ...(jobMatch !== undefined && { jobMatch }),
            ...(matchMetrics !== undefined && { matchMetrics }),
            ...(matchedSkills !== undefined && { matchedSkills }),
            ...(missingSkills !== undefined && { missingSkills }),
            ...(matchedKeywords !== undefined && { matchedKeywords }),
            ...(missingKeywords !== undefined && { missingKeywords }),
            ...((insights !== undefined || insight !== undefined) && { insight: insights || insight }),
            ...(summary !== undefined && { summary }),
            ...(result !== undefined && { result }),
            updatedAt: new Date(),
        }


        // 6. Update target Analysis record by ID
        const updatedAnalysis = await prisma.analysis.update({
            where: { id: existingAnalysis.id },
            data: updatePayload,
        })

        return updatedAnalysis
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Update Analysis Error:", error)
        throw new AppError(error.message || "Failed to update analysis", 500)
    }
}
