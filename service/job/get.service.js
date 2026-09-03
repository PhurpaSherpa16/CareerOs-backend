import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const getJobById = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        const { id } = req.params
        if (!id) {
            throw new AppError("Job ID is required", 400)
        }

        // 2. Find job record with associated resume
        const job = await prisma.job.findUnique({
            where: { id },
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
            },
        })

        if (!job) {
            throw new AppError("Job not found", 404)
        }

        // 3. Ownership verification: ensure job belongs to user's resume
        if (job.resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission to access this job", 403)
        }

        return job
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Get Job Error:", error)
        throw new AppError(error.message || "Failed to retrieve job description", 500)
    }
}
