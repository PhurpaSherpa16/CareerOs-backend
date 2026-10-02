import crypto from "crypto"
import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { analysis } from "../../utils/ai/analysis.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"

const computeHash = (content) => {
    return crypto.createHash("sha256").update(content).digest("hex")
}

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

        // Extract structuredText of resume and job
        const resumeStructured = resume.structuredText
        const jobStructured = job.structuredText

        // Compute content hashes for resume and job using rawText & structuredText / description
        const resumeContentString = `${resume.rawText || ""}_${JSON.stringify(resumeStructured || {})}`
        const currentResumeHash = computeHash(resumeContentString)

        const jobContentString = `${job.title || ""}_${job.description || ""}_${JSON.stringify(jobStructured || {})}`
        const currentJobHash = computeHash(jobContentString)

        // 6. Check if an Analysis already exists for this resumeJob and user
        const existingAnalysis = await prisma.analysis.findFirst({
            where: {
                resumeJobId: resumeJob.id,
                userId: dbUser.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // If existing analysis found and contents have not changed, return existing analysis
        if (existingAnalysis) {
            const isResumeHashSame = existingAnalysis.resumeContentHash === currentResumeHash
            const isJobHashSame = existingAnalysis.jobContentHash === currentJobHash

            if (isResumeHashSame && isJobHashSame) {
                console.log("Analysis already exists for this resume and job. Returning existing analysis.")
                return existingAnalysis
            }
        }

        // 7. Run AI Analysis
        const tempAiAnalysis = await analysis(resumeStructured, jobStructured)
        const parsedAiAnalysis = safeJsonParse(tempAiAnalysis, "analysis result")
        const aiAnalysis = parsedAiAnalysis?.schema || parsedAiAnalysis

        console.log("AI analysis", aiAnalysis)

        // Type-safe payload fields
        const atsScoreVal = typeof aiAnalysis?.atsScore === "object" && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.score ?? 0)
            : (Number(aiAnalysis?.atsScore) || 0)

        const atsScoreReasonVal = typeof aiAnalysis?.atsScore === "object" && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.reason || null)
            : null

        const fitVal = aiAnalysis?.fit || null
        const jobMatchVal = aiAnalysis?.jobMatch || null

        // Put experienceMatch into matchMetrics as requested
        const matchMetricsVal = {
            ...(typeof aiAnalysis?.matchMetrics === "object" && aiAnalysis?.matchMetrics !== null ? aiAnalysis.matchMetrics : {}),
            experienceMatch: aiAnalysis?.experienceMatch || null,
        }

        const matchedSkillsVal = Array.isArray(aiAnalysis?.matchedSkills) ? aiAnalysis.matchedSkills : []
        const missingSkillsVal = Array.isArray(aiAnalysis?.missingSkills) ? aiAnalysis.missingSkills : []
        const matchedKeywordsVal = Array.isArray(aiAnalysis?.matchedKeywords) ? aiAnalysis.matchedKeywords : []
        const missingKeywordsVal = Array.isArray(aiAnalysis?.missingKeywords) ? aiAnalysis.missingKeywords : []

        const insightVal = Array.isArray(aiAnalysis?.insights)
            ? aiAnalysis.insights
            : Array.isArray(aiAnalysis?.insight)
                ? aiAnalysis.insight
                : []

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
            resumeContentHash: currentResumeHash,
            jobContentHash: currentJobHash,
        }

        // 8. If analysis exists but content changed, update existing analysis record
        if (existingAnalysis) {
            const updatedAnalysis = await prisma.analysis.update({
                where: {
                    id: existingAnalysis.id,
                },
                data: analysisDataPayload,
            })

            return updatedAnalysis
        }

        // 9. Otherwise, create new Analysis record with userId and resumeJobId
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
