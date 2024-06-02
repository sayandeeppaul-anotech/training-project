const express = require("express");
const router = express.Router();
// const CronJobTrx = require('../controllers/cronjobTRXController')
const Bet = require("../models/betsModel");
const auth = require("../middlewares/auth");
const User = require("../models/userModel");

router.post("/betontrx", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.walletAmount -= req.body.totalBet;
      await user.save();
    }

    const totalBetAfterTax = req.body.totalBet * 0.98; // 2% tax

    const bet = new Bet({
      userId: req.user._id,
      selectedItem: req.body.selectedItem,
      betAmount: req.body.betAmount,
      multiplier: req.body.multiplier,
      totalBet: totalBetAfterTax, // Use the totalBet amount after the transaction fee
      tax: req.body.totalBet - totalBetAfterTax, // Calculate the transaction fee
      selectedTimer: req.body.selectedTimer,
      periodId: req.body.periodId,
      timestamp: Date.now(),
      result: req.body.result,
      status: req.body.status,
      winLoss: req.body.winLoss,
    });
    await bet.save();

    let commissionRates = [0.05, 0.04, 0.03, 0.02, 0.01]; // 5%, 4%, 3%, 2%, 1%

    // Start with the user who placed the bet
    let currentUserId = req.user._id;

    // For each level in the upline
    for (let i = 0; i < 5; i++) {
      // Find the current user
      let currentUser = await User.findById(currentUserId);

      // If the user doesn't exist or doesn't have a referrer, break the loop
      if (!currentUser || !currentUser.referrer) {
        break;
      }

      // Find the referrer
      let referrer = await User.findById(currentUser.referrer);

      // If the referrer doesn't exist, break the loop
      if (!referrer) {
        break;
      }

      // Calculate the commission for the referrer
      let commission = req.body.totalBet * commissionRates[i];

      // Add the commission to the referrer's wallet
      referrer.walletAmount += commission;

      // Get today's date
      let today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the commission record for today
      let commissionRecord = referrer.commissionRecords.find((record) => {
        let recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      if (commissionRecord) {
        // If a record for today exists, update the commission
        commissionRecord.commission += commission;
        commissionRecord.betAmount += req.body.totalBet; // Update the betAmount
      } else {
        // If no record for today exists, create a new one
        referrer.commissionRecords.push({
          date: today,
          level: i + 1,
          uid: req.user.uid,
          commission: commission,
          betAmount: req.body.totalBet,
        });
      }

      await referrer.save();

      // Move to the next user in the upline
      currentUserId = referrer._id;
    }

    res.status(201).json(bet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving bet", error: error.message });
  }
});
module.exports = router