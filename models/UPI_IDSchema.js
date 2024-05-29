const mongoose = require('mongoose')
const User = require('./userModel')

const UPIAddress = mongoose.Schema({
Upi:{
    type:String,
    required:true,
},

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    qrCodeImageAddress: { 
        type: String,
        required: true 
      }
}) 

const UPI = mongoose.model('UPI',UPIAddress)
module.exports = UPI