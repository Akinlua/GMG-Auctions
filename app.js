
require('dotenv').config()
require('express-async-errors');
const express = require('express')
const expressLayout = require('express-ejs-layouts')
const cors = require('cors')

const bodyParser = require('body-parser')
const connectDB = require('./db/connect')
const mainRouter = require('./routes/main')
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')
const apiRouter = require('./routes/api.js')
const methodOverride = require('method-override')
const {authMiddleware, authAdmin} = require('./middleware/authentication.js')

const cookieParser = require('cookie-parser')


// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const cron = require('node-cron');

const {resetToken} = require('./middleware/helper')
cron.schedule('0 0 * * * ', resetToken);


const app = express()
app.use(bodyParser.json())
app.use(cors())

app.use(expressLayout)
app.set('layout', './layouts/main')
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))



app.use(express.static('public'))
app.use('', userRouter)
app.use('', mainRouter)
app.use('/admin', authMiddleware, authAdmin, adminRouter)
app.use('/api', apiRouter)


// //error handler
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);







const port = process.env.PORT || 3000


const start = async () => {
    try{
        //connect DB
        await connectDB()
        console.log("Connected to DB")
        app.listen(port, "0.0.0.0", console.log(`Server is listening to port ${port}`))
    } catch (error) {
        console.log(error)
    }
}

start();

