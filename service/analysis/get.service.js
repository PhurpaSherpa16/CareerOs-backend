import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const getAnalysis = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        const { resumeId, jobId } = req.params

        if (!resumeId) throw new AppError("resumeId parameter is required", 400)
        if (!jobId) throw new AppError("jobId parameter is required", 400)

        // 2. Verify resume ownership
        const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
        })

        if (!resume) throw new AppError("Resume not found", 404)
        if (resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission for this resume", 403)
        }

        // 3. Find analysis record for resumeId & jobId
        const analysis = await prisma.analysis.findUnique({
            where: {
                resumeId_jobId: {
                    resumeId,
                    jobId,
                },
            },
            include: {
                resume: {
                    select: {
                        id: true,
                        userId: true,
                        title: true,
                        fileName: true,
                        fileUrl: true,
                        rawText: true,
                        structuredText: true,
                        createdAt: true,
                        updatedAt: true
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        jobUrl: true,
                        description: true,
                        structuredText: true,
                        createdAt: true,
                        updatedAt: true
                    },
                },
            },
        })

        if (!analysis) {
            throw new AppError("Analysis record not found for this resume and job", 404)
        }

        return analysis
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Get Analysis Error:", error)
        throw new AppError(error.message || "Failed to retrieve analysis", 500)
    }
}
