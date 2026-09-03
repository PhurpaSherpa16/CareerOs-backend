import "dotenv/config"
import express from "express"
import cors from 'cors'
import { errorHandler, urlNotFound } from "./middleware/errorHandler.js"
import { clerkMiddleware } from "@clerk/express"
import userAuthClerk from './routes/userAuthClerk.routes.js'
import resumeRoutes from './routes/resume.routes.js'
import jobRoutes from './routes/job.routes.js'
import analysisRoutes from './routes/analysis.routes.js'
import { initTempAnalysisCron } from './utils/tempAnalysis.cron.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api/auth', userAuthClerk) 
app.use('/resume', resumeRoutes)
app.use('/job', jobRoutes)
app.use('/analysis', analysisRoutes)

// Initialize cron job for TempAnalysis auto-deletion
initTempAnalysisCron()

// error 
app.use(errorHandler)
// error url not found
app.use(urlNotFound)


const PORT = process.env.PORT || 9000
if(process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`)
    })
}

export default app