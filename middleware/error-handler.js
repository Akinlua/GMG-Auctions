const noLayout = '../views/layouts/nothing.ejs'
const { StatusCodes } = require('http-status-codes')
const multer = require('multer')
const {allPages} = require('../controllers/main')
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const errorHandlerMiddleware = async (err, req, res, next) => {
    const {is_user, is_admin} = await allPages(req, res)
    
    console.log(err)
    if (err.message === 'Only Images Allowed')  {
      console.log('yes')
      let error = "Invalid file type. Only Images are allowed"
      return res.render('admin/error-500', {layout: noLayout, name: "Error Uploading file", message: error, statusCode: 400})
    } 

    if (err instanceof multer.MulterError) {
      let error = ''
      if(err.message == "Unexpected field") {
        error = "Only 9 images are allowed for the gallery"
        return res.render('admin/error-500', {layout: noLayout, name: "Error Uploading file", message: error, statusCode: 400})
      } else {
        return res.render('admin/error-500', {layout: noLayout, name: "Error Uploading file", message: err.message, statusCode: 400})
      }
    }

    let customError = {
      //set default 
      statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      msg: 'An error Occured'
  
    }

    if(err.name === 'ValidationError'){
      customError.msg = Object.values(err.errors).map((item) => item.message).join(',')
      customError.statusCode = 400
    }
  
    if(err.code && err.code === 11000){
      customError.msg = `Duplicate Value entered for ${Object.keys(err.keyValue)} field, please choose another value`
      customError.statusCode = StatusCodes.BAD_REQUEST
    }
  
    if(err.name == 'CastError'){
      customError.msg = `No item found with id : ${err.value}`
      customError.statusCode = 404
    }

    // return res.send(err)
    return res.render("admin/error-500", {layout: noLayout, name: err.name,statusCode: customError.statusCode, message: customError.msg})
    // return res.status(500).json({ msg: 'Something went wrong, please try again' })
  }

  module.exports = errorHandlerMiddleware
  

            
//   if(error.code === 11000) {
//     res.status(409).json({message: 'User already in use'})
// }


