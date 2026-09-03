import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { supabase } from "../../utils/supabase.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const deleteResume = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    // 2. Validate input parameter
    const { id } = req.params
    if (!id) {
        throw new AppError("Resume ID is required", 400)
    }

    // 3. Find resume in database
    const resume = await prisma.resume.findUnique({
        where: { id },
    })

    if (!resume) {
        throw new AppError("Resume not found", 404)
    }

    // 4. Verify ownership
    if (resume.userId !== dbUser.id) {
        throw new AppError("You do not have permission to delete this resume", 403)
    }

    // 5. Delete file from Supabase storage if fileUrl exists
    if (resume.fileUrl) {
        const storagePath = resume.fileUrl.split("/resume/").pop()
        if (storagePath) {
            const decodedPath = decodeURIComponent(storagePath)
            const { error: deleteStorageError } = await supabase.storage
                .from("resume")
                .remove([decodedPath])

            if (deleteStorageError) {
                console.error("Supabase Storage Deletion Error:", deleteStorageError)
            }
        }
    }

    // 6. Delete resume record from Prisma database
    const deletedResume = await prisma.resume.delete({
        where: { id },
    })

    return deletedResume
}
