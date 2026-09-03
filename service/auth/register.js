import { clerkClient, getAuth } from "@clerk/express"
import AppError from "../../utils/appError.js"
import { supabase } from "../../utils/supabase.js"
import prisma from "../../lib/prisma.js"

export const register = async(req) =>{
    const {userId, isAuthenticated} = getAuth(req)
    if(!isAuthenticated || !userId){
        throw new AppError("User not authenticated", 401)
    }

    try {
        // getting user data from clerk
        const userData = await clerkClient.users.getUser(userId)
        
        const findUser = await prisma.user.findUnique({
            where: {
                clerkUserId: userData.id
            }
        })
        if(findUser) return { user: findUser, isNew: false }

        const newUser = await prisma.user.create({
            data: {
                clerkUserId: userData.id
            }
        })

        return { user: newUser, isNew: true }

    } catch (error) {
        console.log(error)
        if (error instanceof AppError) throw error
        throw new AppError('Signup failed, please try again later.', 400);
    }
}