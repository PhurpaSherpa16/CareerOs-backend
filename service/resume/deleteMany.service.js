import AppError from "../../utils/appError.js"
import prisma from "../../lib/prisma.js"
import { supabase } from "../../utils/supabase.js"
import { getAuthUser } from "../../utils/getAuthUser.js"

export const deleteMultipleResumes = async (req) => {
    // 1. Authenticate user & get DB user record
    const dbUser = await getAuthUser(req)

    // 2. Validate input parameter
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError("An array of resume IDs ('ids') is required for bulk deletion", 400)
    }

    // 3. Find matching resumes belonging to this user
    const userResumes = await prisma.resume.findMany({
        where: {
            id: { in: ids },
            userId: dbUser.id,
        },
        select: {
            id: true,
            fileUrl: true,
        },
    })

    if (!userResumes || userResumes.length === 0) {
        throw new AppError("No matching resumes found or you do not have permission to delete them", 404)
    }

    const validIds = userResumes.map((r) => r.id)

    // 4. Collect storage file paths to remove from Supabase storage
    const storagePathsToRemove = []
    for (const resume of userResumes) {
        if (resume.fileUrl) {
            const storagePath = resume.fileUrl.split("/resume/").pop()
            if (storagePath) {
                storagePathsToRemove.push(decodeURIComponent(storagePath))
            }
        }
    }

    // 5. Delete files from Supabase storage if any exist
    if (storagePathsToRemove.length > 0) {
        const { error: deleteStorageError } = await supabase.storage
            .from("resume")
            .remove(storagePathsToRemove)

        if (deleteStorageError) {
            console.error("Supabase Bulk Storage Deletion Error:", deleteStorageError)
        }
    }

    // 6. Delete resume records from database
    const deleteResult = await prisma.resume.deleteMany({
        where: {
            id: { in: validIds },
            userId: dbUser.id,
        },
    })

    return {
        count: deleteResult.count,
        deletedIds: validIds,
    }
}

