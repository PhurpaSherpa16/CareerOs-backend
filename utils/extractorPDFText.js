import { PDFParse } from 'pdf-parse'
import AppError from './appError.js'

export const extractPdfText = async (buffer) => {
    if (!buffer) {
        throw new AppError("PDF buffer is required", 400)
    }

    const parser = new PDFParse({
        data: buffer
    })
    try {
        const result = await parser.getText()
        return result.text.trim()
    } catch (error) {
        throw new AppError("Failed to extract text from PDF: " + error.message)        
    }finally{
        await parser.destroy()
    }
}