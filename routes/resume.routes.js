import express from 'express'
import { CreateResume, GetUserResumes, GetSingleResume, DeleteResume, UpdateResumeFile, DeleteMultipleResumes } from '../controller/resume.controller.js'
import { createResumeValidation } from '../utils/mutler.js'
import multer from 'multer'

const router = express.Router()
const upload = multer()

// Post
router.post('/create', createResumeValidation, CreateResume)

// Get
router.get('/all', GetUserResumes)
router.get('/:id', GetSingleResume)

// update - update the resume file only 
router.put('/update/:id', createResumeValidation, UpdateResumeFile)


// Delete
router.delete('/delete/:id', DeleteResume)
// Delete Multiple file at once
router.delete('/delete-multiple',  DeleteMultipleResumes)

export default router