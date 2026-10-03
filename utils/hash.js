import crypto from "crypto"

/**
 * Computes a SHA-256 hash string for given content.
 * @param {string} content 
 * @returns {string} hex-encoded hash
 */
export const computeHash = (content) => {
    return crypto.createHash("sha256").update(content || "").digest("hex")
}

/**
 * Computes a content hash for a resume based on its raw extracted text.
 * @param {string} rawText 
 * @returns {string} hex-encoded hash
 */
export const computeResumeHash = (rawText) => {
    return computeHash((rawText || "").trim())
}

/**
 * Computes a content hash for a job based on its title and description.
 * @param {string} description 
 * @param {string} [title=""] 
 * @returns {string} hex-encoded hash
 */
export const computeJobHash = (description, title = "") => {
    return computeHash(`${(title || "").trim()}_${(description || "").trim()}`)
}
