const express = require('express')
const CommissionPercentage = require('../../models/commissionPercentage')
const router = express.Router()
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')

router.post('/levelAmount',auth,isAdmin,async(req,res)=>{
    try {

        let {level1, level2, level3,level4,level5} = req.body
       console.log("------------>")
       const TotalPercentage = new CommissionPercentage({
        level1,
        level2,
        level3,
        level4,
        level5
    });
        await TotalPercentage.save()
        console.log("------------>")
        res.status(200).json({
            success:"true",
            message:"Successfully Set the level Amount",
            totalpercentage:TotalPercentage
        })
    } catch (error) {
        res.status(500).json({
            success:"false",
            message:"Failed to set the level Amount",
            error:error.message
        })
    }
})

module.exports = router