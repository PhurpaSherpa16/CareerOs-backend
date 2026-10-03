import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { structureJobDescription } from "../../utils/ai/strucutreJobDescription.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"
import { computeJobHash } from "../../utils/hash.js"

export const createJob = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        // 2. Validate input fields
        const { title, company, jobUrl, description } = req.body
    

        if (!title || typeof title !== "string" || !title.trim()) {
            throw new AppError("Job title is required", 400)
        }

        if (!description || typeof description !== "string" || !description.trim()) {
            throw new AppError("Job description is required", 400)
        }

        const cleanTitle = title.trim()
        const cleanDescription = description.trim()
        const cleanCompany = company ? company.trim() : null
        const cleanJobUrl = jobUrl ? jobUrl.trim() : null

        // 3. Generate job content hash and check if same job already exists for current user
        const jobContentHash = computeJobHash(cleanDescription, cleanTitle)

        let targetJob = await prisma.job.findFirst({
            where: {
                userId: dbUser.id,
                OR: [
                    { jobContentHash },
                    {
                        title: cleanTitle,
                        description: cleanDescription,
                    },
                ],
            },
        })

        if (targetJob) {
            console.log("Job already exists for this user. Reusing existing job ID:", targetJob.id)
            if (!targetJob.jobContentHash) {
                targetJob = await prisma.job.update({
                    where: { id: targetJob.id },
                    data: { jobContentHash },
                })
            }
        } else {
            const rawJobStructured = await structureJobDescription(cleanDescription)
            if (!rawJobStructured) throw new AppError("Failed to structure job description, please try again later.", 500)
            const tempStructuredText = safeJsonParse(rawJobStructured, "job description structure")

            // Create Job record in Prisma database
            targetJob = await prisma.job.create({
                data: {
                    userId: dbUser.id,
                    title: cleanTitle,
                    company: cleanCompany,
                    jobUrl: cleanJobUrl,
                    description: cleanDescription,
                    structuredText: tempStructuredText || {},
                    jobContentHash,
                },
            })
        }

        return targetJob
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Create Job Error:", error)
        throw new AppError(error.message || "Failed to create job description", 500)
    }
}
