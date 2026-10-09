import {
    saveUserAiModel,
    getUserAiModelService,
    getAvailableAiModelsService
} from "../service/aiModel/aiModel.service.js"
import CatchAsync from "../utils/catchAsync.js"

export const CreateAiModel = CatchAsync(async (req, res) => {
    const result = await saveUserAiModel(req)
    return res.status(201).json({
        success: true,
        message: "AI model selected successfully",
        data: result
    })
})

export const UpdateAiModel = CatchAsync(async (req, res) => {
    const result = await saveUserAiModel(req)
    return res.status(200).json({
        success: true,
        message: "AI model updated successfully",
        data: result
    })
})

export const GetCurrentAiModel = CatchAsync(async (req, res) => {
    const result = await getUserAiModelService(req)
    return res.status(200).json({
        success: true,
        message: "Current AI model retrieved successfully",
        data: result
    })
})

export const GetAvailableAiModels = CatchAsync(async (req, res) => {
    const result = await getAvailableAiModelsService()
    return res.status(200).json({
        success: true,
        message: "Available AI models retrieved successfully",
        data: result
    })
})

export default {
    CreateAiModel,
    UpdateAiModel,
    GetCurrentAiModel,
    GetAvailableAiModels
}
