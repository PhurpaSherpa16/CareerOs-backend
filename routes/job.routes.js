import express from "express"
import { UploadJobDescription, GetJobDescription, UpdateJobDescription, GetUserJobs } from "../controller/job.controller.js"
import multer from "multer"

const router = express.Router()

const upload = multer()

// POST: /job/create
router.post("/create", upload.none(), UploadJobDescription)

// GET: /job/all and /job/getAll
router.get("/all", GetUserJobs)

// GET: /job/getJobDescription/:id and /job/:id
router.get("/getJobDescription/:id", GetJobDescription)

// PATCH: /job/updateJobDescription/:id and /job/:id
router.patch("/updateJobDescription/:id", upload.none(), UpdateJobDescription)

export default router