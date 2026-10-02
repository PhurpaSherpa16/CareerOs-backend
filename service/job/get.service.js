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

        // 2. Find job record with associated resumeJobs
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                resumeJobs: {
                    include: {
                        resume: true,
                    },
                },
            },
        })

        if (!job) {
            throw new AppError("Job not found", 404)
        }

        // 3. Ownership verification: ensure job belongs to authenticated user
        if (job.userId !== dbUser.id) {
            throw new AppError("You do not have permission to access this job", 403)
        }

        return job
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Get Job Error:", error)
        throw new AppError(error.message || "Failed to retrieve job description", 500)
    }
}
