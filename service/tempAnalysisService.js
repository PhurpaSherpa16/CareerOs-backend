import { createTempAnalysis } from "./tempAnalysis/create.service.js"
import { getTempAnalysis } from "./tempAnalysis/get.service.js"
import { updateTempAnalysis } from "./tempAnalysis/update.service.js"
import { deleteTempAnalysis } from "./tempAnalysis/delete.service.js"
import { cleanExpiredTempAnalyses } from "./tempAnalysis/cleanup.service.js"

export const tempAnalysisService = {
    createTempAnalysis,
    getTempAnalysis,
    updateTempAnalysis,
    deleteTempAnalysis,
    cleanExpiredTempAnalyses,
}
