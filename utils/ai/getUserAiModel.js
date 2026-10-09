import prisma from "../../lib/prisma.js"

/**
 * Retrieves the configured AI model for a user from the database.
 * @param {string} userId - Internal User ID
 * @returns {Promise<{model: string, provider: string, modelId: string}|null>}
 */
export const getUserAiModel = async (userId) => {
    if (!userId) return null
    try {
        const userModel = await prisma.aiModel.findUnique({
            where: { userId },
            include: { model: true }
        })

        if (!userModel || !userModel.model) {
            return null
        }

        return {
            model: userModel.model.model,
            provider: userModel.model.modelProvider,
            modelId: userModel.modelId,
            id: userModel.id
        }
    } catch (error) {
        console.error("Error fetching user AI model:", error)
        return null
    }
}

export default getUserAiModel
