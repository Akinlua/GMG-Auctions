const Item = require("../model/item")
const User = require('../model/user.js')
const Comment = require('../model/comments')
const path_ = require('path')
const {pagination, changeToInt, deleteFile, getDate, saveImageFromUrl} = require('../middleware/helper')
const {url} = require('./main.js')
const noLayout = '../views/layouts/nothing.ejs'
const jwt = require('jsonwebtoken')
const { LENGTH_REQUIRED } = require("http-status-codes")
const jwtSecret = process.env.JWT_SECRET

const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);

const getAllItemDetails = async (req, res) => {
    const items = await Item.find({})   

    const list = []
    for (const item of items){

        // save image
        const imageUrl = item.pic_path;
        const folderToSave = './public/item-images'; // Specify the folder path where you want to save the image
        const imageNameToSave = item.owner + "-" + item.id + '.png';

        await saveImageFromUrl(imageUrl, folderToSave, imageNameToSave);

        
        const validIds = {}
        for (verified in item.verified_Bidders) {
            validIds[ item.verified_Bidders[verified].biderId] =  item.verified_Bidders[verified].bider_email 
        }

        const res = {
            id: item.id,
            product: item.name,
            description: item.description,
            startPrice: item.cost,
            image: `${url}/item-images/${imageNameToSave}`,
            validIds: validIds
        }

        list.push(res)
    }

    res.status(200).json(list)
}

const getItemDetails = async (req, res) => {

    const {id} = req.params

    const item = await Item.findOne({id: id})

    if(!item){
        return res.status(404).json({
            status: 404,
            message: "Item not found"
        })
    }

    // save image
    const imageUrl = item.pic_path;
    const folderToSave = './public/item-images'; // Specify the folder path where you want to save the image
    const imageNameToSave = item.owner + "-" + item.id + '.png';

    await saveImageFromUrl(imageUrl, folderToSave, imageNameToSave);

    const validIds = {}
    for (verified in item.verified_Bidders) {
        validIds[ item.verified_Bidders[verified].biderId] =  item.verified_Bidders[verified].bider_email 
    }
    // console.log(validIds)
    res.status(200).json({
        id: item.id,
        product: item.name,
        description: item.description,
        startPrice: item.cost,
        image: `${url}/item-images/${imageNameToSave}`,
        validIds: validIds
    })
}

const setWinner = async (req, res) => {

    const {id} = req.params;
    const {password, winnerId, winner_email}  = req.body

    const item = await Item.findOne({id: id})
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
    var winner, winner_hold_id
    item.verified_Bidders.forEach(verified => {
        if(verified.biderId == winnerId && verified.bider_email == winner_email){
            winner = verified.bider
            winner_hold_id = verified.bider_holdId
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
   setWinner,
   getAllItemDetails
}