const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')


const {
    postLogin, postRegister, register, login, logout,
    resetPassword, forgotPassword,
    resetPasswordPage, forgotPasswordPage
} = require('../controllers/user')

router.get('/register', register)
router.post('/register', postRegister)
router.post('/login', postLogin)
router.get('/login', login)
router.get('/logout', logout)

//forgot password
router.get('/forgotpassword', forgotPasswordPage)
router.post('/forgotpassword', forgotPassword)
router.get('/resetpassword', resetPasswordPage)
router.post('/resetpassword', resetPassword)


module.exports = router
