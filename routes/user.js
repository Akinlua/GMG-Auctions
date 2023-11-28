const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')
const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },  
  fileFilter: (req, file, cb) => {
    const list_of_accepted_type = ['image/jpeg',  'image/png',  'image/gif',  'image/bmp',  'image/tiff',  'image/webp',  'image/svg+xml']
    if(list_of_accepted_type.includes(file.mimetype)){
      cb(null, true)
    } else {
      cb(new Error('Only Images Allowed'), false)
      // cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE_TYPE"), false)
    }
  }
  }).fields([
    {name: 'file', maxCount: 1},
  ])
  


const {
    postLogin, postRegister, register, login, logout,
    resetPassword, forgotPassword,
    resetPasswordPage, forgotPasswordPage, editUserInfo, editUser
} = require('../controllers/user')

router.get('/register', register)
router.post('/register',upload, postRegister)
router.get('/edit-user', authMiddleware, editUser)
router.patch('/edit-user', authMiddleware, upload, editUserInfo)
router.post('/login', postLogin)
router.get('/login', login)
router.get('/logout', logout)

//forgot password
router.get('/forgotpassword', forgotPasswordPage)
router.post('/forgotpassword', forgotPassword)
router.get('/resetpassword', resetPasswordPage)
router.post('/resetpassword', resetPassword)


module.exports = router
