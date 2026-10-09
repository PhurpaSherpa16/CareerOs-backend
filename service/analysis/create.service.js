import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { analysis } from "../../utils/ai/analysis.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"
import { getUserAiModel } from "../../utils/ai/getUserAiModel.js"

export const createAnalysis = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    try {
        const { resumeId, jobId } = req.body

        // 2. Validate required inputs
        if (!resumeId || typeof resumeId !== "string" || !resumeId.trim()) {
            throw new AppError("resumeId is required", 400)
        }
        if (!jobId || typeof jobId !== "string" || !jobId.trim()) {
            throw new AppError("jobId is required", 400)
        }

        const cleanResumeId = resumeId.trim()
        const cleanJobId = jobId.trim()

        // 3. Authenticate and verify resume exists and belongs to user
        const resume = await prisma.resume.findUnique({
            where: { id: cleanResumeId },
        })
        if (!resume) {
            throw new AppError("Resume not found", 404)
        }
        if (resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission for this resume", 403)
        }

        // 4. Authenticate and verify job exists and belongs to user
        const job = await prisma.job.findUnique({
            where: { id: cleanJobId },
        })
        if (!job) {
            throw new AppError("Job not found", 404)
        }
        if (job.userId !== dbUser.id) {
            throw new AppError("You do not have permission for this job", 403)
        }

        // 5. Find or create ResumeJob join record
        const resumeJob = await prisma.resumeJob.upsert({
            where: {
                resumeId_jobId: {
                    resumeId: cleanResumeId,
                    jobId: cleanJobId,
                },
            },
            create: {
                userId: dbUser.id,
                resumeId: cleanResumeId,
                jobId: cleanJobId,
            },
            update: {},
        })

        // 6. Check if an Analysis already exists for this resumeJob and user
        const existingAnalysis = await prisma.analysis.findFirst({
            where: {
                resumeJobId: resumeJob.id,
                userId: dbUser.id,
            },
            orderBy: { createdAt: "desc"},
        })

        // If existing analysis found, return existing analysis
        if (existingAnalysis) {
            console.log("Analysis already exists for this resume and job. Returning existing analysis.")
            return existingAnalysis
        }

        // 7. Run AI Analysis
        const resumeStructured = resume.structuredText
        const jobStructured = job.structuredText

        // Fetch user's saved AI model preference
        const userAi = await getUserAiModel(dbUser.id)
        const tempAiAnalysis = await analysis(resumeStructured, jobStructured, userAi?.model ? { model: userAi.model, provider: userAi.provider } : undefined)
        const parsedAiAnalysis = safeJsonParse(tempAiAnalysis, "analysis result")
        const aiAnalysis = parsedAiAnalysis?.schema || parsedAiAnalysis

        // Type-safe payload fields
        const atsScoreVal = typeof aiAnalysis?.atsScore === "object" && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.score ?? 0) : (Number(aiAnalysis?.atsScore) || 0)

        const atsScoreReasonVal = typeof aiAnalysis?.atsScore === "object" && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.reason || null) : null

        const fitVal = aiAnalysis?.fit || null
        const jobMatchVal = aiAnalysis?.jobMatch || null

        // Put experienceMatch into matchMetrics as requested
        const matchMetricsVal = {...(typeof aiAnalysis?.matchMetrics === "object" && aiAnalysis?.matchMetrics !== null ? aiAnalysis.matchMetrics : {}),
            experienceMatch: aiAnalysis?.experienceMatch || null}

        const matchedSkillsVal = Array.isArray(aiAnalysis?.matchedSkills) ? aiAnalysis.matchedSkills : []
        const missingSkillsVal = Array.isArray(aiAnalysis?.missingSkills) ? aiAnalysis.missingSkills : []
        const matchedKeywordsVal = Array.isArray(aiAnalysis?.matchedKeywords) ? aiAnalysis.matchedKeywords : []
        const missingKeywordsVal = Array.isArray(aiAnalysis?.missingKeywords) ? aiAnalysis.missingKeywords : []

        const insightVal = Array.isArray(aiAnalysis?.insights) ? aiAnalysis.insights
            : Array.isArray(aiAnalysis?.insight) ? aiAnalysis.insight : []

        // result -> make it summary and insert it
        const summaryVal = aiAnalysis.result || null

        const analysisDataPayload = {
            atsScore: atsScoreVal,
            atsScoreReason: atsScoreReasonVal,
            fit: fitVal,
            jobMatch: jobMatchVal,
            matchMetrics: matchMetricsVal,
            matchedSkills: matchedSkillsVal,
            missingSkills: missingSkillsVal,
            matchedKeywords: matchedKeywordsVal,
            missingKeywords: missingKeywordsVal,
            insight: insightVal,
            summary: summaryVal,
            strucutred: aiAnalysis,
        }

        // 8. Create new Analysis record with userId and resumeJobId
        const newAnalysis = await prisma.analysis.create({
            data: {
                userId: dbUser.id,
                resumeJobId: resumeJob.id,
                ...analysisDataPayload,
            },
        })

        return newAnalysis
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Create Analysis Error:", error)
        throw new AppError(error.message || "Failed to save analysis", 500)
    }
}
