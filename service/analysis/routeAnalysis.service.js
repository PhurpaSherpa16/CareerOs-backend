import { getAuth } from "@clerk/express"
import AppError from "../../utils/appError.js"
import { createTempAnalysis } from "../tempAnalysis/create.service.js"
import { createAnalysis } from "./create.service.js"
import prisma from "../../lib/prisma.js"

export const routeAnalysisService = async (req) => {
    try {
        const { resumeId, jobId } = req.body || {}

        // If resumeId or jobId is passed, this is an authenticated user analysis request
        if (resumeId || jobId) {
            return await createAnalysis(req)
        }

        const { userId, isAuthenticated } = getAuth(req)
        if (!isAuthenticated || !userId) {
            return await createTempAnalysis(req)
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        })
        
        if (dbUser) {
            return await createAnalysis(req)
        }

        throw new AppError("User not found in database", 404)

    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("RouteAnalysis Error:", error)
        throw new AppError(error.message || "Failed to create analysis", 500)
    }
}