import express from 'express'
import { getUser, PostUser } from '../controller/userAuthClerk/user.controller.js'

const router = express.Router()

router.get('/me', getUser)

//Post
// Register user
router.post('/register', PostUser)


export default router