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
  return latestTimer ? latestTimer.periodId : null;
}

const createTimer2 = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;
  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    setTimeout(async () => {
      const userBets = await k3betmodel.find({ periodId });

      // Calculate total bet amounts for each number
      const totalBetAmounts = Array.from({ length: 16 }, () => 0); // Initialize array for 16 numbers from 3 to 18
      userBets.forEach(bet => {
        totalBetAmounts[bet.option - 3] += bet.betAmount; // Adjust index to start from 0 for number 3
      });

      // Find the least inputted totalsum number
      const leastInputtedTotalSum = totalBetAmounts.indexOf(Math.min(...totalBetAmounts)) + 3; // Adjust index back to represent number 3

      // Initialize dice outcomes
      let diceOutcomeD1, diceOutcomeD2, diceOutcomeD3;

      // Ensure the user's total sum number is divided into three dice outcomes
      if (leastInputtedTotalSum % 3 === 0) {
        // If the user's total sum number is divisible by 3, divide it equally among three dice outcomes
        diceOutcomeD1 = diceOutcomeD2 = diceOutcomeD3 = leastInputtedTotalSum / 3;
      } else {
        // If the user's total sum number is not divisible by 3, adjust the dice outcomes accordingly
        const remainder = leastInputtedTotalSum % 3;
        diceOutcomeD1 = diceOutcomeD2 = leastInputtedTotalSum - remainder; // d1 and d2 together cover the divisible part
        diceOutcomeD3 = remainder; // Assign the remainder to d3
      }

      // Save dice outcomes in the ResultK3 model
      const K3Results = new K3Result({
        timerName: timerName,
        periodId: periodId,
        totalSum: leastInputtedTotalSum,
        size: leastInputtedTotalSum === 3 || leastInputtedTotalSum === 18 ? "Big" : "Small",
        parity: leastInputtedTotalSum % 2 === 0 ? "Even" : "Odd",
        diceOutcome: [diceOutcomeD1, diceOutcomeD2, diceOutcomeD3]
      });
      await K3Results.save();
      console.log(`K3 Timer ${timerName} & ${periodId} ended.`);

      // Process user bets
      if (userBets.length === 0) {
        console.log(`No bets for ${timerName} & ${periodId}`);
      } else {
        console.log(`Processing bets for ${timerName} & ${periodId}`, userBets);
      }
      for (let bet of userBets) {
        let userWon = false;
        let winAmount = 0;

        // Check if user's bet matches the least inputted totalsum number
        if (parseInt(bet.option) === leastInputtedTotalSum) {
          userWon = true;
          winAmount = bet.betAmount * bet.multiplier;
        }

        if (userWon) {
          const user = await User.findById(bet.user);
          if (user) {
            user.walletAmount += winAmount;
            await user.save();
            bet.winLoss = "win";
            bet.status = "won";
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
