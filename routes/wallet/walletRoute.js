const express = require("express");
const router = express.Router();
const User = require("../../models/userModel");
const {
  isAdmin,
  isNormal,
  isRestricted,
} = require("../../middlewares/roleSpecificMiddleware");
const auth = require("../../middlewares/auth");
const Deposit = require("../../models/depositHistoryModel");
const Commission = require("../../models/commissionModel");
const MainLevelModel = require("../../models/levelSchema");
const {addTransactionDetails} = require('../../controllers/TransactionHistoryControllers')


router.post("/wallet", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }
    const userId = req.user._id;

    const mainLevelConfig = await MainLevelModel.findOne();
    if (
      !mainLevelConfig ||
      !mainLevelConfig.levels ||
      mainLevelConfig.levels.length === 0
    ) {
      console.log(
        "No commission level is set up yet to claim the reward amount"
      );
      return res
        .status(500)
        .json({ msg: "Commission levels configuration not found" });
    }
    const { levels } = mainLevelConfig;
    console.log(levels);
    const depositDetails = await Deposit.find({ userId: userId });
    console.log("deposit details---------------->", depositDetails);
    const totalPrevDepositAmount = depositDetails.reduce(
      (total, depositEntry) => {
        return total + depositEntry.depositAmount;
      },
      0
    );

    let totalDeposit = totalPrevDepositAmount + amount;
    console.log(`Total deposit amount: ${totalDeposit}`);
    levels.forEach((level, index) => {
      const prevLevelAmount = index > 0 ? levels[index - 1].minAmount : 0;
      if (
        totalDeposit >= level.minAmount &&
        totalPrevDepositAmount < level.minAmount &&
        totalPrevDepositAmount >= prevLevelAmount &&
        !req.user.achievements.includes(level.awarded)
      ) {
        req.user.walletAmount += level.bonusAmount;

        req.user.achievements.push(level.awarded);

        console.log(`Bonus for reaching level ${index + 1} added successfully`);
      }
    });
    req.user.walletAmount += amount;
    await req.user.save();

    let isFirstDeposit = false;
    if (!req.user.firstDepositMade) {
      req.user.firstDepositMade = true;
      isFirstDeposit = true;
    }
    await req.user.save();

    const depositHistory = new Deposit({
      userId: req.user._id,
      depositAmount: amount,
      depositDate: new Date(),
      depositStatus: "completed",
      depositId: "some-unique-id",
      depositMethod: "some-method",
    });
    await depositHistory.save();
    addTransactionDetails(userId,amount,"deposit", new Date())
    console.log('......>',addTransactionDetails)

    if (!req.user.referrer) {
      return res.status(200).json({ msg: "Wallet updated" });
    }

    let currentReferrer = await User.findById(req.user.referrer);

    const commisionRates = await Commission.find();
    let level1 = commisionRates[0].level1;
    let level2 = commisionRates[0].level2;
    let level3 = commisionRates[0].level3;
    let level4 = commisionRates[0].level4;
    let level5 = commisionRates[0].level5;
    let commissionRates = [level1, level2, level3, level4, level5];
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
      addTransactionDetails(userId,amount,"Interest", new Date())

      currentReferrer = await User.findById(currentReferrer.referrer);
    }

    res.status(200).json({ msg: "Wallet updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/deposit/history", auth, isAdmin, async (req, res) => {
  try {
    const depositHistory = await Deposit.find();
    console.log("------------->",depositHistory)
    res.status(200).json(depositHistory);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/pending-recharge", auth, isAdmin, async (req, res) => {
  try {
    const allDeposit = await Deposit.find();
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
    const allDeposit = await Deposit.find();
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

router.post("/attendance", auth, async (req, res) => {
  try {
    const totalDeposit = await DepositHistory.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: "$depositAmount" } } },
    ]);

    if (!totalDeposit[0] || totalDeposit[0].total < 10000) {
      return res.status(400).json({
        msg: "You have not deposited enough to withdraw the daily bonus",
      });
    }

    if (
      req.user.lastBonusWithdrawal &&
      new Date().setHours(0, 0, 0, 0) ===
        new Date(req.user.lastBonusWithdrawal).setHours(0, 0, 0, 0)
    ) {
      return res
        .status(400)
        .json({ msg: "You have already withdrawn the daily bonus" });
    }
    req.user.walletAmount += 100;
    req.user.lastBonusWithdrawal = Date.now();
    await req.user.save();
    res.json({ msg: "Daily bonus withdrawn, 100 added to wallet" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;