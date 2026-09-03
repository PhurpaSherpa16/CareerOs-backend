import { InferenceClient } from "@huggingface/inference"
import "dotenv/config"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { DeepSeekModel } from "./modeName"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const hf = new InferenceClient(process.env.HF_TOKEN)

export const QwenAi = async()=>{
    const prd = await fs.readFile(path.join(__dirname, '../../ai/PRD.md'),'utf-8')
    const instruct = `You are the CareerOS AI assistant.
            CareerOS is a platform that helps users analyze their resumes
            against job descriptions and understand how well their resume
            matches a target job.
            Use the provided PRD as the source of truth.
            Do not invent features that are not described in the PRD.`
    const userResponse = `Read the CareerOS PRD below and explain to a normal user:
            1. What is CareerOS?
            2. What problem does it solve?
            3. How does it help someone looking for a job?
            4. Give a short, easy-to-understand summary.
            PRD:
            ${prd}`

    const response = await hf.chatCompletion({
        model: DeepSeekModel,
        messages:[{
            role: 'system',
            content: instruct
            },
            {
                role:'user',
                content: userResponse
            }
        ],
        max_tokens: 20000,
        temperature: 0.2
    })
    console.log('AI response -> ',response)
    return response.choices[0].message.content
}

QwenAi().then((result)=>{
    console.log("\nQwen response:\n")
    console.log(result)
}).catch((error)=>{
    console.log('AI error -> ',error)
})