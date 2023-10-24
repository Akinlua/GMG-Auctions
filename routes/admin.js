const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')

const {
    allItems, soldItems, breachedItems, EachItem, setDate,
    accept, reject, breached, sold, unsold, unbreached, deleteItemByAdmin
} = require('../controllers/admin.js')

router.get('/', allItems)
router.get('/sold-items', soldItems)
router.get('/breached-items', breachedItems)

router.get('/item/:id', EachItem)
router.patch('/set-date/:id', setDate)


router.post('/accept-item/:id', accept)
router.post('/reject-item/:id', reject)
router.post('/sold-item/:id', sold)
router.post('/breached-item/:id', breached)
router.post('/unsold-item/:id', unsold)
router.post('/unbreached-item/:id', unbreached)

//delete item by admin
router.post('/delete-item/:id', deleteItemByAdmin)

module.exports = router
