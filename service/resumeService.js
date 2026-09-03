import { createResume } from "./resume/create.service.js";
import { getResumeById } from "./resume/get.service.js";
import { getUserResumes } from "./resume/getAll.service.js";
import { deleteResume } from "./resume/delete.service.js";
import { updateResumeFile } from "./resume/update.service.js";
import { deleteMultipleResumes } from "./resume/deleteMany.service.js";

export const resumeService = {
    createResume,
    getUserResumes,
    getResumeById,
    deleteResume,
    updateResumeFile,
    deleteMultipleResumes,
}