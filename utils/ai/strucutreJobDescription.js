import { InferenceClient } from "@huggingface/inference"
import "dotenv/config"
import AppError from "../appError.js"
import { DeepSeekModel } from "./modeName.js"

const hf = new InferenceClient(process.env.HF_TOKEN)

export const structureJobDescription = async(description)=>{
    try {
      const response = await hf.chatCompletion({
          model: DeepSeekModel,
          messages:[{
              role: 'system',
              content: jobInstruction
              },
              {
                  role:'user',
                  content: `Return the job data according to this schema:${jobSchema} 
                              Resume:${description}`
              }
          ],
          max_tokens: 20000,
          temperature: 0.2
      })
      console.log('JD response -> ',response)
      return response.choices[0].message.content
    } catch (error) {
      console.error('Job Description Structuring Error:', error)
      throw new AppError(error.message || 'Failed to structure job description, try again later', 500)
    }
}

// job description instruction  
const jobInstruction = `
You are a job description parsing assistant for CareerOS.

Your task is to extract structured information from a job description.

Rules:
- Only extract information explicitly present in the job description.
- Never invent, assume, or infer requirements that are not stated.
- Preserve the original meaning of the job description.
- Separate required qualifications from preferred qualifications when possible.
- Extract technical skills, soft skills, responsibilities, experience requirements, education requirements, and other relevant requirements.
- If information is missing, return null / not specified / not available / an empty array / false / true / 0 or undefined based on the field it is.
- Return only valid JSON matching the provided schema.
- Do not include markdown, explanations, or additional text outside the JSON.
`

const jobSchema = `{
  "schema": {
    "type": "object",
    "properties": {
      "jobInfo": {
        "type": "object",
        "properties": {
          "title": { "type": ["string", "null"] , "description": "Title of the job"},
          "company": { "type": ["string", "null"] , "description": "Company name of the job"},
          "location": { "type": ["string", "null"] , "description": "Location of the job"},
          "employmentType": { "type": ["string", "null"] , "description": "Employment type of the job"},
          "remote": { "type": ["boolean", "null"] , "description": "Remote status of the job"}
        },
        "required": [
          "title",
          "company",
          "location",
          "employmentType",
          "remote"
        ],
        "additionalProperties": false
      },

      "summary": {
        "type": ["string", "null"], "description": "Summary of the job, max 300-400 words"
      },

      "experience": {
        "type": "string", "description": "Experience required for the job / if not available return not specified"
      },

      "salary": {
        "type": "string", "description": "Salary for the job / if not available return not specified"
      },

      "rolesAndResponsibilities": {
        "type": "array",
        "description": "List of roles and responsibilities of the job, max 30-40 words per each responsibility",
        "items": {
          "type": "string"
        }
      },

      "requiredSkills": {
        "type": "array",
        "description": "List of technical skills required for the job, only 1-2 words per skill",
        "items": {
          "type": "string",
          
        }
      },

      "preferredSkills": {
        "type": "array",
        "description": "List of preferred skills for the job, only 1-2 words per skill",
        "items": {
          "type": "string"
        }
      },

      "experienceRequirements": {
        "type": "array",
        "description": "List of experience requirements for the job, only 1-2 words per experience",
        "items": {
          "type": "string"
        }
      },

      "educationRequirements": {
        "type": "array",
        "description": "List of education requirements for the job, only 1-2 words per education",
        "items": {
          "type": "string"
        }
      },

      "softSkills": {
        "description": "List of soft skills required for the job, only 1-2 words per skill",
        "type": "array",
        "items": {
          "type": "string"
        }
      },

      "keywords": {
        "type": "array",
        "description": "List of keywords for the job, only 1-2 words per keyword",
        "items": {
          "type": "string"
        }
      }
    },

    "required": [
      "jobInfo",
      "summary",
      "experience",
      "salary",
      "rolesAndResponsibilities",
      "requiredSkills",
      "preferredSkills",
      "experienceRequirements",
      "educationRequirements",
      "softSkills",
      "keywords"
    ],

    "additionalProperties": false
  }
}`