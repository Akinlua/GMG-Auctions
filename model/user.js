const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  id: {
    type: String,
  },
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true
  },
  email:{
    type: String,
    required: [true, 'Please provide email'],
    match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please Provide valid email'
    ],
    unique: true,
},
  password: {
    type: String,
    required: [true, 'Please provide Password'],
  },
  resetToken: {
    type: String,
  },
  phone_number:{
    type: String,
    required: [true, 'Please provide phone number'],
    match: [
        /^\+?\d{1,4}\d{10}$/,
        'Please Provide valid Phone Number (Phone number must be in form +4491222... or 091222...)'
    ],
  },
  adress:{
    type: String,
    required: [true, 'Please provide an adress'],
  },
  pic_originalname: {
      type: String,
      required: [true, 'Please provide a picture'],
  },
  pic_path:{
      type: String,
      required: [true, 'Please provide a picture']
  },
  admin: {
    type: Boolean,
    default: false
  }

});

module.exports = mongoose.model('User', UserSchema);