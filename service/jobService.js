import { createJob } from "./job/create.service.js"
import { getJobById } from "./job/get.service.js"
import { updateJob } from "./job/update.service.js"

export const jobService = {
    createJob,
    getJobById,
    updateJob,
}
