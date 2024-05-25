const mongoose = require('mongoose')
 
 const TransactionHistory = mongoose.Schema({
    amount:{type:Number, required:true},
    type:{type:String, required:true},
    date: {
        type: Date, 
        default: Date.now
      }
 })
  const transactions = mongoose.model('transactions',TransactionHistory)
  module.exports = transactions