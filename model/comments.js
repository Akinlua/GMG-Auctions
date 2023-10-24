
const { boolean, array } = require('joi')
const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    owner:{
        type: String,
        required:[true, 'Please provide User'],
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    message:{
        type: String,
        required: [true, 'Please provide the message'],
        maxlength: 1500,
    },
    date: {
        type:  mongoose.Schema.Types.Mixed
    }
}, {timestamps: true})

module.exports = mongoose.model('Comment',CommentSchema)