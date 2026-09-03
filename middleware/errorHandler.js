export const errorHandler = (err, req, res, next) =>{
    err.statusCode = err.statusCode || 500
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if(isDevelopment){
        console.log('Error: ', err)
        res.status(err.statusCode).json({
            success: false,
            statusCode : err.statusCode,
            message: err.message,
            stack: err.stack,
            error: err
        })
    }else{
        if(err.isOperational){
            res.status(err.statusCode).json({
                success: false,
                statusCode : err.statusCode,
                message: err.message
            })
        }else{
            console.error('CRITICAL ERROR: ', err)
            res.status(500).json({
                success: false,
                statusCode : 500,
                message: 'Something went wrong. Please try again later.'
            })
        }
    } 
}

export const urlNotFound = (req, res) =>{
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `URL not found. ${req.originalUrl}`,
        default_url: `/`
    })
}