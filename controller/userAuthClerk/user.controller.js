import { clerkClient, getAuth } from "@clerk/express";
import CatchAsync from "../../utils/catchAsync.js";
import { authService } from "../../service/authService.js";


export const PostUser = CatchAsync(async (req, res) =>{
    const result = await authService.register(req)
    res.status(result.isNew ? 201 : 200).json({
        status: true,
        message: result.isNew ? 'User Registered Successfully' : 'User already registered',
        data: result.user
    })
})


export const getUser = CatchAsync(async (req, res) => {
    const {userId, getToken} = getAuth(req)
    
    if(!userId){
        return res.status(401).json({
            success: false,
            message: "User not authenticated"
        })
    }

    const user = await clerkClient.users.getUser(userId);

    return res.status(200).json({
        success: true,
        message: "User authenticated",
        data: {
            userId,
            token: await getToken(),
            userDetails: user
        }
    })
})

