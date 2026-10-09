import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { structureJobDescription } from "../../utils/ai/strucutreJobDescription.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"
import { computeJobHash } from "../../utils/hash.js"
import { getUserAiModel } from "../../utils/ai/getUserAiModel.js"

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
        })

        if (!existingJob) {
            throw new AppError("Job not found", 404)
        }

        if (existingJob.userId !== dbUser.id) {
            throw new AppError("You do not have permission to update this job", 403)
        }

        // 3. Extract and validate update fields
        const { title, company, jobUrl, description, structuredText } = req.body

        let tempStructuredText = existingJob.structuredText
        if (description !== undefined) {
            if (!description || typeof description !== "string" || !description.trim()) {
                throw new AppError("Job description cannot be empty", 400)
            }
            // Fetch user's saved AI model preference
            const userAi = await getUserAiModel(dbUser.id)
            const structuredResult = await structureJobDescription(description.trim(), userAi?.model ? { model: userAi.model, provider: userAi.provider } : undefined)
            if (!structuredResult) throw new AppError("Failed to structure job description, please try again later.", 500)
            tempStructuredText = safeJsonParse(structuredResult, "job description structure") || {}
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

        const finalTitle = updateData.title || existingJob.title
        const finalDescription = updateData.description || existingJob.description
        updateData.jobContentHash = computeJobHash(finalDescription, finalTitle)

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
