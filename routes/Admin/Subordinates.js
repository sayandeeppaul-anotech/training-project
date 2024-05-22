const UserModel = require('../../models/userModel')
const express = require('express')
const router = express.Router()
const auth = require("../../middlewares/auth")

router.get('/Subordinates', auth, async (req, res) => {
    try {
        const users = await UserModel.find(); 
        
        
        let totalCommissions = {1: 0, 2: 0, 3: 0, 4: 0};

      
        users.forEach(user => {
            user.commissionRecords.forEach(record => {
               
                if(record.level >= 1 && record.level <= 4) {
                  
                    totalCommissions[record.level] += record.commission;
                }
            });
        });

       
        let responseArray = [];
        for(let level = 1; level <= 4; level++) {
            if(totalCommissions[level] > 0) {
                responseArray.push({
                    success: "true",
                    message: `TotalAmount showing for level ${level}`,
                    level: level,
                    amount: totalCommissions[level]
                });
            } else {
                responseArray.push({
                    success: "false",
                    message: `No Subordinates found with level ${level}`
                });
            }
        }

        
        res.status(200).json(responseArray);
        
    } catch (error) {
        res.status(500).json({
            success: "false",
            message: "Internal Server Error",
            error: error.message 
        })
    }
});

module.exports = router;
