import express from "express"
import {
    CreateTempAnalysis,
    GetTempAnalysis,
    UpdateTempAnalysis,
    DeleteTempAnalysis,
} from "../controller/tempAnalysis.controller.js"
import { createResumeValidation } from "../utils/mutler.js"

const router = express.Router()

// POST: Create / Increment temp analysis
router.post("/create", createResumeValidation, CreateTempAnalysis)

// GET: Get single temp analysis by ID
router.get("/:id", GetTempAnalysis)

// PATCH: Update single temp analysis by ID
router.patch("/:id", UpdateTempAnalysis)

// DELETE: Delete single temp analysis by ID
router.delete("/:id", DeleteTempAnalysis)

export default router
