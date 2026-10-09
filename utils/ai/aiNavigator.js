import { InferenceClient } from "@huggingface/inference"
import OpenAI from "openai"
import "dotenv/config"
import AppError from "../appError.js"
import { DeepSeekModel, Qwen, OpenRouterFree, AI_PROVIDERS } from "./modeName.js"

// Lazy client initializations
let openRouterClient = null
export const getOpenRouterClient = () => {
    if (!openRouterClient) {
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("Warning: OPENROUTER_API_KEY is not defined in environment variables.")
        }
        openRouterClient = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY
        })
    }
    return openRouterClient
}

let hfClient = null
export const getHuggingFaceClient = () => {
    if (!hfClient) {
        if (!process.env.HF_TOKEN) {
            console.warn("Warning: HF_TOKEN is not defined in environment variables.")
        }
        hfClient = new InferenceClient(process.env.HF_TOKEN)
    }
    return hfClient
}

/**
 * Direct call to OpenRouter API
 */
export const callOpenRouter = async ({ messages, model = OpenRouterFree, maxTokens = 20000, temperature = 0.2 }) => {
    // If model is just "openrouter" or empty, resolve to OpenRouterFree ('openrouter/free')
    const targetModel = (!model || model.trim().toLowerCase() === "openrouter")
        ? OpenRouterFree
        : model
    console.log('[OpenRouter] Using model:', targetModel)
    const client = getOpenRouterClient()
    const response = await client.chat.completions.create({
        model: targetModel,
        messages,
        max_tokens: maxTokens,
        temperature
    })
    console.log(`[OpenRouter (${targetModel})] response ->`, response)
    return response.choices?.[0]?.message?.content
}

/**
 * Direct call to HuggingFace Inference API
 */
export const callHuggingFace = async ({ messages, model = DeepSeekModel, maxTokens = 20000, temperature = 0.2}) => {
    const client = getHuggingFaceClient()
    const response = await client.chatCompletion({
        model: model || DeepSeekModel,
        messages,
        max_tokens: maxTokens,
        temperature
    })
    console.log(`[HuggingFace (${model || DeepSeekModel})] response ->`, response)
    return response.choices?.[0]?.message?.content
}

/**
 * DeepSeek on HuggingFace
 */
export const callDeepSeek = async ({ messages, maxTokens = 20000, temperature = 0.2}) => {
    return callHuggingFace({
        messages,
        model: DeepSeekModel,
        maxTokens,
        temperature
    })
}

/**
 * Qwen on HuggingFace
 */
export const callQwen = async ({ messages, maxTokens = 20000, temperature = 0.2}) => {
    return callHuggingFace({
        messages,
        model: Qwen,
        maxTokens,
        temperature
    })
}

/**
 * Central AI Navigator / Router:
 * Inspects requested model / provider and routes data to the corresponding provider function.
 */
export const aiNavigator = async ({ messages, model, maxTokens = 20000, temperature = 0.2, context = "AI task" }) => {
    try {
        const normalizedModel = typeof model === "string" ? model.trim().toLowerCase() : ""

        // // 1. OpenRouter routing
        if (normalizedModel === "openrouter") return await callOpenRouter({ messages, maxTokens, temperature })

        // 2. Qwen routing
        if (normalizedModel === 'qwen') return await callQwen({ messages, maxTokens, temperature })

        // 3. DeepSeek routing
        if (normalizedModel === 'deepseek') return await callDeepSeek({ messages, maxTokens, temperature })

        // Otherwise default to HuggingFace DeepSeek
        return await callOpenRouter({ messages, maxTokens, temperature})

    } catch (error) {
        console.error(`${context} Error:`, error)
        throw new AppError(error.message || `Failed to process ${context}, try again later`, 500)
    }
}

export default aiNavigator
