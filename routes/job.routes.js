import express from "express"
import {UploadJobDescription, GetJobDescription, UpdateJobDescription,} from "../controller/job.controller.js"
import multer from "multer"

const router = express.Router()

const upload = multer()

// POST: /api/uploadJobDescription
router.post("/create", upload.none(), UploadJobDescription)

// GET: /api/getJobDescription/:id
router.get("/getJobDescription/:id", GetJobDescription)

// PATCH: /api/updateJobDescription/:id
router.patch("/updateJobDescription/:id", upload.none(), UpdateJobDescription)

export default router