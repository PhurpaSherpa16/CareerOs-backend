import path from "path"
import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { supabase } from "../../utils/supabase.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { extractPdfText } from "../../utils/extractorPDFText.js"
import { structureResume } from "../../utils/ai/strucutreResume.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"

export const createResume = async (req) => {
    // 1. Authenticate user and get DB user
    const dbUser = await getAuthUser(req)

    // 2. Validate uploaded resume file
    const file = req.files?.resume?.[0] || null
    if (!file) {
        throw new AppError("Resume file is required", 400)
    }

    // extract raw text
    const rawText = await extractPdfText(file.buffer)
    if (!rawText) {
        throw new AppError("Failed to extract text from PDF", 500)
    }
    
    const rawStructuredText = await structureResume(rawText)
    if (!rawStructuredText) throw new AppError("Failed to extract structured text from PDF", 400)
    const structuredText = safeJsonParse(rawStructuredText, "resume structure")

    let uploadedStoragePath = null

    try {
        const originalName = file.originalname
        const title = path.parse(originalName).name || originalName
        const userId = dbUser.id
        if (!userId) {
            throw new AppError("User ID is required", 400)
        }
        console.log('userId ', userId)

        // 4. Upload file to Supabase storage bucket 'resume'
        const storagePath = `${userId}/${Date.now()}_${originalName}`

        const { error: uploadError } = await supabase.storage
            .from("resume")
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            })

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError)
            throw new AppError(`File upload failed: ${uploadError.message}`, 500)
        }

        // Track uploaded path for rollback if database operation fails
        uploadedStoragePath = storagePath

        // 5. Retrieve public URL for uploaded file
        const { data: publicUrlData } = supabase.storage
            .from("resume")
            .getPublicUrl(storagePath)

        const fileUrl = publicUrlData?.publicUrl || null

        // 6. Create Resume record in Prisma
        const newResume = await prisma.resume.create({
            data: {
                userId,
                title,
                fileUrl,
                fileName: originalName,
                rawText: rawText,
                structuredText: structuredText,
            },
        })

        return newResume
    } catch (error) {
        // Rollback uploaded file if DB insertion or post-upload operation fails
        if (uploadedStoragePath) {
            try {
                const decodedPath = decodeURIComponent(uploadedStoragePath)
                const { error: deleteError } = await supabase.storage
                    .from("resume")
                    .remove([decodedPath])

                if (deleteError) {
                    console.error("Failed to delete uploaded file during rollback:", deleteError)
                }
            } catch (cleanupError) {
                console.error("Error during file cleanup rollback:", cleanupError)
            }
        }

        if (error instanceof AppError) throw error
        console.error("Create Resume Error:", error)
        throw new AppError(error.message || "Failed to create resume", 500)
    }
}
