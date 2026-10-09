import { aiNavigator } from "./aiNavigator.js"
import { analysisInstruction, analysisSchema } from "./analysis.guideline.js"
import { Qwen } from "./modeName.js"

/**
 * Runs AI matching analysis comparing structured resume with structured job description.
 * @param {object|string} resumeStructured - Structured resume object or JSON string
 * @param {object|string} jobStructured - Structured job description object or JSON string
 * @param {object|string} [options] - Optional model configuration or model name string
 * @returns {Promise<string>} - Raw JSON response string from the AI model
 */
export const analysis = async (resumeStructured, jobStructured, options = {}) => {
    const model = typeof options === "string" ? options : options?.model
    const provider = options?.provider

    const resumePayload = resumeStructured?.schema || resumeStructured
    const jobPayload = jobStructured?.schema || jobStructured

    const resumeString = typeof resumePayload === "string" 
        ? resumePayload 
        : JSON.stringify(resumePayload, null, 2)

    const jobString = typeof jobPayload === "string" 
        ? jobPayload 
        : JSON.stringify(jobPayload, null, 2)

    return await aiNavigator({
        messages: [
            {
                role: 'system',
                content: analysisInstruction
            },
            {
                role: 'user',
                content: `Return the analysis according to this schema:${analysisSchema} 

                    Resume:
                    ${resumeString}

                    Job Description:
                    ${jobString}`
            }
        ],
        model: model || Qwen,
        provider,
        maxTokens: 8000,
        temperature: 0.2,
        context: 'Resume-Job Analysis'
    })
}

export default analysis
