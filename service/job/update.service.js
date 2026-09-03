import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { structureJobDescription } from "../../utils/ai/strucutreJobDescription.js"

export const updateJob = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        const { id } = req.params
        if (!id) {
            throw new AppError("Job ID is required", 400)
        }

        // 2. Find existing job record and verify ownership
        const existingJob = await prisma.job.findUnique({
            where: { id },
            include: {
                resume: {
                    select: {
                        id: true,
                        userId: true,
                    },
                },
            },
        })

        if (!existingJob) {
            throw new AppError("Job not found", 404)
        }

        if (existingJob.resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission to update this job", 403)
        }

        // 3. Extract and validate update fields
        const { title, company, jobUrl, description, structuredText, resumeId } = req.body

        const tempStructuredText = await structureJobDescription(description)
        if(!tempStructuredText) throw new AppError("Failed to structure job description, please try again later.", 500)

        // If resumeId is being changed, verify new resume exists and belongs to user
        if (resumeId && resumeId !== existingJob.resumeId) {
            const targetResume = await prisma.resume.findUnique({
                where: { id: resumeId },
            })

            if (!targetResume) {
                throw new AppError("Target resume not found", 404)
            }

            if (targetResume.userId !== dbUser.id) {
                throw new AppError("You do not have permission to attach a job to this resume", 403)
            }
        }

        const updateData = {}
        if (title !== undefined) {
            if (!title || typeof title !== "string" || !title.trim()) {
                throw new AppError("Job title cannot be empty", 400)
            }
            updateData.title = title.trim()
        }
        if (company !== undefined) updateData.company = company ? company.trim() : null
        if (jobUrl !== undefined) updateData.jobUrl = jobUrl ? jobUrl.trim() : null
        if (description !== undefined) updateData.description = description ? description.trim() : null
        updateData.structuredText = tempStructuredText || {}

        // 4. Perform update in database
        const updatedJob = await prisma.job.update({
            where: { id },
            data: updateData,
        })

        return updatedJob
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Update Job Error:", error)
        throw new AppError(error.message || "Failed to update job description", 500)
    }
}
