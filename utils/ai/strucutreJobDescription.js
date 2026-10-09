import { aiNavigator } from "./aiNavigator.js"
import { jobInstruction, jobSchema } from "./job.guideline.js"

/**
 * Structures raw job description text into structured JSON matching job guideline schema.
 * @param {string} description - Raw job description text
 * @param {object|string} [options] - Optional model configuration or model name string
 * @returns {Promise<string>} - Raw JSON response string from the AI model
 */
export const structureJobDescription = async (description, options = {}) => {
    const model = typeof options === "string" ? options : options?.model
    const provider = options?.provider

    return await aiNavigator({
        messages: [
            {
                role: 'system',
                content: jobInstruction
            },
            {
                role: 'user',
                content: `Return the job data according to this schema:${jobSchema} 
                            Resume:${description}`
            }
        ],
        model,
        provider,
        maxTokens: 20000,
        temperature: 0.2,
        context: 'Job Description Structuring'
    })
}

export default structureJobDescription