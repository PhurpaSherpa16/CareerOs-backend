import { getAuth } from "@clerk/express"
import AppError from "../../utils/appError.js"
import { createTempAnalysis } from "../tempAnalysis/create.service.js"
import { createAnalysis } from "./create.service.js"
import prisma from "../../lib/prisma.js"

export const routeAnalysisService = async(req) =>{
    try {
        const { userId, isAuthenticated } = getAuth(req)
        if (!isAuthenticated || !userId) {
            return await createTempAnalysis(req)
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        })
        
        if(dbUser){
            return await createAnalysis(req)
        }

        return 'hello not login but not found in database'

    } catch (error) {
        console.error("RouteAnalysis Error:", error)
        throw new AppError(error.message || "Failed to create analysis", 500)
    }
}