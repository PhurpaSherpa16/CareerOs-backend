import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const deleteTempAnalysis = async (req) => {
    try {
        const { id } = req.params

        if (!id) {
            throw new AppError("Analysis ID is required", 400)
        }

        // check the if clerkId exist then stop , because this is for only temp guest user 
        const dbUser = await getAuthUser(req)
        if (dbUser?.id) {
            throw new AppError("Failed to Delete.", 400)
        }

        const tempAnalysis = await prisma.tempAnalysis.findUnique({
            where: { id },
        })

        if (!tempAnalysis) {
            throw new AppError("Temporary analysis not found", 404)
        }

        const deleted = await prisma.tempAnalysis.delete({
            where: { id },
        })

        return deleted
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Delete Temp Analysis Error:", error)
        throw new AppError(error.message || "Failed to delete temporary analysis", 500)
    }
}
