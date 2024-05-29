const mongoose = require('mongoose')
const User = require('./userModel')
const trxAddressSchema = new mongoose.Schema({
  TRXAddress:{
    type:String,
    required:true
  },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
  },
  qrCodeImageAddress: { 
    type: String,
    required: true 
  }

})
const TRXAddress = mongoose.model('TRXAddress',trxAddressSchema)

module.exports = TRXAddress