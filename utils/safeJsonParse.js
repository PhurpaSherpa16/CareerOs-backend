import AppError from "./appError.js"

/**
 * Safely parses JSON string returned by AI models, stripping markdown code block wrappers
 * and extraneous text if present.
 *
 * @param {any} input - String or parsed JSON object from AI output
 * @param {string} fallbackName - Context descriptor for error messages
 * @returns {object|array} Parsed JSON object/array
 */
export const safeJsonParse = (input, fallbackName = "AI output") => {
    if (typeof input === "object" && input !== null) {
        return input
    }

    if (typeof input !== "string" || !input.trim()) {
        throw new AppError(`Invalid AI output format for ${fallbackName}`, 500)
    }

    let cleaned = input.trim()

    // 1. Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
    if (cleaned.includes("```")) {
        cleaned = cleaned.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim()
    }

    // 2. Isolate substring between first JSON opening character ({ or [) and last JSON closing character (} or ])
    const firstBrace = cleaned.search(/[\{\[]/)
    const lastObjBrace = cleaned.lastIndexOf("}")
    const lastArrBrace = cleaned.lastIndexOf("]")
    const lastBrace = Math.max(lastObjBrace, lastArrBrace)

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }

    try {
        let parsed = JSON.parse(cleaned)
        // In case the AI output was stringified twice
        if (typeof parsed === "string") {
            try {
                parsed = JSON.parse(parsed)
            } catch (_) {
                // Keep single parsed string if second parse fails
            }
        }
        return parsed
    } catch (error) {
        console.error(`Failed to parse JSON for ${fallbackName}:`, error, "\nRaw Input:\n", input)
        throw new AppError(`Failed to parse AI output for ${fallbackName}`, 500)
    }
}
