import { getAuth } from "@clerk/express"
import AppError from "./appError.js"
import prisma from "../lib/prisma.js"

export const getAuthUser = async (req) => {
    const { userId, isAuthenticated } = getAuth(req)
    if (!isAuthenticated || !userId) {
        throw new AppError("User not authenticated", 401)
    }

    const dbUser = await prisma.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    })
    if (!dbUser) {
        throw new AppError("User not found in database", 404)
    }

    return dbUser
}
