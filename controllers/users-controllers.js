const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')

const User = require('../models/user')

//get all users function
exports.getUsers = async (req,res,next)=>{
    let users;
    try {
        users = await User.find({},'-password').exec()
    } catch (err) {
        return next(new HttpError('Error retrieving users. Try again later',500))
    }
    if (!users || users.length === 0){
        return next(new HttpError('No user Found',404))
    }

    res.status(200).json({users:users.map(user=>user.toObject({getters: true}))})
}

//user signup function
exports.signup = async (req,res,next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid inputs.Please check your data'))
    }

    const {name, email, password} = req.body
    //check if the user already exist
    let existingUser;
    try {
        existingUser = await User.findOne({email: email}).exec()
    } catch (err) {
        return next(new HttpError('Signup failed.please try again later',500))
    }
if (existingUser){
    return next(new HttpError('User exist already. please login instead',422))
}
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password,12)
    }catch (err) {
        return next(new HttpError('Signup failed. Please try again later', 500))
    }
    const createdUser = new User({
        name,
        email,
        password:hashedPassword,
        image:req.file.path,
        places:[]
    })

    try{
        await createdUser.save()
    } catch (err) {
        return next(new HttpError('Signup failed.Please try again',500))
    }

    let token;
    try {
        token = jwt.sign({userId:createdUser.id, email: createdUser.email},process.env.JWT_KEY,{expiresIn: '1h'})
    } catch (err) {
        return next(new HttpError('Signup failed. Please try again later', 500))
    }

    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token})
}

//user login function
exports.login = async (req,res,next)=>{
const { email, password } = req.body

    let existingUser;
    try{
        existingUser = await User.findOne({email: email}).exec()
    } catch (err) {
        return next(new HttpError('logging in failed. Please try again',500))
    }

    if (!existingUser){
        return next(new HttpError('Invalid credential no user.Please try again',401))
    }

    let isPasswordValid = false;
    try {
         isPasswordValid= await bcrypt.compare(password,existingUser.password)
    } catch (e) {
        return next(new HttpError('Logging failed.Please try again',500))
    }

     if (!isPasswordValid){
         return next(new HttpError('Invalid credential password issue.Please try again',401))
     }

     let token;
     try {
         token = jwt.sign({userId: existingUser.id, email: existingUser.email},process.env.JWT_KEY,{expiresIn: '1h'})
     } catch (err) {
         return next(new HttpError('Logging failed.Please try again',500))
     }
    res.status(200).json({userId: existingUser.id, email: existingUser.email, token: token})
}
