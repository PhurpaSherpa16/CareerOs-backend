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
        const { resumeJobId, resumeId, jobId } = req.body

        let resumeJob = null

        if (resumeJobId) {
            // Find ResumeJob by ID and include associated resume and job
            resumeJob = await prisma.resumeJob.findUnique({
                where: { id: resumeJobId },
                include: {
                    resume: true,
                    job: true,
                },
            })

            if (!resumeJob) {
                throw new AppError("ResumeJob not found", 404)
            }

            if (resumeJob.userId !== dbUser.id) {
                throw new AppError("You do not have permission for this resume-job pair", 403)
            }
        } else if (resumeId && jobId) {
            // Verify resume ownership
            const resume = await prisma.resume.findUnique({
                where: { id: resumeId },
            })
            if (!resume) throw new AppError("Resume not found", 404)
            if (resume.userId !== dbUser.id) {
                throw new AppError("You do not have permission for this resume", 403)
            }

            // Verify job ownership
            const job = await prisma.job.findUnique({
                where: { id: jobId },
            })
            if (!job) throw new AppError("Job not found", 404)
            if (job.userId !== dbUser.id) {
                throw new AppError("You do not have permission for this job", 403)
            }

            // Find or create ResumeJob join record
            resumeJob = await prisma.resumeJob.upsert({
                where: {
                    resumeId_jobId: {
                        resumeId,
                        jobId,
                    },
                },
                create: {
                    userId: dbUser.id,
                    resumeId,
                    jobId,
                },
                update: {},
                include: {
                    resume: true,
                    job: true,
                },
            })
        } else {
            throw new AppError("resumeJobId or (resumeId and jobId) is required", 400)
        }

        // Extract structuredText of resume and job using ResumeJob
        const resumeStructured = resumeJob.resume?.structuredText
        const jobStructured = resumeJob.job?.structuredText

        // Compute content hashes for resume and job using rawText & structuredText / description
        const resumeContentString = `${resumeJob.resume?.rawText || ""}_${JSON.stringify(resumeStructured || {})}`
        const currentResumeHash = computeHash(resumeContentString)

        const jobContentString = `${resumeJob.job?.title || ""}_${resumeJob.job?.description || ""}_${JSON.stringify(jobStructured || {})}`
        const currentJobHash = computeHash(jobContentString)

        // 4. Check if an Analysis already exists for this resumeJobId
        const existingAnalysis = await prisma.analysis.findUnique({
            where: {
                resumeJobId: resumeJob.id,
            },
        })

        // AI Analysis
        const tempAiAnalysis = await analysis(resumeStructured, jobStructured)
        const parsedAiAnalysis = safeJsonParse(tempAiAnalysis, "analysis result")
        const aiAnalysis = parsedAiAnalysis?.schema || parsedAiAnalysis

        console.log('AI analysis', aiAnalysis)

        // Type-safe payload fields
        const atsScoreVal = typeof aiAnalysis?.atsScore === 'object' && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.score ?? 0)
            : (Number(aiAnalysis?.atsScore) || 0)

        const atsScoreReasonVal = typeof aiAnalysis?.atsScore === 'object' && aiAnalysis?.atsScore !== null
            ? (aiAnalysis.atsScore.reason || null)
            : null

        const fitVal = aiAnalysis?.fit || null
        const jobMatchVal = aiAnalysis?.jobMatch || null

        // Put experienceMatch into matchMetrics as requested
        const matchMetricsVal = {
            ...(typeof aiAnalysis?.matchMetrics === 'object' && aiAnalysis?.matchMetrics !== null ? aiAnalysis.matchMetrics : {}),
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

        // 5. Evaluate content hash comparison
        if (existingAnalysis) {
            const isResumeHashSame = existingAnalysis.resumeContentHash === currentResumeHash
            const isJobHashSame = existingAnalysis.jobContentHash === currentJobHash

            // Rule: Resume and Job content hashes unchanged -> Return existing Analysis without updating
            if (isResumeHashSame && isJobHashSame) {
                throw new AppError("You already save this analysis", 400)
            }

            // Rule: Resume content or Job content hash changed -> Update/patch existing Analysis with new data and new hashes
            const updatedAnalysis = await prisma.analysis.update({
                where: {
                    id: existingAnalysis.id,
                },
                data: analysisDataPayload,
            })

            return updatedAnalysis
        }

        // Rule: ResumeJob (No existing Analysis) -> Create new Analysis storing hashes
        const newAnalysis = await prisma.analysis.create({
            data: {
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
