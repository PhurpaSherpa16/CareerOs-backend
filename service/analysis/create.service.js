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
        const {
            resumeId,
            jobId,
        } = req.body

        // verify resume and job exist or not
        if (!resumeId) throw new AppError("resumeId is required", 400)
        const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
        })
        if (!resume) throw new AppError("Resume not found", 404)

        if (!jobId) throw new AppError("jobId is required", 400)
        if (resume.userId !== dbUser.id) {
            throw new AppError("You do not have permission for this resume", 403)
        }

        // 3. Verify job existence
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        })

        if (!job) throw new AppError("Job not found", 404)

        const resumeStructured = resume.structuredText
        const jobStructured = job.structuredText

        // Compute content hashes for resume and job using rawText & structuredText / description
        const resumeContentString = `${resume.rawText || ""}_${JSON.stringify(resumeStructured || {})}`
        const currentResumeHash = computeHash(resumeContentString)

        const jobContentString = `${job.title || ""}_${job.description || ""}_${JSON.stringify(jobStructured || {})}`
        const currentJobHash = computeHash(jobContentString)

        // 4. Check if an Analysis already exists for resumeId + jobId
        const existingAnalysis = await prisma.analysis.findUnique({
            where: {
                resumeId_jobId: {
                    resumeId,
                    jobId,
                },
            },
        })

        // AI Analysis
        const tempAiAnalysis = await analysis(resumeStructured, jobStructured)
        const parsedAiAnalysis = safeJsonParse(tempAiAnalysis, "analysis result")
        const aiAnalysis = parsedAiAnalysis?.schema || parsedAiAnalysis
        const {atsScore: aiAtsScore, matchedSkills: aiMatchedSkills, missingSkills: aiMissingSkills, 
            matchedKeywords: aiMatchedKeywords, insights: aiInsights, result: aiResult} = aiAnalysis
        
        // Type-safe payload fields
        const atsScoreVal = aiAtsScore || 0
        const matchedSkillsVal = aiMatchedSkills || []
        const missingSkillsVal = aiMissingSkills || []
        const matchedKeywordsVal = aiMatchedKeywords || []
        const insightVal = aiInsights || []
        const resultVal = aiResult || []

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
                data: {
                    atsScroe: atsScoreVal,
                    matchSkilled: matchedSkillsVal,
                    missingSkills: missingSkillsVal,
                    matchedKeyWords: matchedKeywordsVal,
                    insight: insightVal,
                    result: resultVal,
                    resumeContentHash: currentResumeHash,
                    jobContentHash: currentJobHash,
                },
            })

            return updatedAnalysis
        }

        // Rule: Resume + Job (No existing Analysis) -> Create new Analysis storing hashes
        const newAnalysis = await prisma.analysis.create({
            data: {
                resumeId,
                jobId,
                atsScroe: atsScoreVal,
                matchSkilled: matchedSkillsVal,
                missingSkills: missingSkillsVal,
                matchedKeyWords: matchedKeywordsVal,
                insight: insightVal,
                result: resultVal,
                resumeContentHash: currentResumeHash,
                jobContentHash: currentJobHash,
            },
        })

        return newAnalysis
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Create Analysis Error:", error)
        throw new AppError(error.message || "Failed to save analysis", 500)
    }
}
