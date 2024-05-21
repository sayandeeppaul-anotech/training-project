const mongoose = require('mongoose')

const commissionPercentage = new mongoose.Schema({
    level1:{type:Number,default:0},
    level2:{type:Number,default:0},
    level3:{type:Number,default:0},
    level4:{type:Number,default:0},
    level5:{type:Number,default:0},
})
const CommissionApproval = mongoose.model("CommissionApproval", commissionPercentage);

module.exports = CommissionApproval;



