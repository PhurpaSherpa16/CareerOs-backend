import express from "express"
import multer from "multer"
import { CreateAnalysis, GetAnalysis, UpdateAnalysis } from "../controller/analysis.controller.js"
import { createResumeValidation } from "../utils/mutler.js"
import { CreateTempAnalysis } from "../controller/tempAnalysis.controller.js"

const router = express.Router()
const upload = multer()

// POST: posting the analysis data (/analysis/create or /analysis)
router.post("/create", createResumeValidation, CreateAnalysis)

// GET: /analysis/resumes/:resumeId/jobs/:jobId/analysis or /analysis/resumes/:resumeId/jobs/:jobId
router.get("/resumes/:resumeId/jobs/:jobId/analysis", GetAnalysis)

// PATCH: updating when user makes changes in resume or in job description
router.patch("/update/:id", UpdateAnalysis)

// POST: Create / Increment temp analysis
router.post("/temp-create", createResumeValidation, upload.none(), CreateTempAnalysis)

// DELETE: Delete single temp analysis by analysis ID
// DELETE multiple using analysis ID, and analysis data only.



export default router

