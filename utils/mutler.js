import multer from "multer";
import AppError from "./appError.js";

const storage = multer.memoryStorage()

// Resume validation
export const createResumeValidation = multer({
    storage, limits:{
        fileSize: 1024 * 1024 * 10 // 10 Mb
    },
    fileFilter:(req, file, cb) =>{
        if(file.fieldname === 'resume'){
            const allowedMimeTypes = [
                "application/pdf"
            ]

            if(allowedMimeTypes.includes(file.mimetype)){
                cb(null, true)
            }else{
                cb(new AppError("Invalid file type. Only PDF files are allowed.", 400))
            }
        }else{
            cb(new AppError("Invalid file field name", 400))
        }
    }
}).fields([{name:'resume', maxCount:1}])
