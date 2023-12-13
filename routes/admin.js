const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')

const {
    allItems, soldItems, breachedItems, EachItem, setDate,
    accept, reject, breached, sold, unsold, unbreached, deleteItemByAdmin, users, userDetails, setSart_Bid, blockUser, unblockUser
} = require('../controllers/admin.js')

router.get('/', allItems)
router.get('/sold-items', soldItems)
router.get('/breached-items', breachedItems)

router.get('/item/:id', EachItem)
router.patch('/set-date/:id', setDate)
router.patch('/set-bid/:id', setSart_Bid)


router.post('/accept-item/:id', accept)
router.post('/reject-item/:id', reject)
router.post('/sold-item/:id', sold)
router.post('/breached-item/:id', breached)
router.post('/unsold-item/:id', unsold)
router.post('/unbreached-item/:id', unbreached)
router.patch('/block-user/:id', blockUser)
router.patch('/unblock-user/:id', unblockUser)



//delete item by admin
router.post('/delete-item/:id', deleteItemByAdmin)

router.get('/all-users', users)
router.get('/user-detail/:id', userDetails)

module.exports = router
