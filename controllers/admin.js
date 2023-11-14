const Item = require("../model/item")
const User = require('../model/user.js')
const adminLayout = '../views/layouts/admin.ejs'
const {changeToInt, formatDate, deleteFile} = require('../middleware/helper')
const noLayout = '../views/layouts/nothing.ejs'
const Comment = require('../model/comments')

const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);

const allPages = async (req, res) => {
    const user = await User.findById(req.userId)

    return {user}
}
 
const allItems = async (req, res) => {
    const {user} = await allPages(req, res)

    let AllItems
    let search = ''
    if(req.query.search){
        search = req.query.search
        let searchValue = await changeToInt(search)
        AllItems =  await Item.find({ agreed_consent: true, sold: false, breached: false,
            $or: [
                {owner: {$regex: search, $options: 'i'}},
                {name: {$regex: search, $options: 'i'}},
                {cost: searchValue},
                {Bid_price: searchValue},
            ]
        }).sort('-createdAt')
    } else {
        AllItems = await Item.find({ agreed_consent: true, sold: false, breached: false}).sort('-createdAt') //paid: true
    }  

    let message = ''
    if(req.query.message) message = req.query.message

    res.render('admin/home', {layout: adminLayout, AllItems, user, search, site: 'admin', message})
}

const soldItems = async (req, res) => {
    const {user} = await allPages(req, res)

    let AllItems
    let search = ''
    if(req.query.search){
        search = req.query.search
        let searchValue = await changeToInt(search)
        AllItems =  await Item.find({agreed_consent: true, sold: true,
            $or: [
                {owner: {$regex: search, $options: 'i'}},
                {name: {$regex: search, $options: 'i'}},
                {cost: searchValue},
                {Bid_price: searchValue},
            ]
        }).sort('-createdAt')
    } else {
        AllItems = await Item.find({ agreed_consent: true, sold: true }).sort('-createdAt')
    }

    let message = ''
    if(req.query.message) message = req.query.message

    res.render('admin/sold', {layout: adminLayout, AllItems, user, search, site: 'admin/sold-items', message})
}

const breachedItems = async (req, res) => {
    const {user} = await allPages(req, res)

    let AllItems
    let search = ''
    if(req.query.search){
        search = req.query.search
        let searchValue = await changeToInt(search)
        AllItems =  await Item.find({agreed_consent: true, breached: true,
            $or: [
                {owner: {$regex: search, $options: 'i'}},
                {name: {$regex: search, $options: 'i'}},
                {cost: searchValue},
                {Bid_price: searchValue},
            ]
        }).sort('-createdAt')
    } else {
        AllItems = await Item.find({ agreed_consent: true, breached: true}).sort('-createdAt')
    }

    let message = ''
    if(req.query.message) message = req.query.message

    res.render('admin/breached', {layout: adminLayout, AllItems, user, search, site: 'admin/breached-items', message})
}

const EachItem = async (req, res) => {

    const {user} = await allPages(req, res)

    const item = await Item.findOne({_id: req.params.id})
    if(!item) {
        return res.render('admin/error-404', {layout: noLayout})
    }

    let search = ''
    let message = ''
    if(req.query.message) message = req.query.message
    res.render('admin/single-item',  {layout: adminLayout, user, search, site: 'admin', item, message})
}

const setDate = async (req, res) => {

    const {date} = req.body
    if(!date){
        return res.render('admin/error-500',{layout: noLayout, name: "Not Found", message: "No date Found", statusCode: 404})
    }
    const formattedDate = await formatDate(date)    

    const item = await Item.findOneAndUpdate({_id: req.params.id}, {auctionDate: formattedDate}, {new: true, runValidators: true})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }

    res.redirect(`/admin/item/${req.params.id}?message=${item.name} auction date has been set`)
}

const accept = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }

    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {status: 'Approved'}, {new: true, runValidators: true})

    res.redirect(`/admin/item/${req.params.id}?message=${item.name} accepted successfully`)

}

const reject = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }

    if(item.paid == true){
        //run the code that handles refund to the item owner card
        // Retrieve the charge ID from the request
        const chargeId = item.chargeId

        try{
            // Use the Stripe API to refund the charge
            const refund = await stripe.refunds.create({
                charge: chargeId,
            });
        } catch (error){
            console.log(error)
            return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "An error occurred with refund", statusCode: 400})
        }
    }

    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {status: 'Rejected', paid: false, chargeId: ''}, {new: true, runValidators: true})


    res.redirect(`/admin/item/${req.params.id}?message=${item.name} rejected successfully`)
}

const sold = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }
    if(item.sold == true){
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "Item already flagged as sold", statusCode: 400})
    }

    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {sold: true}, {new: true, runValidators: true})

    res.redirect(`/admin/sold-items?message=${item.name} successfully sold`)
}

const unsold = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }
    if(item.sold == false){
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "Item already flagged as not sold", statusCode: 400})
    }

    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {sold: false}, {new: true, runValidators: true})

    res.redirect(`/admin/sold-items?message=UNDO successfully for ${item.name}`)
}

const breached = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }
    if(item.breached == true){
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "Item already flagged as breached", statusCode: 400})
    }

    try{
        // run the code to remove the money on which an hold was made for both owner and winner
        const hold_id = item.holdId
        if(hold_id){
            const capturedCharge = await stripe.charges.capture(hold_id);
            if(capturedCharge){
                item.chargId_holdId = capturedCharge.id
                await item.save()
            }
        }

        // remove for winner
        const winner_hold_id = item.winnerHoldId
        if(winner_hold_id){
            const capturedCharge = await stripe.charges.capture(winner_hold_id);
            if(capturedCharge){
                item.winner_chargId_holdId = capturedCharge.id
                await item.save()
            }
        }

    } catch (error){
        console.log(error)
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "An error occurred with processing the payment on the hold", statusCode: 400})
    }
        
    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {breached: true, holdId: '', winnerHoldId: ''}, {new: true, runValidators: true})

    res.redirect(`/admin/breached-items?message=${item.name} successfully flagged as breached: The money has been removed from both the owner of the item and winner of the auction`)
}

const unbreached = async (req, res) => {

    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }
    if(item.breached == false){
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "Item already flagged as not breached", statusCode: 400})
    }

    // run the code to refund the money on which an hold was made that was removed

    const chargeId = item.chargId_holdId
    const chargeId2 = item.winner_chargId_holdId
    try{
        // Use the Stripe API to refund the charge 
        if(chargeId){
            const refund = await stripe.refunds.create({
                charge: chargeId,
            });
        }

        // refund for winner
        if(chargeId2){
            const refund = await stripe.refunds.create({
                charge: chargeId2,
            });
        }
    } catch (error){
        console.log(error)
        return res.render('admin/error-500', {layout: noLayout, name: "Bad Request", message: "An error occurred with refund", statusCode: 400})
    }

    const item_ = await Item.findOneAndUpdate({_id: req.params.id}, {breached: false, chargId_holdId: '', winner_chargId_holdId: ''}, {new: true, runValidators: true})

    res.redirect(`/admin/breached-items?message=UNDO successfully for ${item.name}: Money has been refunded to both owner of the item and winner of the auction`)
}

const deleteItemByAdmin = async (req, res) => {

    const item = await Item.findById(req.params.id)
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }

    await Item.deleteOne({_id: req.params.id})
    //delete all comments associated with it
    await Comment.deleteMany({itemId: item._id})

    res.redirect(`/admin?message=Item ${item.name} Deleted successfully`)
}
module.exports = {
    allItems, breachedItems, soldItems,
    EachItem,setDate,
    accept, reject,
    breached, sold,unsold, unbreached,
    deleteItemByAdmin
}