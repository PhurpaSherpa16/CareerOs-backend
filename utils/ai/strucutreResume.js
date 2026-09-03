import { InferenceClient } from "@huggingface/inference"
import "dotenv/config"
import AppError from "../appError.js"
import { DeepSeekModel } from "./modeName.js"

const hf = new InferenceClient(process.env.HF_TOKEN)

export const structureResume = async(rawText)=>{
    try {
        const response = await hf.chatCompletion({
            model: DeepSeekModel,
            messages:[{
                role: 'system',
                content: instruction
                },
                {
                    role:'user',
                    content: `Return the resume data according to this schema:${schema} 
                                Resume:${rawText}`
                }
            ],
            max_tokens: 20000,
            temperature: 0.2
        })
        console.log('Resume -> ',response)
        return response.choices[0].message.content
    } catch (error) {
        console.error('Resume Structuring Error:', error)
        throw new AppError(error.message || 'Failed to structure resume, try again later', 500)
    }
}

const instruction = `You are a resume parsing assistant.

Your job is to extract structured information from a resume.

Rules:
- Only use information present in the resume.
- Never invent or assume information.
- If information is missing, use null or an empty array.
- Return valid JSON only.`

const schema = `{
  "schema": {
    "type": "object",
    "properties": {
      "contact": {
        "type": "object",
        "properties": {
          "name": { "type": ["string", "null"], "description": "Name of the candidate" },
          "email": { "type": ["string", "null"], "description": "Email of the candidate" },
          "phone": { "type": ["string", "null"], "description": "Phone number of the candidate" },
          "linkedin": { "type": ["string", "null"], "description": "Linkedin profile url of the candidate" },
          "github": { "type": ["string", "null"], "description": "Github profile url of the candidate" },
          "portfolio": { "type": ["string", "null"], "description": "Portfolio url of the candidate, it could be a link to personal website, blog, or online portfolio if not available return 'not available'" }
        },
        "additionalProperties": false
      },
      "summary": { "type": ["string", "null"], "description": "2-3 sentences summary of the candidate" },
      "experience": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "jobTitle": { "type": ["string", "null"], "description": "Job title of the candidate" },
            "company": { "type": ["string", "null"], "description": "Company name of the candidate" },
            "location": { "type": ["string", "null"], "description": "Location of the candidate" },
            "startDate": { "type": ["string", "null"], "description": "Start date of the candidate" },
            "endDate": { "type": ["string", "null"], "description": "End date of the candidate" },
            "description": { "type": ["string", "null"], "description": "Description of the candidate" },
            "year_expereince":{ "type": ["number", "null"],
              "description": "number of year of experience",
              "min": 0,
              "max": 30
            }
          },
          "additionalProperties": false
        }
      },
      "education": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "degree": { "type": ["string", "null"], "description": "Degree of the candidate" },
            "school": { "type": ["string", "null"], "description": "School name of the candidate" },
            "location": { "type": ["string", "null"], "description": "Location of the candidate" },
            "startDate": { "type": ["string", "null"], "description": "Start date of the candidate" },
            "endDate": { "type": ["string", "null"], "description": "End date of the candidate" },
            "gpa": { "type": ["string", "null"], "description": "GPA of the candidate / if not available return null" }
          },
          "additionalProperties": false
        }
      },
      "skills": {
        "type": "array",
        "description": "List of technical skills, frameworks, tools, and technologies the candidate possesses. Include programming languages, software proficiencies, and any relevant technical expertise.",
        "items": { "type": "string" }
      },
      "projects": {
        "type": "array",
        "description": "List of projects the candidate has worked on.",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": ["string", "null"], "description": "Name of the project" },
            "description": { "type": ["string", "null"], "description": "Description of the project, only 2-3 sentences" },
            "link": { "type": ["string", "null"], "description": "Link to the project if available otherwise return null" }
          },
          "additionalProperties": false
        }
      }
    },
    "required": ["contact","summary","experience","education","skills","projects"]
  }
}`