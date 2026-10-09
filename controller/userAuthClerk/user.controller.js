import { clerkClient, getAuth } from "@clerk/express";
import CatchAsync from "../../utils/catchAsync.js";
import { authService } from "../../service/authService.js";
import prisma from "../../lib/prisma.js";

export const PostUser = CatchAsync(async (req, res) => {
    const result = await authService.register(req)
    res.status(result.isNew ? 201 : 200).json({
        status: true,
        message: result.isNew ? 'User Registered Successfully' : 'User already registered',
        data: result.user
    })
})

export const getUser = CatchAsync(async (req, res) => {
    const { userId, getToken } = getAuth(req)
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated"
        })
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    // Look up DB user and relation to AiModel
    let dbUser = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: {
            aiModel: {
                include: {
                    model: true
                }
            }
        }
    })

    // If user authenticated with Clerk but not in DB yet, auto-create record
    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                clerkUserId: userId
            },
            include: {
                aiModel: {
                    include: {
                        model: true
                    }
                }
            }
        })
    }

    const aiModel = dbUser?.aiModel || null

    return res.status(200).json({
        success: true,
        message: "User authenticated",
        data: {
            userId,
            token: await getToken(),
            userDetails: clerkUser,
            dbUser: dbUser,
            aiModel: aiModel,
            hasAiModel: !!aiModel
        }
    })
})
