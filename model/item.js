
const { boolean, array } = require('joi')
const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
    id: {
        type: String
    },
    owner:{
        type: String,
        required:[true, 'Please provide User'],
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name:{
        type: String,
        required: [true, 'Please provide the item name'],
        maxlength: 500,
    },
    cost:{
        type: Number,
        required: [true, 'Please provide the initial cost of the item'],
        default: 0,
    },
    Bid_price:{
        type: Number,
        required: [true, 'Please provide the initial cost of the item'],
        default: 0,
    },
    status:{
        type: String,
        enum: ['Approved', 'Pending', 'Rejected'],
        required: [true, 'Make sure to add the status'],
        default: 'Pending',
    },
    auctionDate: {
        type:  mongoose.Schema.Types.Mixed
    },
    sold: {
        type: Boolean,
        default: false
    },
    breached: {
        type: Boolean,
        default: false
    },
    paid: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        required: [true, 'Please provide the item name'],
        maxlength: 2500,
    },
    agreed_consent: {
        type: Boolean,
        required: [true, 'Please agree to the consent form'],
        default: false
    },
    pic_originalname: {
        type: String,
        required: [true, 'Please provide a picture'],
    },
    pic_path:{
        type: String,
        required: [true, 'Please provide a picture']
    },
    gallery_originalnames: [{type: String}],
    gallery_paths: [{type: String}],
    chargeId: {
        type: String
    },
    holdId: {
        type: String
    },
    chargId_holdId: {
        type: String
    },
    receipturl: {
        type: String
    },
    owner_receipturl:{
        type: String
    },
    verified_Bidders: [
        {
            bider :{type: String},
            bider_email: {type: String},
            biderId :{type: String},
            bider_holdId :{type: String},
            receipturl: {type: String},
        },
    ],
    winner: {
        type: String
    },
    winnerId: {
        type: String
    },
    winnerEmail: {
        type: String
    },
    winnerHoldId: {
        type: String
    },
    winner_chargId_holdId: {
        type: String
    },
    winner_receipturl: {
        type: String
    }



}, {timestamps: true})

module.exports = mongoose.model('Item',ItemSchema)