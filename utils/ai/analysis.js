import { InferenceClient } from "@huggingface/inference";
import "dotenv/config"
import AppError from "../appError.js";
import { DeepSeekModel } from "./modeName.js";

const hf = new InferenceClient(process.env.HF_TOKEN)

export const analysis = async(resumeStructured, jobStructured) =>{
    try {
        const response = await hf.chatCompletion({
            model: DeepSeekModel,
            messages:[
                {
                    role: 'system',
                    content: analysisInstruction
                },
                {
                    role:'user',
                    content: `Return the analysis according to this schema:${analysisSchema} 
                            Resume:${resumeStructured}, Job:${jobStructured}`
                }
            ],
            max_tokens: 20000,
            temperature: 0.2
        })
        console.log("Analysis ->", response)
        return response.choices[0].message.content
    } catch (error) {
        console.error('Analysis Error:', error)
        throw new AppError(error.message || 'Failed to generate analysis, try again later', 500)
    }
}

const analysisInstruction = `
You are CareerOS, an AI resume-job matching assistant.

Compare the provided structured resume with the structured job description and return a concise, evidence-based analysis.

Rules:
- Score the match from 0–100 using only provided data.
- Identify matching skills and keywords.
- Identify important missing skills, keywords, and requirements.
- Compare candidate experience and education with job requirements when applicable.
- Highlight strongest matches, weaknesses, and score-reducing gaps.
- Prioritize required over preferred qualifications.
- Treat skills as equivalent only when reasonably equivalent.
- Never invent or assume skills, experience, qualifications, education, or achievements.
- Keep the analysis concise and job-relevant.
- Return only valid JSON matching the provided schema; no markdown or text outside JSON.
- Solve the date problem like joining / starting May 2026 so it should be subtract from current, get current date and Aug 2026 then subtract 2026 from 2026 and Aug from May so it should be 3 months not -3 months.
`

const analysisSchema = `{
  "schema": {
    "type": "object",
    "properties": {

      "atsScore": {
        "type": "object",
        "properties": {
          "score": {
            "type": "integer",
            "description": "ATS compatibility score, 0-100."
          },
          "reason": {
            "type": "string",
            "description": "Explain the score using keywords, skills, formatting and requirements. If no relevant skills or keywords exist: No relevant keywords or skills found."
          }
        },
        "required": ["score", "reason"],
        "additionalProperties": false
      },

      "fit": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "One of: Excellent Fit, Good Fit, Moderate Fit, Needs Improvement."
          },
          "reason": {
            "type": "string",
            "description": "Overall resume-JD fit considering skills, calculated work experience, education, projects and responsibilities. Use actual employment dates. Treat Present/Current as the current date. 3 sentences."
          }
        },
        "required": ["label", "reason"],
        "additionalProperties": false
      },

      "jobMatch": {
        "type": "object",
        "properties": {
          "percentage": {
            "type": "integer",
            "description": "Overall resume-JD relevance, 0-100."
          },
          "relevance": {
            "type": "string",
            "description": "One of: High, Medium, Low."
          },
          "suggestedMatch": {
            "type": "string",
            "description": "One of: Strong Match, Medium Match, Average Match."
          },
          "reason": {
            "type": "string",
            "description": "Explain overall resume-JD relevance using skills, calculated work experience, projects, education and responsibilities. Do not repeat ATS or skill-match results. 3-5 sentences."
          }
        },
        "required": [
          "percentage",
          "relevance",
          "suggestedMatch",
          "reason"
        ],
        "additionalProperties": false
      },

      "matchMetrics": {
        "type": "object",
        "description": "Category scores. Score each category independently; do not duplicate ATS or jobMatch.",

        "properties": {

          "experience": {
            "type": "object",
            "properties": {
              "score": {
                "type": "integer",
                "description": "Experience match, 0-100. Calculate actual duration for each relevant work experience from its start and end dates. Treat Present/Current as the current date. Compare duration, responsibilities and technologies with the JD. If no relevant experience: 0."
              },
              "reason": {
                "type": "string",
                "description": "Explain the experience score using calculated experience duration, responsibilities and technologies. Never call a valid past start date with Present/Current an error or future date. If no relevant experience: No relevant experience found."
              }
            },
            "required": ["score", "reason"],
            "additionalProperties": false
          },

          "skills": {
            "type": "object",
            "properties": {
              "score": {
                "type": "integer",
                "description": "Skills match, 0-100, based on required, preferred, matched and missing skills. If no relevant skills: 0."
              },
              "reason": {
                "type": "string",
                "description": "Explain the score using required and preferred skills. If no relevant skills: No relevant skills found."
              }
            },
            "required": ["score", "reason"],
            "additionalProperties": false
          },

          "education": {
            "type": "object",
            "properties": {
              "score": {
                "type": "integer",
                "description": "Education match, 0-100, based on degree, field, certifications and JD requirements. If no relevant education: 0."
              },
              "reason": {
                "type": "string",
                "description": "Explain only education alignment. If no relevant education: No relevant education found."
              }
            },
            "required": ["score", "reason"],
            "additionalProperties": false
          },

          "projects": {
            "type": "object",
            "properties": {
              "score": {
                "type": "integer",
                "description": "Project relevance, 0-100. Consider technologies, responsibilities and problem domain, not technology alone. If no relevant projects: 0."
              },
              "reason": {
                "type": "string",
                "description": "Explain project relevance to the JD. If no relevant projects: No relevant projects found."
              }
            },
            "required": ["score", "reason"],
            "additionalProperties": false
          }

        },

        "required": [
          "experience",
          "skills",
          "education",
          "projects"
        ],
        "additionalProperties": false
      },

      "matchedSkills": {
        "type": "array",
        "description": "Skills found in both resume and JD. 1-2 words each. resume's skill to Job description's preferredSkills and requiredSkills fiels, match and list.",
        "items": {
          "type": "string"
        }
      },

      "missingSkills": {
        "type": "array",
        "description": "Important JD skills missing from resume. 1-2 words each. check from resume's skill to Job description's preferredSkills and requiredSkills fiels",
        "items": {
          "type": "string"
        }
      },

      "matchedKeywords": {
        "type": "array",
        "description": "Important keywords found in both resume and JD. 1-2 words each.",
        "items": {
          "type": "string"
        }
      },

      "missingKeywords": {
        "type": "array",
        "description": "Important JD keywords missing from resume. 1-2 words each.",
        "items": {
          "type": "string"
        }
      },

      "experienceMatch": {
        "type": "object",
        "description": "Candidate's total relevant work experience calculated from employment dates and its match with the JD.",
        "properties": {
          "experience": {
            "type": "object",
            "properties": {
              "value": {
                "type": "number",
                "description": "Calculated relevant work experience duration."
              },
              "timeType": {
                "type": "string",
                "enum": ["year", "month", "day"],
                "description": "Use year when duration is at least 1 year, month when under 1 year, and day only when appropriate."
              }
            },
            "required": ["value", "timeType"],
            "additionalProperties": false
          },
          "matchPercentage": {
            "type": "integer",
            "description": "How closely the candidate's calculated relevant experience matches the JD experience requirement, 0-100."
          }
        },
        "required": ["experience", "matchPercentage"],
        "additionalProperties": false
      },

      "insights": {
        "type": "array",
        "description": "Actionable findings. Do not introduce new scores or duplicate existing metrics.",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "One of: strength, gap, recommendation."
            },
            "title": {
              "type": "string",
              "description": "3-6 words."
            },
            "description": {
              "type": "string",
              "description": "3-5 sentences."
            }
          },
          "required": [
            "type",
            "title",
            "description"
          ],
          "additionalProperties": false
        }
      },

      "result": {
        "type": "string",
        "description": "Overall result covering suitability, key strengths and major gaps. 20-30 words. short and concise"
      }

    },

    "required": [
      "atsScore",
      "fit",
      "jobMatch",
      "matchMetrics",
      "matchedSkills",
      "missingSkills",
      "matchedKeywords",
      "missingKeywords",
      "experienceMatch",
      "insights",
      "result"
    ],

    "additionalProperties": false
  }
}`;


