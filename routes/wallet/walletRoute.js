const express = require("express");
const router = express.Router();
const User = require("../../models/userModel");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const auth = require("../../middlewares/auth");
const Deposit = require("../../models/depositHistoryModel");
const Commission = require("../../models/commissionModel");
const MainLevelModel = require("../../models/levelSchema");

router.post("/wallet", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }
    const userId = req.user._id;

    // Fetch commission levels configuration
    const mainLevelConfig = await MainLevelModel.findOne();
    if (!mainLevelConfig || !mainLevelConfig.levels || mainLevelConfig.levels.length === 0) {
      return res.status(500).json({ msg: "Commission levels configuration not found" });
    }
    const { levels } = mainLevelConfig;

    // Calculate total deposit
    const depositDetails = await Deposit.find({ userId: userId });
    const totalPrevDepositAmount = depositDetails.reduce(
      (total, depositEntry) => total + depositEntry.depositAmount,
      0
    );

    let totalDeposit = totalPrevDepositAmount + amount;

    // Update user wallet and achievements based on levels
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
      }
    });

    req.user.walletAmount += amount;
    await req.user.save();

    // Check and update first deposit
    let isFirstDeposit = false;
    if (!req.user.firstDepositMade) {
      req.user.firstDepositMade = true;
      isFirstDeposit = true;
    }
    await req.user.save();

    // Create deposit history
    const depositHistory = new Deposit({
      userId: req.user._id,
      depositAmount: amount,
      depositDate: new Date(),
      depositStatus: "completed",
      depositId: "some-unique-id",
      depositMethod: "some-method"
    });
    await depositHistory.save();

    // Distribute commission up the chain
    if (req.user.referrer) {
      const commissionRates = await Commission.findOne();
      const commissionRatesArray = [
        commissionRates.level1,
        commissionRates.level2,
        commissionRates.level3,
        commissionRates.level4,
        commissionRates.level5
      ];

      let currentReferrer = await User.findById(req.user.referrer);
      for (let i = 0; i < 5; i++) {
        if (!currentReferrer) {
          break;
        }

        // Update subordinate data
        let subordinateData = {
          userId: req.user._id,
          noOfRegister: 0,
          depositNumber: 1,
          depositAmount: amount,
          firstDeposit: isFirstDeposit ? 1 : 0,
          date: new Date(),
          parentReferrer: currentReferrer._id,
          level: i + 1
        };

        if (i === 0) {
          const directSubordinateIndex = currentReferrer.directSubordinates.findIndex(
            sub => sub.userId && sub.userId.equals(req.user._id)
          );

          if (directSubordinateIndex !== -1) {
            currentReferrer.directSubordinates[directSubordinateIndex].depositNumber++;
            currentReferrer.directSubordinates[directSubordinateIndex].depositAmount += amount;
            if (isFirstDeposit) {
              currentReferrer.directSubordinates[directSubordinateIndex].firstDeposit++;
            }
          } else {
            currentReferrer.directSubordinates.push(subordinateData);
          }
        } else {
          const teamSubordinateIndex = currentReferrer.teamSubordinates.findIndex(
            sub => sub.userId && sub.userId.equals(req.user._id)
          );

          if (teamSubordinateIndex !== -1) {
            currentReferrer.teamSubordinates[teamSubordinateIndex].depositNumber++;
            currentReferrer.teamSubordinates[teamSubordinateIndex].depositAmount += amount;
            if (isFirstDeposit) {
              currentReferrer.teamSubordinates[teamSubordinateIndex].firstDeposit++;
            }
          } else {
            currentReferrer.teamSubordinates.push(subordinateData);
          }
        }

        // Calculate and add commission
        let commission = amount * commissionRatesArray[i];
        if (isFirstDeposit) {
          currentReferrer.walletAmount += commission;
        }

        // Update commission records
        let today = new Date().setHours(0, 0, 0, 0);
        let existingRecord = currentReferrer.commissionRecords.find(
          record =>
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
            depositAmount: amount
          });
        }
        await currentReferrer.save();

        currentReferrer = await User.findById(currentReferrer.referrer);
      }
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
    let pendingRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus !== "completed"
    );
    if (pendingRechargeArray.length === 0) {
      return res.status(200).json({
        pendingAmount: 0,
        success: true,
        message: "No transaction is in pending state",
      });
    }
    let totalPendingAmount = pendingRechargeArray.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );
    res.status(200).json({
      pendingAmount: totalPendingAmount,
      success: true,
      message: "Data fetched successfully",
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
    let successRechargeArray = allDeposit.filter(
      (deposit) => deposit.depositStatus === "completed"
    );
    if (successRechargeArray.length === 0) {
      return res.status(200).json({
        successRechargeAmount: 0,
        success: true,
        message: "No success recharge done yet",
      });
    }
    let totalSuccessAmount = successRechargeArray.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );
    res.status(200).json({
      successAmount: totalSuccessAmount,
      success: true,
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/attendance", auth, async (req, res) => {
  try {
    const totalDeposit = await Deposit.aggregate([
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
      return res.status(400).json({ msg: "You have already withdrawn the daily bonus" });
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
