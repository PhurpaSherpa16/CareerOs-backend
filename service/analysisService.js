import { routeAnalysisService } from "./analysis/routeAnalysis.service.js"
import { getAnalysis } from "./analysis/get.service.js"
import { updateAnalysis } from "./analysis/update.service.js"

export const analysisService = {
    routeAnalysisService,
    getAnalysis,
    updateAnalysis,
}

