const ErrorHandler = require('../utils/errorHandler')

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal server error'

// wrong mongo db id error 
if(err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400)
}

// mongoose duplicate key error
if(err.code === 11000)
{
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
}

// wrong jwt error
if(err.name === "JsonwebTokenError") {
    const message = `Json web token is invaid, try again `;
    err = new ErrorHandler(message, 400)
}

// jwt token expire
if(err.name === "TokenExpiredError") {
    const message = `Json web token is expired, try again `;
    err = new ErrorHandler(message, 400)
}

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
};