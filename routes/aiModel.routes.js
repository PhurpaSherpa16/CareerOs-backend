import express from "express"
import {
    CreateAiModel,
    UpdateAiModel,
    GetCurrentAiModel,
    GetAvailableAiModels
} from "../controller/aiModel.controller.js"

const router = express.Router()

// Create / Select AI Model
router.post("/create", CreateAiModel)

// Update AI Model
router.patch("/update", UpdateAiModel)

// Get Current User's Selected Model
router.get("/current", GetCurrentAiModel)

// Get All Available Models from AiModelList
router.get("/list", GetAvailableAiModels)

export default router
