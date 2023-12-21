const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin, notAdmin} = require('../middleware/authentication.js')
const User = require('../model/user.js')
const multer = require('multer');
const fs = require('fs')

// Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: async function (req, file, cb) {  
//       const user = await User.findById(req.userId)
//       const uploadDirectory =  `./public/upload/${user.username}` 
//       if(!fs.existsSync(uploadDirectory)){
//           fs.mkdirSync(uploadDirectory, {recursive: true})
//       }
//       cb(null, uploadDirectory); // Destination folder for uploaded files
//     },
//     filename: async function (req, file, cb) { 
//       const user = await User.findById(req.userId)
//       cb(null,  user.username+  Date.now()  + '-' + file.originalname); // File naming convention
//     },
//   });

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
    {name: 'imagesArray', maxCount: 9},
  ])
  

const {
    createItem, readItems, readItems_User, EachItem, home,
    itemForm, search, EachItemGallery, charge, payPage, editItem,
    editItemPatch, about, postComment, new_createItem, new_editItemPatch, bidPage,
    bid, faq
} = require('../controllers/main.js')

router.get('/', home)
router.get('/post-item', authMiddleware, notAdmin, itemForm)

router.post('/createItem', authMiddleware, notAdmin, upload, new_createItem)//same

router.get('/items', readItems)
router.get('/user-items', authMiddleware, notAdmin, readItems_User)
router.get('/item/:id', EachItem)

router.post('/search', search)
router.get('/item-gallery/:id', EachItemGallery)

//payment 
// router.post('/create-checkout-session/:id',authMiddleware,notAdmin,  charge)
router.post('/charge/:id',authMiddleware,notAdmin,  charge)
router.post('/bid/:id',authMiddleware,notAdmin,  bid)

router.get('/pay/:id',authMiddleware, notAdmin, payPage)
router.get('/bid/:id',authMiddleware, notAdmin, bidPage)


router.get('/editItem/:id', authMiddleware,notAdmin, editItem)
router.patch('/editItem/:id', authMiddleware,notAdmin,upload, new_editItemPatch)//same

router.get('/about', about)
router.get('/faq', faq)

// comment
router.post('/post-comment/:id',authMiddleware, postComment)

module.exports = router

