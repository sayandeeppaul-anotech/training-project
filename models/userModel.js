const mongoose = require('mongoose');

const subordinateSchema = new mongoose.Schema({
  noOfRegister: { type: Number, default: 0 },
  depositNumber: { type: Number, default: 0 },
  depositAmount: { type: Number, default: 0 },
  firstDeposit: { type: Number, default: 0 },
}, { _id: false }); 

<<<<<<< HEAD


=======
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806
const userSchema = new mongoose.Schema({
  mobile: { type: Number, required: true },
  password: { type: String, required: true },
  invitecode: { type: String, default: null},
  invitationCode: { type: String, required: true},
  username: { type: String, required: true },
  uid: { type: String, required: true },
  referralLink: { type: String, default: null },
  walletAmount: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  token : {type: String, default: null},
  directSubordinates: { 
    type: [subordinateSchema], 
    default: [{
      noOfRegister: 0,
      depositNumber: 0,
      depositAmount: 0,
      firstDeposit: 0
    }] 
  },
  teamSubordinates: { 
    type: [subordinateSchema], 
    default: [{
      noOfRegister: 0,
      depositNumber: 0,
      depositAmount: 0,
      firstDeposit: 0
    }] 
  },
<<<<<<< HEAD
  lastLoginTime: { type: Date, default:null},
=======
  lastLoginTime: { type: Date, default: null },
  
  // Added registration date field
  registrationDate: { type: Date, default: Date.now }, 
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806
  token : {type: String, default: null},
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstDepositMade: {
    type: Boolean,
    default: false
<<<<<<< HEAD
},
commissionRecords: [{
=======
  },
  commissionRecords: [{
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806
    level: Number,
    commission: Number,
    date: Date,
    uid: String,
<<<<<<< HEAD
    betAmount:{type:  Number, default: 0},
    depositAmount: Number
}]
  
=======
    betAmount:{ type:  Number, default: 0 },
    depositAmount: Number
  }]
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806
});

const User = mongoose.model('User', userSchema);

module.exports = User;
<<<<<<< HEAD






=======
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806
