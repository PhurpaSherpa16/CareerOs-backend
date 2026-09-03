import { resumeService } from "../service/resumeService.js";
import CatchAsync from "../utils/catchAsync.js";


export const CreateResume = CatchAsync(async(req, res) =>{
    const result = await resumeService.createResume(req)
    return res.status(201).json({
        success: true,
        message: "Resume uploaded",
        data: result
    })
})

export const GetUserResumes = CatchAsync(async(req, res) => {
    const result = await resumeService.getUserResumes(req)
    return res.status(200).json({
        success: true,
        message: "Resumes retrieved successfully",
        data: result,
    })
})

export const GetSingleResume = CatchAsync(async(req, res) => {
    const result = await resumeService.getResumeById(req)
    return res.status(200).json({
        success: true,
        message: "Resume retrieved successfully",
        data: result
    })
})

export const DeleteResume = CatchAsync(async(req, res) => {
    const result = await resumeService.deleteResume(req)
    return res.status(200).json({
        success: true,
        message: "Resume deleted successfully",
    })
})

export const UpdateResumeFile = CatchAsync(async(req, res) => {
    const result = await resumeService.updateResumeFile(req)
    return res.status(200).json({
        success: true,
        message: "Resume file updated successfully",
        data: result
    })
})

export const DeleteMultipleResumes = CatchAsync(async(req, res) => {
    const result = await resumeService.deleteMultipleResumes(req)
    return res.status(200).json({
        success: true,
        message: "Resumes deleted successfully",
        data: result
    })
})