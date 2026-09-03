import path from "path"
import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { supabase } from "../../utils/supabase.js"
import { getAuthUser } from "../../utils/getAuthUser.js"
import { extractPdfText } from "../../utils/extractorPDFText.js"
import { structureResume } from "../../utils/ai/strucutreResume.js"
import { safeJsonParse } from "../../utils/safeJsonParse.js"

export const updateResumeFile = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    // 2. Validate route parameter
    const { id } = req.params
    if (!id) {
        throw new AppError("Resume ID is required", 400)
    }

    // 3. Find resume in database and verify ownership
    const resume = await prisma.resume.findUnique({
        where: { id },
    })

    // 4. Validate uploaded resume file
    const file = req.files?.resume?.[0] || null
    if (!file) {
        throw new AppError("Resume file is required", 400)
    }

    // extract raw text
    const rawText = await extractPdfText(file.buffer)
    if (!rawText) throw new AppError("Failed to extract text from PDF", 500)

    const rawStructuredText = await structureResume(rawText)
    if (!rawStructuredText) throw new AppError("Failed to extract structured text from PDF", 500)
    const structuredText = safeJsonParse(rawStructuredText, "resume structure")
    
    if (!resume) {
        throw new AppError("Resume not found", 404)
    }

    if (resume.userId !== dbUser.id) {
        throw new AppError("You do not have permission to update this resume", 403)
    }

    const oldFileUrl = resume.fileUrl
    let uploadedStoragePath = null

    try {
        const originalName = file.originalname
        const title = path.parse(originalName).name || originalName
        const userId = dbUser.id

        // 5. Upload new file to Supabase storage bucket 'resume'
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

        // 6. Retrieve public URL for uploaded file
        const { data: publicUrlData } = supabase.storage
            .from("resume")
            .getPublicUrl(storagePath)

        const fileUrl = publicUrlData?.publicUrl || null

        // 7. Update Resume record in Prisma
        const updatedResume = await prisma.resume.update({
            where: { id },
            data: {
                fileUrl,
                fileName: originalName,
                title,
                rawText: rawText,
                structuredText: structuredText || {},
                updatedAt: new Date(),
            },
        })

        // 8. Delete old file from Supabase storage if it existed (prevent orphan file)
        if (oldFileUrl) {
            const oldStoragePath = oldFileUrl.split("/resume/").pop()
            if (oldStoragePath) {
                const decodedPath = decodeURIComponent(oldStoragePath)
                const { error: deleteOldError } = await supabase.storage
                    .from("resume")
                    .remove([decodedPath])

                if (deleteOldError) {
                    console.error("Failed to delete old file from storage:", deleteOldError)
                }
            }
        }

        return updatedResume
    } catch (error) {
        // Rollback uploaded new file if DB update fails
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
        console.error("Update Resume File Error:", error)
        throw new AppError(error.message || "Failed to update resume file", 500)
    }
}
