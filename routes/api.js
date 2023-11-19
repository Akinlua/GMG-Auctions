
const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin, notAdmin} = require('../middleware/authentication.js')
const User = require('../model/user.js')



const {
    getItemDetails, setWinner, getAllItemDetails
} = require('../controllers/api.js')

router.get('/items', getAllItemDetails)
router.get('/item/:id', getItemDetails)
router.post('/set-winner/:id', setWinner)

module.exports = router
