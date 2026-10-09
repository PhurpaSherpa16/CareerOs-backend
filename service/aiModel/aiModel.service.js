import prisma from "../../lib/prisma.js"
import AppError from "../../utils/appError.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const saveUserAiModel = async (req) => {
    const dbUser = await getAuthUser(req)
    const { modelId, model, modelName } = req.body || {}

    if (!modelId && !model && !modelName) {
        throw new AppError("modelId or model name is required", 400)
    }

    let targetModel = null

    if (modelId) {
        targetModel = await prisma.aiModelList.findUnique({
            where: { id: modelId }
        })
    }

    if (!targetModel && (model || modelName)) {
        const query = (model || modelName).trim()
        targetModel = await prisma.aiModelList.findFirst({
            where: {
                model: {
                    equals: query,
                    mode: 'insensitive'
                }
            }
        })
    }

    if (!targetModel) {
        throw new AppError("The requested AI model was not found in available models", 404)
    }

    // Upsert ensures we only have one row per user (changing modelId on subsequent calls)
    const userAiModel = await prisma.aiModel.upsert({
        where: { userId: dbUser.id },
        create: {
            userId: dbUser.id,
            modelId: targetModel.id
        },
        update: {
            modelId: targetModel.id
        },
        include: {
            model: true
        }
    })

    return userAiModel
}

export const getUserAiModelService = async (req) => {
    const dbUser = await getAuthUser(req)

    const userModel = await prisma.aiModel.findUnique({
        where: { userId: dbUser.id },
        include: {
            model: true
        }
    })

    return userModel
}

export const getAvailableAiModelsService = async () => {
    const availableModels = await prisma.aiModelList.findMany({
        orderBy: { createdAt: 'asc' }
    })
    return availableModels
}

export default {
    saveUserAiModel,
    getUserAiModelService,
    getAvailableAiModelsService
}
