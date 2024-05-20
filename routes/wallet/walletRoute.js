const express = require('express');
const router = express.Router();
const User = require('../../models/userModel');
const auth = require('../../middlewares/auth');
const DepositHistory = require('../../models/depositHistoryModel');


router.post('/wallet', auth, async(req, res) => {
    try {
        const {amount} = req.body;
        if (!amount) {
            return res.status(400).json({msg: "Amount is required"});
        }
        req.user.walletAmount += amount;
        let isFirstDeposit = false;
        if (!req.user.firstDepositMade) {
            req.user.firstDepositMade = true;
            isFirstDeposit = true;
        }
        await req.user.save();
        const depositHistory = new DepositHistory({
            userId: req.user._id,
            depositAmount: amount,
            depositDate: new Date(),
            depositStatus: 'completed',
            depositId: 'some-unique-id', 
            depositMethod: 'some-method' 
        });
        await depositHistory.save();
        
        if (!req.user.referrer) {
            return res.status(200).json({msg: "Wallet updated"});
        }

        let currentReferrer = await User.findById(req.user.referrer);
        let commissionRates = [0.5, 0.4, 0.3, 0.2, 0.1]; 
        for (let i = 0; i < 5; i++) {
            if (!currentReferrer) {
                break;
            }
            if (i === 0) {
                currentReferrer.directSubordinates[0].depositNumber++;
                currentReferrer.directSubordinates[0].depositAmount += amount;
                if (isFirstDeposit) { 
                    currentReferrer.directSubordinates[0].firstDeposit++;
                }
            } else {
                currentReferrer.teamSubordinates[0].depositNumber++;
                currentReferrer.teamSubordinates[0].depositAmount += amount;
                if (isFirstDeposit) { 
                    currentReferrer.teamSubordinates[0].firstDeposit++;
                }
            }

            let commission = amount * commissionRates[i];
            if (isFirstDeposit) {
                currentReferrer.walletAmount += commission; 
            }

            let today = new Date().setHours(0, 0, 0, 0);
            let existingRecord = currentReferrer.commissionRecords.find(record => record.date.setHours(0, 0, 0, 0) === today && record.uid === req.user.uid);

            if (existingRecord) {
                existingRecord.depositAmount += amount;
            } else {
                currentReferrer.commissionRecords.push({
                    level: i + 1,
                    commission: commission,
                    date: new Date(),
                    uid: req.user.uid,
                    depositAmount: amount
                });
            }
            await currentReferrer.save();

            currentReferrer = await User.findById(currentReferrer.referrer);
        }



        res.status(200).json({msg: "Wallet updated"});
    } catch(err) {
        console.log(err);
        res.status(500).json({msg: "Server Error"});
    }
    
});


router.get('/deposit/history', auth, async(req, res) => {
    try {
        const depositHistory = await DepositHistory.find({ userId: req.user._id });
        res.status(200).json(depositHistory);
    } catch(err) {
        console.log(err);
        res.status(500).json({msg: "Server Error"});
    }
});

module.exports = router;

