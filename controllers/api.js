const Item = require("../model/item")
const User = require('../model/user.js')
const Comment = require('../model/comments')
const path_ = require('path')
const {pagination, changeToInt, deleteFile, getDate} = require('../middleware/helper')
const noLayout = '../views/layouts/nothing.ejs'
const jwt = require('jsonwebtoken')
const { LENGTH_REQUIRED } = require("http-status-codes")
const jwtSecret = process.env.JWT_SECRET

const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);


const getItemDetails = async (req, res) => {

    const {id} = req.params

    const item = await Item.findById(id)

    if(!item){
        return res.status(404).json({
            status: 404,
            message: "Item not found"
        })
    }

    res.status(200).json({
        name: item.name,
        itemId: item._id,
        seller: item.owner,
        sellerId: item.ownerId,
        imageURL: item.pic_path,
        verifiedUsers: item.verified_Bidders,
        winner: item.winner ?? null,
        winnerId: item.winnerId  ?? null,
        winner_hold_id: item.winnerHoldId  ?? null
    })
}

const setWinner = async (req, res) => {

    const {id} = req.params;
    const {password, winner, winnerId, winner_email, winner_hold_id}  = req.body

    const item = await Item.findById(id)
    if(!item){
        return res.status(404).json({
            status: 404,
            message: "Item not found"
        })
    }

    if(!password || password != "GMGcheatpost38895"){
        return res.status(401).json({
            status: 401,
            message: "Unauthorized to perform this action"
        })
    }

    // make sure winner is part of the verified user
    var verify = 0
    item.verified_Bidders.forEach(verified => {
        if(verified.biderId == winnerId && verified.bider == winner && verified.bider_holdId == winner_hold_id && verified.bider_email == winner_email){
            return verify = 1
        }
     });
    if(verify < 1){
        return res.status(404).json({
            status: 404,
            message: "The body provided doesn't match with details in our database"
        }) 
    }
    item.winner = winner
    item.winnerId = winnerId
    item.winnerEmail = winner_email
    item.winnerHoldId = winner_hold_id
    await item.save()

    res.status(200).json({
        status: 200,
        message: `Winner (${winner}) succesfully declared for the auction of ${item.name}`,
        winner: winner,
        winner_email: winner_email
    })
}

module.exports = {
   getItemDetails,
   setWinner
}