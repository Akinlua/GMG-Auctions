const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../model/user')
const jwtSecret = process.env.JWT_SECRET
const noLayout = '../views/layouts/nothing.ejs'
const {allPages, url} = require('./main')
const {generateToken, sendNotification} = require('../middleware/helper')


const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);

const register = async (req, res) => {
    const token = req.cookies.token;

    let error_ = ''
    res.render('register', {layout: noLayout, error: error_})
}

const login = async (req, res) => {

    let error_ = ''
    res.render('login', {layout: noLayout, error: error_})
}

const logout = async (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
}

const postRegister = async (req,res) => {

    try {
        const {username, password, email} = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({username, password: hashedPassword, email})
        const token =  await jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
        res.cookie('token', token, {httpOnly: true})

        if(user.admin){
            return res.redirect('/admin')
        } else {    
            return res.redirect('/user-items')
        }
    }  catch (error) {

        let error_ = "Username or Email already Exists"
        return res.render('register', {layout: noLayout, error: error_})
    } 
}


const postLogin = async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const user = await User.findOne({username})

    let error = ""
    if(!user) {
        error = "Invalid credentials"
        return res.render('login', {layout: noLayout, error})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid) {
        error = "Invalid credentials"
        return res.render('login', {layout: noLayout, error})
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
    res.cookie('token', token, {httpOnly: true})

    if(user.admin){
        return res.redirect('/admin')
    } else {    
        return res.redirect('/user-items')
    }
}

const resetPasswordPage = async (req, res) => {
    const {token} = req.query
    const {is_user, is_admin} = await allPages(req, res)

    let error = ""
    if (req.query.error){
        error = req.query.error
    }
    res.render('main/reset_password',{
        title: "Reset Password",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey,
        token, error
    })
}

const forgotPasswordPage = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    let success = ""
    if (req.query.success){
        success = req.query.success
    }

    let error = ""
    if (req.query.error){
        error = req.query.error
    }

    let email = ""
    if (req.query.email){
        email = req.query.email
    }
    res.render('main/forgot_password',{
        title: "Forgot Password",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey,
        success, error, email
    })
}

// post 
const forgotPassword = async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user) {
        return res.redirect(`/forgotpassword?error=No user found with the email ${email}`)
    }

    //generate a unique reset token
    const resetToken = await generateToken(24)

    // could create a expiration time

    user.resetToken = resetToken
    await user.save()

    try{
        //send the reset email
        const resetUrl =`${url}/resetpassword?token=${resetToken}`
        const text= `Here's a link to reset your password- <a href="${resetUrl}"> ${resetUrl} </a>`
        const title = `Reset Password`
        const {transport} = await sendNotification(email, user.username, text, title)

    } catch (error) {
        console.log(error)
        return res.redirect(`/forgotpassword?error=There was an error in sending the mail, contact admin or check your internet connection`)
    }
    


    res.redirect('/forgotpassword?success=Reset link has been sent to your email')

}

// post
const resetPassword = async (req, res) => {

    const { newPassword} = req.body
    const {token} = req.query

    if( !token) {
        return res.redirect(`/resetpassword?error=No token found`)
    }
    
    const user = await User.findOne({resetToken: token})
    if (!user) {
        return res.redirect(`/resetpassword?token=${token}&error=No user found with the token ${token} Or Token has expired`)
    }

    //validate the expiration time here

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    user.resetToken = undefined
    await user.save()
    
    res.redirect('/login')

}

module.exports = {
    postRegister,
    postLogin,
    register,
    login,
    logout,
    resetPassword, forgotPassword,
    resetPasswordPage, forgotPasswordPage
}