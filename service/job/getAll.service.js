import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const getUserJobs = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        // 2. Fetch all jobs belonging to the authenticated user with latest analysis if available
        const jobs = await prisma.job.findMany({
            where: {
                userId: dbUser.id,
            },
            include: {
                resumeJobs: {
                    include: {
                        analyses: {
                            select: {
                                id: true,
                                atsScore: true,
                                createdAt: true,
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return jobs
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Get User Jobs Error:", error)
        throw new AppError(error.message || "Failed to retrieve job descriptions", 500)
    }
}
