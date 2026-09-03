import { analysisService } from "../service/analysisService.js"
import CatchAsync from "../utils/catchAsync.js"

export const CreateAnalysis = CatchAsync(async (req, res) => {
    const result = await analysisService.routeAnalysisService(req)
    return res.status(201).json({
        success: true,
        message: result.message || "Analysis saved successfully",
        result,
    })
})

export const GetAnalysis = CatchAsync(async (req, res) => {
    const result = await analysisService.getAnalysis(req)
    return res.status(200).json({
        success: true,
        message: "Analysis retrieved successfully",
        data: result,
    })
})

export const UpdateAnalysis = CatchAsync(async (req, res) => {
    const result = await analysisService.updateAnalysis(req)
    return res.status(200).json({
        success: true,
        message: "Analysis updated successfully",
        data: result,
    })
})

