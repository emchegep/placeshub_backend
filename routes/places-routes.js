const express = require('express')
const { body } = require('express-validator')

const placeControllers = require('../controllers/places-controllers')

const fileUpload = require('../middleware/file-upload')
const checkAuth = require('../middleware/check-auth')

const router = express.Router()

router.get('/:pid',placeControllers.getPlaceById)

router.get('/user/:uid',placeControllers.getPlaceByUserId)

router.use(checkAuth)

router.post('/',fileUpload.single('image'),[
    body('title','Please Enter title').notEmpty(),
    body('description','Description should be atleast 5 characters').isLength({min: 5}),
    body('address','Please Enter password').notEmpty(),

],placeControllers.createPlace)

router.patch('/:pid',[
    body('title','Please Enter title').notEmpty(),
    body('description','Description should be atleast 5 characters').isLength({min: 5})
],placeControllers.updatePlaceById)

router.delete('/:pid',placeControllers.deletePlace)

module.exports = router
