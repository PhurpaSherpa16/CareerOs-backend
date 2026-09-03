import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const getUserResumes = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    // 2. Fetch all resumes belonging to the authenticated user
    const resumes = await prisma.resume.findMany({
        where: {
            userId: dbUser.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return resumes
}