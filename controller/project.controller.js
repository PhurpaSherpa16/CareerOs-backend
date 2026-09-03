import { projectService } from "../service/project.js"
import CatchAsync from "../utils/catchAsync.js"

export const getAllProjects = CatchAsync(async(req, res) =>{
    const result = await projectService.getAllProjects(req)
    res.json({
        success: true,
        message: "Projects api response",
        data: result
    })
})