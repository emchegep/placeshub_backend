const fs = require('fs')

const mongoose = require('mongoose')
const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')


const getCoordsForAddress = require('../util/location')
const Place = require('../models/place')
const User = require('../models/user')

//get place by place id function
exports.getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId).exec()
    } catch (err) {
        const error = new HttpError('something went wrong while fetching place. please try again',500)
        return next(error)
    }
    if (!place){
        const error = new HttpError('Could not find a place.',404)
        return  next(error)
    }

    res.status(200).json({place: place.toObject({getters: true})})
}

//getplaceByuserId function
exports.getPlaceByUserId = async (req,res,next)=>{
    const userId = req.params.uid;

    let userWithPlaces;
    try{
         userWithPlaces = await User.findById(userId).populate('places').exec()
    } catch (err) {
        return next(new HttpError('Fetching places failed. please try again',500))
    }
    if(!userWithPlaces || userWithPlaces.places.length === 0) {
        return   next(new HttpError('User have not uploaded any Place.',404))
    }

    res.status(200).json({places: userWithPlaces.places.map(p=>p.toObject({getters: true}))})
}

//create place function
exports.createPlace = async (req,res,next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error= new HttpError('Invalid inputs. please check your data',422)
        return next(error)
    }
const { title,description,address} = req.body
const coordinates = getCoordsForAddress(address)
    const createdPlace =new Place({
        title,
        description,
        image:req.file.path,
        address,
        location:coordinates,
        creator: req.userData.userId
    })

    let user;
    try{
        user=await User.findById(req.userData.userId).exec()
    } catch (err) {
        return next(new HttpError('Ceating user failed. Please try again',500))
    }

    if (!user) {
        return next(new HttpError('We could not find user with provided id.',404))
    }

    console.log(user)
    try {
        await createdPlace.save()
        user.places.push(createdPlace)
        await user.save()
        // const sess = await mongoose.startSession()
        // sess.startTransaction()
        // await createdPlace.save({session: sess})
        // user.places.push(createdPlace)
        // await user.save({session: sess})
        // await sess.commitTransaction()
    } catch (err) {
        console.log(err)
       return  next(new HttpError('Creating place failed. please try again.',500))
    }

    res.status(201).json({place:createdPlace.toObject({getters: true})})
}

//place update function
exports.updatePlaceById = async (req,res,next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        const error= new HttpError('Invalid inputs. please check your data',422)
        return next(error)
    }
    const { title,description} = req.body
    const placeId = req.params.pid;

    let place;
    try{
        place = await Place.findById(placeId).exec()
    } catch (err) {
        return  next(new HttpError('Something went wrong.place not found',500))
    }

    if (place.creator.toString() !== req.userData.userId){
        return  next(new HttpError('You are not allowed to edit this place',403))
    }

    place.title = title
    place.description = description
    try {
        await place.save()
    } catch (err) {
        return  next(new HttpError('Something went wrong. Could not update',500))
    }

    res.status(200).json({place: place.toObject({getters: true})})
}

//place delete function
exports.deletePlace = async (req,res,next)=>{
const placeId= req.params.pid
   let place;
//finding whether the user exist
    try{
       place = await Place.findById(placeId).populate('creator').exec()
    } catch (err) {
        return  next(new HttpError('Something went wrong.Could not delete Place',500))
    }

    if (!place){
        return  next(new HttpError('Could not find place for this id.',404))
    }

 if (place.creator.id !== req.userData.userId){
     return  next(new HttpError('You are not allowed to delete this place',403))
 }

const imagePath = place.image

    try{
        await place.remove()
        place.creator.places.pull(place)
        await place.creator.save()
    } catch (err) {
        return  next(new HttpError('Something went wrong.Could not delete Place',500))
    }
    fs.unlink(imagePath, err=>{
        console.log(err)
    })
    res.status(200).json({message: "place deleted"})
}
