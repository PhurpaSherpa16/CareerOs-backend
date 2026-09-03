import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const getResumeById = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    // 2. Validate resume ID parameter
    const { id } = req.params
    if (!id) {
        throw new AppError("Resume ID is required", 400)
    }

    // 3. Find resume record
    const resume = await prisma.resume.findUnique({
        where: { id },
        include: {
            jobs: {
                select: {
                    id: true,
                    title: true,
                    company: true,
                    jobUrl: true,
                    description: true,
                    structuredText: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        }
    })

    if (!resume) {
        throw new AppError("Resume not found", 404)
    }

    // 4. Ownership verification: user can only access their own resume
    if (resume.userId !== dbUser.id) {
        throw new AppError("You do not have permission to access this resume", 403)
    }

    return resume
}
