import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { structureResume } from "../../utils/ai/strucutreResume.js"
import { structureJobDescription } from "../../utils/ai/strucutreJobDescription.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"

export const createJob = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        // 2. Validate input fields
        const { resumeId, title, company, jobUrl, description } = req.body
        
        if (!resumeId) {
            throw new AppError("resumeId is required", 400)
        }

        if (!title || typeof title !== "string" || !title.trim()) {
            throw new AppError("Job title is required", 400)
        }

        // 3. Verify that resume exists and belongs to authenticated user
        const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
        })

        if (!resume) {
            throw new AppError("Resume not found", 404)
        }

        const rawJobStructured = await structureJobDescription(description)
        if (!rawJobStructured) throw new AppError("Failed to structure job description, please try again later.", 500)
        const tempStructuredText = safeJsonParse(rawJobStructured, "job description structure")


        if (resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission to attach a job to this resume", 403)
        }

        // 4. Create Job record in Prisma database
        const newJob = await prisma.job.create({
            data: {
                resumeId,
                title: title.trim(),
                company: company ? company.trim() : null,
                jobUrl: jobUrl ? jobUrl.trim() : null,
                description: description ? description.trim() : null,
                structuredText: tempStructuredText || {},
            },
        })

        return newJob
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Create Job Error:", error)
        throw new AppError(error.message || "Failed to create job description", 500)
    }
}
