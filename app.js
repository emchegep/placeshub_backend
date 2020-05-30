const path = require('path')
const fs = require('fs')

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

const HttpError = require('./models/http-error')

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()


//middlewares
app.use(bodyParser.json())
//app.use(cors())
app.use('/uploads/images',express.static(path.join('uploads','images')))

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept,Authorization')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,DELETE,OPTIONS')
    next()
})


//routes
app.use('/api/places',placesRoutes)
app.use('/api/users',usersRoutes)

//route not found middleware handler
app.use((req,res,next)=>{
    next(new HttpError('Could not find this route',404))
})

//error handling middleware
app.use((error,req,res,next)=>{
    if (req.file){
        fs.unlink(req.file.path, err => {
            console.log(err)
        })
    }

    if (res.headerSent){
     return   next(error)
    }

    res.status(error.statusCode || 500)
    res.json({message: error.message || 'Un known error occured'})
})

//mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-vqq9u.mongodb.net/${process.env.DB_NAME}
//mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds139844.mlab.com:39844/${process.env.DB_NAME}
//mongodb://localhost:27017/mern_db
mongoose
    .connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds139844.mlab.com:39844/${process.env.DB_NAME}`, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result=>{
        console.log(`database connection successful!`)
        app.listen(process.env.PORT || 5000)
    })
    .catch(err=>{
        console.log('Connection failed!')
    })

