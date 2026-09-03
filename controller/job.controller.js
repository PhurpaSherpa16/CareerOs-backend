import { jobService } from "../service/jobService.js"
import CatchAsync from "../utils/catchAsync.js"

export const UploadJobDescription = CatchAsync(async (req, res) => {
    const result = await jobService.createJob(req)
    return res.status(201).json({
        success: true,
        message: "Job description uploaded successfully",
        data: result,
    })
})

export const GetJobDescription = CatchAsync(async (req, res) => {
    const result = await jobService.getJobById(req)
    return res.status(200).json({
        success: true,
        message: "Job description retrieved successfully",
        data: result,
    })
})

export const UpdateJobDescription = CatchAsync(async (req, res) => {
    const result = await jobService.updateJob(req)
    return res.status(200).json({
        success: true,
        message: "Job description updated successfully",
        data: result,
    })
})
