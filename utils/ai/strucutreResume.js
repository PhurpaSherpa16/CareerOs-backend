import { aiNavigator } from "./aiNavigator.js"
import { resumeInstruction, resumeSchema } from "./resume.guideline.js"

/**
 * Structures raw resume text into structured JSON matching resume guideline schema.
 * @param {string} rawText - Unstructured text from parsed resume PDF
 * @param {object|string} [options] - Optional model configuration or model name string (e.g. 'openrouter/free', 'deepseek', 'qwen')
 * @returns {Promise<string>} - Raw JSON response string from the AI model
 */
export const structureResume = async (rawText, options = {}) => {
    const model = typeof options === "string" ? options : options?.model

    return await aiNavigator({
        messages: [
            {
                role: 'system',
                content: resumeInstruction
            },
            {
                role: 'user',
                content: `Return the resume data according to this schema:${resumeSchema} 
                            Resume:${rawText}`
            }
        ],
        model,
        maxTokens: 20000,
        temperature: 0.2,
        context: 'Resume Structuring'
    })
}

export default structureResume