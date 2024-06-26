const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const User = require('../models/userModel');
const sendToken = require('../utils/jwtToken');
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto");

exports.registerUser = catchAsyncErrors( async (req, res, next) => {
    const {name, email, password} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: "this is a sample id",
            url: "profilePicUrl"
        }
    });

    sendToken(user, 201, res);
});

// login user
exports.loginUser = catchAsyncErrors( async (req, res, next) => {
    const { email, password } = req.body;

    // if user has given both email and password
    if(!email || !password)
    {
        return next(new ErrorHandler("Enter email and password"), 400);
    }

    const user = await User.findOne({email}).select("+password");

    if(!user)
    {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = user.comparePassword(password);

    if(!isPasswordMatched)
    {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

// logout 
exports.logout = catchAsyncErrors (async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged out"
    });
});

// forgot password 
exports.forgotPassword = catchAsyncErrors (async (req, res, next) => {
    const user = await User.findOne({email: req.body.email});

    if(!user) {
        return next( new ErrorHandler("User not found", 404));
    }

    // generate reset password token
    const resetToken = (user.getResetPasswordToken()).toString();

    await user.save({validateBeforeSave: false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not 
    requested this email , you can ignore this`;

    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce password recovery`,
            message
        });

        res.status(200).json({
            success: true,
            message: `Email is sent to ${user.email}`
        })
    }catch(error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({validateBeforeSave: false});

        return next(new ErrorHandler(error.message, 500));
    }
});

exports.resetPassword = catchAsyncErrors (async (req, res, next) => {

    // create token hash
    const resetPasswordToken = crypto.createHash("sha256")
                               .update(req.params.token)
                               .digest("hex");
            
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now()}
    });

    if(!user) {
        return next( new ErrorHandler("Reset password is invalid or has expired", 400));
    }

    if(req.body.password !== req.body.confirmPassword)
    {
        return next( new ErrorHandler("Password not match ", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save();

    sendToken(user, 200, res);
});

// get user details
exports.getUserDetails = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

// update user password
exports.updatePassword = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await(user.comparePassword(req.body.oldPassword));

    if(!isPasswordMatched)
    {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword)
    {
        return next (new ErrorHandler("Password does not match", 400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res);

});

// update user profile
exports.updateProfile = catchAsyncErrors( async (req, res, next) => {
    
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    
    // add cloudinary later for avatar (profile photo)

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    });
});

// get all users (admin)
exports.getAllUser = catchAsyncErrors( async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    });
});

// get single users (admin)
exports.getSingleUser = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user)
    {
        return next (new ErrorHandler(`User does not exist with id: ${req.body.params}`), 400);
    }

    res.status(200).json({
        success: true,
        user
    });
});

// update user role -- ( by admin )
exports.updateUserRole = catchAsyncErrors( async (req, res, next) => {
    
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    });
});

// delete user -- ( by admin )
exports.deleteUser = catchAsyncErrors( async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) 
    {
        return next ( new ErrorHandler(`User does not exist with id: ${req.params.id}`), 400 )
    }

    await user.deleteOne();
    
    // we will cloudinary later 



    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});