const express = require("express");
const User = require("../models/userModel");
const K3Result = require("../models/K3ResultModel");
const k3betmodel = require("../models/K3betmodel");
const Timer1Min = require("../models/timersModel");
const Timer3Min = require("../models/timersModel");
const Timer5Min = require("../models/timersModel");
const Timer10Min = require("../models/timersModel");
const cron = require("node-cron");
const moment = require("moment");

function secondsToHms2(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
}

async function getLatestPeriodId2(timer) {
  let timerModel;
  switch (timer) {
    case "1min":
      timerModel = Timer1Min;
      break;
    case "3min":
      timerModel = Timer3Min;
      break;
    case "5min":
      timerModel = Timer5Min;
      break;
    case "10min":
      timerModel = Timer10Min;
      break;
    default:
      throw new Error("Invalid timer specified");
  }
  const latestTimer = await timerModel.findOne().sort({ _id: -1 });
  return latestTimer.periodId;
}

const createTimer2 = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;
  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    setTimeout(async () => {
      const userBets = await k3betmodel.find({ periodId: periodId });

      // Separate bets into two sections
      const totalSumBets = userBets.filter(bet => bet.selectedItem === "totalSum");
      const otherBets = userBets.filter(bet => bet.selectedItem !== "totalSum");

      // Determine the least betted outcome for totalSum section
      const totalSumCounts = {};
      totalSumBets.forEach(bet => {
        if (!totalSumCounts[bet.totalSum]) totalSumCounts[bet.totalSum] = 0;
        totalSumCounts[bet.totalSum]++;
      });

      let leastBettedTotalSum;
      if (Object.keys(totalSumCounts).length > 0) {
        leastBettedTotalSum = Object.keys(totalSumCounts).reduce((a, b) => totalSumCounts[a] <= totalSumCounts[b] ? a : b);
      } else {
        leastBettedTotalSum = null; // Handle the case when no bets are placed on totalSum
      }

      // Determine the least betted outcome for other section
      const otherCounts = { twoSameOneDifferent: 0, threeSame: 0, threeDifferentNumbers: 0, size: 0, parity: 0 };
      otherBets.forEach(bet => otherCounts[bet.selectedItem]++);

      let leastBettedOtherItem;
      if (Object.keys(otherCounts).length > 0) {
        leastBettedOtherItem = Object.keys(otherCounts).reduce((a, b) => otherCounts[a] <= otherCounts[b] ? a : b);
      } else {
        leastBettedOtherItem = null; // Handle the case when no bets are placed on other items
      }

      // Generate dice outcomes based on the least betted outcomes
      const bias = Math.random() < 0.5; // 50% chance to bias towards least betted outcomes
      let diceOutcomeD1, diceOutcomeD2, diceOutcomeD3;

      if (bias && leastBettedTotalSum !== null) {
        let totalSum = parseInt(leastBettedTotalSum, 10) || 0; // Provide default value if null
        do {
          diceOutcomeD1 = Math.ceil(Math.random() * 6);
          diceOutcomeD2 = Math.ceil(Math.random() * 6);
          diceOutcomeD3 = totalSum - diceOutcomeD1 - diceOutcomeD2;
        } while (diceOutcomeD3 < 1 || diceOutcomeD3 > 6);
      } else {
        diceOutcomeD1 = Math.ceil(Math.random() * 6);
        diceOutcomeD2 = Math.ceil(Math.random() * 6);
        diceOutcomeD3 = Math.ceil(Math.random() * 6);
      }

      let totalSum = diceOutcomeD1 + diceOutcomeD2 + diceOutcomeD3;
      let size = totalSum > 10 ? "Big" : "Small";
      let parity = totalSum % 2 === 0 ? "Even" : "Odd";
      let twoSameOneDifferent = (diceOutcomeD1 === diceOutcomeD2 && diceOutcomeD1 !== diceOutcomeD3) ||
                                (diceOutcomeD1 === diceOutcomeD3 && diceOutcomeD1 !== diceOutcomeD2) ||
                                (diceOutcomeD2 === diceOutcomeD3 && diceOutcomeD2 !== diceOutcomeD1);
      let threeSame = diceOutcomeD1 === diceOutcomeD2 && diceOutcomeD1 === diceOutcomeD3;
      let threeDifferentNumbers = diceOutcomeD1 !== diceOutcomeD2 && diceOutcomeD1 !== diceOutcomeD3 && diceOutcomeD2 !== diceOutcomeD3;

      const K3Results = new K3Result({
        timerName: timerName,
        periodId: periodId,
        diceOutcomeD1: diceOutcomeD1,
        diceOutcomeD2: diceOutcomeD2,
        diceOutcomeD3: diceOutcomeD3,
        totalSum: totalSum,
        size: size,
        parity: parity,
        twoSameOneDifferent: twoSameOneDifferent,
        threeSame: threeSame,
        threeDifferentNumbers: threeDifferentNumbers,
      });
      await K3Results.save();
      console.log(`K3 Timer ${timerName} & ${periodId} ended.`);
      
      if (userBets.length === 0) {
        console.log(`No bets for ${timerName} & ${periodId}`);
      } else {
        console.log(`Processing bets for ${timerName} & ${periodId}`, userBets);
      }

      for (let bet of userBets) {
        let userWon = false;
        let winAmount = 0;

        switch (bet.selectedItem) {
          case "totalSum":
            if (bet.totalSum === totalSum) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          case "twoSameOneDifferent":
            if (twoSameOneDifferent) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          case "threeSame":
            if (threeSame) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          case "threeDifferentNumbers":
            if (threeDifferentNumbers) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          case "size":
            if (bet.size === size) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          case "parity":
            if (bet.parity === parity) {
              userWon = true;
              winAmount = bet.betAmount * bet.multiplier;
            }
            break;
          default:
            break;
        }
        if (bet.selectedItem === "totalSum" && bet.totalSum === parseInt(leastBettedTotalSum, 10)) {
          userWon = true;
          winAmount = bet.betAmount * bet.multiplier;
        }

        if (userWon) {
          const user = await User.findById(bet.user);
          if (user) {
            user.walletAmount += winAmount;
            await user.save();
            bet.winLoss = "win";
            bet.status = "won"; // Update status to 'won'
          }
        } else {
          bet.winLoss = "loss";
          bet.status = "lost";
        }

        await bet.save();
      }
    }, interval * 60 * 1000);
    console.log(`K3 Timer ${timerName} & ${periodId} started.`);
  };
  const job = cron.schedule(cronInterval, jobFunction);
  job.start();
};

const calculateRemainingTime2 = (periodId, minutes) => {
  const endtime = moment(periodId, "YYYYMMDDHHmmss").add(minutes, "minutes");
  const now = moment();
  const diff = endtime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

module.exports = {
  createTimer2,
  getLatestPeriodId2,
  calculateRemainingTime2,
  secondsToHms2,
};
