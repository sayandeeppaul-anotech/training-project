const express = require("express");
const Bet = require("../../models/betsModel");
const router = express.Router();
const auth = require("../../middlewares/auth");
const User = require("../../models/userModel");

router.post("/wingobet", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.walletAmount -= req.body.totalBet;
      await user.save();
    }

    // Apply the 2% transaction fee
    const totalBetAfterTx = req.body.totalBet * 0.98;

    const bet = new Bet({
      userId: req.user._id,
      selectedItem: req.body.selectedItem,
      // Include the sizeOutcome in the bet data
      sizeOutcome: req.body.sizeOutcome,
      betAmount: req.body.betAmount,
      multiplier: req.body.multiplier,
      totalBet: totalBetAfterTx,
      tax: req.body.totalBet - totalBetAfterTx, // Calculate the transaction fee
      selectedTimer: req.body.selectedTimer,
      periodId: req.body.periodId,
      timestamp: Date.now(),
      result: req.body.result,
      status: req.body.status,
      winLoss: req.body.winLoss,
    });

    await bet.save();

    // Commission rates
    let commissionRates = [0.05, 0.04, 0.03, 0.02, 0.01]; // 5%, 4%, 3%, 2%, 1%

    // Start with the user who placed the bet
    let currentUserId = req.user._id;

    for (let i = 0; i < 5; i++) {
      let currentUser = await User.findById(currentUserId);
      if (!currentUser || !currentUser.referrer) {
        break;
      }
      let referrer = await User.findById(currentUser.referrer);
      if (!referrer) {
        break;
      }
      let commission = req.body.totalBet * commissionRates[i];
      referrer.walletAmount += commission;

      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let commissionRecord = referrer.commissionRecords.find((record) => {
        let recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      if (commissionRecord) {
        commissionRecord.commission += commission;
        commissionRecord.betAmount += req.body.totalBet;
      } else {
        referrer.commissionRecords.push({
          date: today,
          level: i + 1,
          uid: req.user.uid,
          commission: commission,
          betAmount: req.body.totalBet,
        });
      }

      await referrer.save();

      currentUserId = referrer._id;
    }

    res.status(201).json(bet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving bet", error: error.message });
  }
});

router.get("/user/betshistory", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const bets = await Bet.find({ userId: userId }).sort({ timestamp: -1 });
    res.status(200).json(bets);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving bet history", error: error.message });
  }
});

module.exports = router;
