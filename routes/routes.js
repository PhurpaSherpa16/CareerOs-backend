import express from 'express'
import { getAllProjects } from '../controller/project.controller.js'

const router = express.Router()

router.get('/', getAllProjects)

export default router