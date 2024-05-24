const express = require("express");
const router = express.Router();
const User = require("../../models/userModel");
const {
  isAdmin,
  isNormal,
  isRestricted,
} = require("../../middlewares/roleSpecificMiddleware");
const auth = require("../../middlewares/auth");
const DepositHistory = require("../../models/depositHistoryModel");
const commissionPercentage = require('../../models/commissionPercentage')

router.post("/wallet", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
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
      depositStatus: "completed",
      depositId: "some-unique-id",
      depositMethod: "some-method",
    });
    await depositHistory.save();

    if (!req.user.referrer) {
      return res.status(200).json({ msg: "Wallet updated" });
    }

    let currentReferrer = await User.findById(req.user.referrer);
      const TotalPercentage = new commissionPercentage[leve1,level2,level3,level4,level5]
      console.log(commissionPercentage)
       TotalPercentage = new CommissionRecharge({
        level1: level1,
        level2: level2,
        level3: level3,
        level4: level4,
        level5: level5
    });
    
      

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
      let existingRecord = currentReferrer.commissionRecords.find(
        (record) =>
          record.date.setHours(0, 0, 0, 0) === today &&
          record.uid === req.user.uid
      );

      if (existingRecord) {
        existingRecord.depositAmount += amount;
      } else {
        currentReferrer.commissionRecords.push({
          level: i + 1,
          commission: commission,
          date: new Date(),
          uid: req.user.uid,
          depositAmount: amount,
        });
      }
      await currentReferrer.save();

      currentReferrer = await User.findById(currentReferrer.referrer);
    }

    res.status(200).json({ msg: "Wallet updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/deposit/history", auth,  async (req, res) => {
  try {
    const depositHistory = await DepositHistory.find({ userId: req.user._id });
    res.status(200).json(depositHistory);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/pending-recharge", auth, isAdmin, async (req, res) => {
  try {
    const allDeposit = await DepositHistory.find();
    if (!allDeposit) {
      console.log("No user found in the DB");
    }
    let pendingRechargeArray = [];
    pendingRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus !== "completed"
    );
    console.log(pendingRechargeArray);
    if (pendingRechargeArray.length === 0) {
      res.status(200).json({
        pendingAmount: 0,
        success: true,
        message: "No transaction is in pending state",
      });
    }
    let totalPendingAmount = 0;
    for (let i = 0; i < pendingRechargeArray.length; i++) {
      totalPendingAmount =
        totalPendingAmount + pendingRechargeArray[i].depositAmount;
    }
    res.status(200).json({
      pendingAmount: totalPendingAmount,
      success: true,
      message: "data fetched succesfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});
router.get("/success-recharge", auth, isAdmin, async (req, res) => {
  try {
    const allDeposit = await DepositHistory.find();
    if (!allDeposit) {
      console.log("No user found in the DB");
    }
    let successRechargeArray = [];
    successRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus === "completed"
    );
    console.log(successRechargeArray);
    if (successRechargeArray.length === 0) {
      res.status(200).json({
        successRechargeAmount: 0,
        success: true,
        message: "No success recharge done yet",
      });
    }
    let totalSuccessAmount = 0;
    for (let i = 0; i < successRechargeArray.length; i++) {
      totalSuccessAmount =
        totalSuccessAmount + successRechargeArray[i].depositAmount;
    }
    res.status(200).json({
      successAmount: totalSuccessAmount,
      success: true,
      message: "data fetched succesfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


  router.post('/attendance', auth, async (req, res) => {
    try {
      const totalDeposit = await DepositHistory.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: "$depositAmount" } } }
      ]);
  
      if (!totalDeposit[0] || totalDeposit[0].total < 10000) {
        return res.status(400).json({ msg: 'You have not deposited enough to withdraw the daily bonus' });
      }

      if (req.user.lastBonusWithdrawal && new Date().setHours(0, 0, 0, 0) === new Date(req.user.lastBonusWithdrawal).setHours(0, 0, 0, 0)) {
        return res.status(400).json({ msg: 'You have already withdrawn the daily bonus' });
      }
      req.user.walletAmount += 100;
      req.user.lastBonusWithdrawal = Date.now();
      await req.user.save();
      res.json({ msg: 'Daily bonus withdrawn, 100 added to wallet' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
