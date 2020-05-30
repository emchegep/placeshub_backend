const express = require('express')
const { body } = require('express-validator')

const HttpError = require('../models/http-error')

const fileUpload = require('../middleware/file-upload')

const usersControllers = require('../controllers/users-controllers')

const router = express.Router()

router.get('/',usersControllers.getUsers)

router.post('/signup',fileUpload.single('image'),[
    body('name','Please enter your name').notEmpty(),
    body('email','Enter a valid email address').normalizeEmail().isEmail(),
    body('password','Please enter a password (atleast 6 characters)').isLength({min:6}),
],usersControllers.signup)

router.post('/login',usersControllers.login)

module.exports = router
