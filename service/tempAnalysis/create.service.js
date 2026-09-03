import crypto from "crypto"
import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { extractPdfText } from "../../utils/extractorPDFText.js"
import { structureResume } from "../../utils/ai/strucutreResume.js"
import { structureJobDescription } from "../../utils/ai/strucutreJobDescription.js"
import { analysis } from "../../utils/ai/analysis.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"

const computeHash = (content) => {
    return crypto.createHash("sha256").update(content).digest("hex")
}


export const createTempAnalysis = async (req) => {
    try {
        const { jobDescription, guestId: reqGuestId } = req.body

        // 1. Ensure guest existence or create new guest record
        let guest = null
        let isExistingGuest = false

        if (reqGuestId) {
            guest = await prisma.guest.findUnique({
                where: { id: reqGuestId },
            })
            if (guest) {
                isExistingGuest = true
            }
        }

        if (!guest) {
            const guestIdToUse = reqGuestId || crypto.randomUUID()
            guest = await prisma.guest.create({
                data: {
                    id: guestIdToUse,
                    count: 1,
                },
            })
        } else {
            // Check if guest reached the 3-analysis limit
            if (guest.count >= 3) {
                throw new AppError("Limit exceed. Please login or signup for unlimited access.", 400)
            }
        }

        // 2. Extract raw text from uploaded resume PDF or request body
        const file = req.files?.resume?.[0] || req.file
        let resumeRawText = req.body?.resumeRawText || ""

        if (file) {
            resumeRawText = await extractPdfText(file.buffer)
        }

        if (!resumeRawText || !resumeRawText.trim()) {
            throw new AppError("Resume is required", 400)
        }

        // 3. Extract job description raw text
        const jobRawText = (typeof jobDescription === "string" ? jobDescription : req.body?.jobRawText || "").trim()
        if (!jobRawText) {
            throw new AppError("jobDescription is required", 400)
        }

        // 4. Compute content hashes for resume and job description
        const currentResumeHash = computeHash(resumeRawText.trim())
        const currentJobHash = computeHash(jobRawText.trim())

        // 5. Check if guest has an existing analysis with identical content hashes
        const previousAnalyses = await prisma.tempAnalysis.findMany({
            where: { guestId: guest.id },
            orderBy: { createdAt: "desc" },
        })

        if (previousAnalyses.length > 0) {
            const isDuplicateContent = previousAnalyses.some(
                (a) => a.resumeContentHash === currentResumeHash && a.jobContentHash === currentJobHash
            )

            if (isDuplicateContent) {
                const latestRecord = previousAnalyses[0]
                return {
                    data: {
                        newRecord: latestRecord,
                        guestId: guest.id,
                        user: guest,
                        aiData: {
                            atsScore: latestRecord.atsScore,
                            atsScoreReason: latestRecord.atsScoreReason,
                            fit: latestRecord.fit,
                            jobMatch: latestRecord.jobMatch,
                            matchMetrics: latestRecord.matchMetrics,
                            matchedSkills: latestRecord.matchedSkills,
                            missingSkills: latestRecord.missingSkills,
                            matchedKeywords: latestRecord.matchedKeywords,
                            missingKeywords: latestRecord.missingKeywords,
                            experienceMatch: latestRecord.experienceMatch,
                            insights: latestRecord.insights,
                            result: latestRecord.result,
                        }
                    },
                    message: "Nothing to update. Please make changes in your resume or job description.",
                }
            }
        }

        // 6. Run AI structuring for Resume & Job Description
        const rawResumeStructured = await structureResume(resumeRawText)
        const resumeStructuredText = safeJsonParse(rawResumeStructured, "resume structure")

        const rawJobStructured = await structureJobDescription(jobRawText)
        const jobStructuredText = safeJsonParse(rawJobStructured, "job description structure")

        // 7. Run AI match Analysis using structured resume and job description
        const resumeStructured = JSON.stringify(resumeStructuredText)
        const jobStructured = JSON.stringify(jobStructuredText)

        const rawAiAnalysis = await analysis(resumeStructured, jobStructured)
        const parsedAiAnalysis = safeJsonParse(rawAiAnalysis, "analysis result")

        console.log("=========>", parsedAiAnalysis)
        console.log('resumeStructuredText ', resumeStructuredText)
        console.log('jobStructuredText ', jobStructuredText)

        const schema = parsedAiAnalysis?.schema || parsedAiAnalysis || {}
        const matchMetrics = schema?.matchMetrics || {}
        const experienceMatch = schema?.experienceMatch || {}

        const aiData = {
            atsScore: schema?.atsScore?.score ?? (typeof schema?.atsScore === "number" ? schema.atsScore : null),
            atsScoreReason: schema?.atsScore?.reason ?? null,

            fit: schema?.fit ?? {},
            jobMatch: schema?.jobMatch ?? {},
            matchMetrics: schema?.matchMetrics ?? {},

            matchedSkills: schema?.matchedSkills ?? [],
            missingSkills: schema?.missingSkills ?? [],
            matchedKeywords: schema?.matchedKeywords ?? [],
            missingKeywords: schema?.missingKeywords ?? [],
            experienceMatch: schema?.experienceMatch ?? [],

            insights: schema?.insights ?? [],
            result: schema?.result ?? null,
        }

        const returnData = {
            atsScore: schema?.atsScore?.score ?? (typeof schema?.atsScore === "number" ? schema.atsScore : null),
            atsScoreReason: schema?.atsScore?.reason ?? null,

            fit: schema?.fit ?? {},
            jobMatch: schema?.jobMatch ?? {},

            matchMetrics: matchMetrics,
            experience: matchMetrics?.experience ?? {},
            skills: matchMetrics?.skills ?? {},
            education: matchMetrics?.education ?? {},
            projects: matchMetrics?.projects ?? {},

            matchedSkills: schema?.matchedSkills ?? [],
            missingSkills: schema?.missingSkills ?? [],
            matchedKeywords: schema?.matchedKeywords ?? [],
            missingKeywords: schema?.missingKeywords ?? [],

            experienceMatch: experienceMatch,
            candidateExperience: experienceMatch?.experience ?? {},
            experienceMatchPercentage: experienceMatch?.matchPercentage ?? null,

            insights: schema?.insights ?? [],
            result: schema?.result ?? null,
        }


        // 8. If existing guest, increment guest count by 1
        if (isExistingGuest) {
            guest = await prisma.guest.update({
                where: { id: guest.id },
                data: {
                    count: guest.count + 1,
                },
            })
        }

        // 9. Always create a NEW row in TempAnalysis table for each analysis request
        await prisma.tempAnalysis.create({
            data: {
                guestId: guest.id,
                resumeRawText,
                resumeStructuredText,
                jobRawText,
                jobStructuredText,
                ...aiData,
                resumeContentHash: currentResumeHash,
                jobContentHash: currentJobHash,
            },
        })

        return {
            data: {
                user: guest,
                ...returnData,
                resumeStructuredText,
                jobStructuredText,
                resumeContentHash: currentResumeHash,
                jobContentHash: currentJobHash,
            },
            message: "Analysis successfully",
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        console.error("Create Temp Analysis Error:", error)
        throw new AppError(error.message || "Failed to create temporary analysis", 500)
    }
}
