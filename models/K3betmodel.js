const mongoose = require('mongoose')
const User = require('./userModel')

const K3betSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    betAmount: Number,
    selectedItem: String,
    multiplier: Number,
    totalBet: Number,
    tax: Number,
    fee: { type: String, default: '2%'},
    periodId: String,
    timestamp: { type: Date, default: Date.now },
    diceOutcomeD1: Number,
    diceOutcomeD2: Number,
    diceOutcomeD3: Number,
    status: { type: String, default: 'Loading' },
    winLoss: String,
    totalSum: Number,
    size: String,
    parity: String,
    twoSameOneDifferent: Boolean,
    threeSame: Boolean, 
    threeDifferentNumbers: Boolean,
    
})

const K3bets = mongoose.model('K3bets', K3betSchema)

module.exports = K3bets;
