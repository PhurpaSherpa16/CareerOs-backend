import { tempAnalysisService } from "../service/tempAnalysisService.js"
import CatchAsync from "../utils/catchAsync.js"

export const CreateTempAnalysis = CatchAsync(async (req, res) => {
    const result = await tempAnalysisService.createTempAnalysis(req)
    return res.status(201).json({
        success: true,
        message: "Temporary analysis created successfully",
        data: result,
    })
})

export const GetTempAnalysis = CatchAsync(async (req, res) => {
    const result = await tempAnalysisService.getTempAnalysis(req)
    return res.status(200).json({
        success: true,
        message: "Temporary analysis retrieved successfully",
        data: result,
    })
})

export const UpdateTempAnalysis = CatchAsync(async (req, res) => {
    const result = await tempAnalysisService.updateTempAnalysis(req)
    return res.status(200).json({
        success: true,
        message: "Temporary analysis updated successfully",
        data: result,
    })
})

export const DeleteTempAnalysis = CatchAsync(async (req, res) => {
    const result = await tempAnalysisService.deleteTempAnalysis(req)
    return res.status(200).json({
        success: true,
        message: "Temporary analysis deleted successfully",
        data: result,
    })
})
