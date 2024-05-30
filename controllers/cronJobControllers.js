const WingoResult = require("../models/wingoResultModel");
const K3Result = require("../models/K3ResultModel");
const TrxResult = require("../models/trxResultModel");
const crypto = require("crypto");
const cron = require("node-cron");
const moment = require("moment");
const Bets = require("../models/betsModel");
const User = require("../models/userModel");

function secondsToHms(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  return ("0" + m).slice(-2) + ":" + ("0" + (d % 60)).slice(-2);
}

async function getLatestPeriodId(timer) {
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
  }
  const latestTimer = await timerModel.find().sort({ _id: -1 }).limit(1);
  return latestTimer[0].periodId;
}

const createTimer = (TimerModel, interval, timerName) => {
  const cronInterval = `*/${interval} * * * *`;

  const jobFunction = async () => {
    const periodId = moment().format("YYYYMMDDHHmmss");
    await TimerModel.create({ periodId });

    setTimeout(async () => {
      // Fetch all the bets for the current periodId
      const bets = await Bets.find({ periodId });

      console.log("Bets for", timerName, " & ", periodId, "found:", bets);

      // Separate bets into number bets and size bets
      const numberBets = bets.filter((bet) => /^[0-9]$/.test(bet.selectedItem));
      const sizeBets = bets.filter((bet) =>
        ["small", "big"].includes(bet.sizeOutcome)
      );

      console.log(
        "numberBets, sizeBets --->",
        numberBets.length,
        sizeBets.length
      );

      // Initialize betCounts with all numbers set to 0 and size bets
      const betCounts = { number: {}, size: { small: 0, big: 0 } };
      for (let i = 0; i < 10; i++) {
        betCounts.number[i.toString()] = 0;
      }

      // Count the number bets and size bets
      numberBets.forEach((bet) => {
        betCounts.number[bet.selectedItem]++;
      });
      sizeBets.forEach((bet) => {
        betCounts.size[bet.sizeOutcome]++;
      });

      console.log("betCounts --->", betCounts);

      // Determine the majority category and the least bet option
      let outcomeCategory, outcomeValue;

      if (numberBets.length >= sizeBets.length) {
        // Compare numberBets and sizeBets length
        outcomeCategory = "number";
        const minBetCount = Math.min(...Object.values(betCounts.number));
        const leastBetNumbers = Object.keys(betCounts.number).filter(
          (number) => betCounts.number[number] === minBetCount
        );
        outcomeValue =
          leastBetNumbers.length > 0
            ? leastBetNumbers[
                Math.floor(Math.random() * leastBetNumbers.length)
              ]
            : Math.floor(Math.random() * 10).toString();
      } else {
        outcomeCategory = "size";
        const leastBetSize =
          betCounts.size.small <= betCounts.size.big ? "small" : "big"; // Determine least bet size
        outcomeValue = leastBetSize;
      }

      console.log("outcome category ---->", outcomeCategory);

      // Determine number outcome if size outcome is selected
      let numberOutcome;
      if (outcomeCategory === "size") {
        const bigNumbers = ["5", "6", "7", "8", "9"];
        const smallNumbers = ["0", "1", "2", "3", "4"];

        if (outcomeValue === "small") {
          // Filter for small numbers
          const smallNumberBets = numberBets.filter((bet) =>
            smallNumbers.includes(bet.selectedItem)
          );
          const minSmallBetCount =
            smallNumberBets.length > 0
              ? Math.min(
                  ...smallNumberBets.map(
                    (bet) => betCounts.number[bet.selectedItem]
                  )
                )
              : 0;
          const leastBetSmallNumbers = smallNumbers.filter(
            (number) => (betCounts.number[number] || 0) === minSmallBetCount
          );
          numberOutcome =
            leastBetSmallNumbers.length > 0
              ? leastBetSmallNumbers[
                  Math.floor(Math.random() * leastBetSmallNumbers.length)
                ]
              : smallNumbers[Math.floor(Math.random() * smallNumbers.length)];
        } else {
          // Filter for big numbers
          const bigNumberBets = numberBets.filter((bet) =>
            bigNumbers.includes(bet.selectedItem)
          );
          const minBigBetCount =
            bigNumberBets.length > 0
              ? Math.min(
                  ...bigNumberBets.map(
                    (bet) => betCounts.number[bet.selectedItem]
                  )
                )
              : 0;
          const leastBetBigNumbers = bigNumbers.filter(
            (number) => (betCounts.number[number] || 0) === minBigBetCount
          );
          numberOutcome =
            leastBetBigNumbers.length > 0
              ? leastBetBigNumbers[
                  Math.floor(Math.random() * leastBetBigNumbers.length)
                ]
              : bigNumbers[Math.floor(Math.random() * bigNumbers.length)];
        }
      } else {
        numberOutcome = outcomeValue;
      }

      let sizeOutcome = parseInt(numberOutcome) < 5 ? "small" : "big";
      let colorOutcome;
      switch (numberOutcome) {
        case "1":
        case "3":
        case "7":
        case "9":
          colorOutcome = "green";
          break;
        case "2":
        case "4":
        case "6":
        case "8":
          colorOutcome = "red";
          break;
        case "0":
          colorOutcome = ["red", "violet"];
          break;
        case "5":
          colorOutcome = ["green", "violet"];
          break;
        default:
          colorOutcome = "unknown";
      }

      await WingoResult.create({
        timer: timerName,
        periodId,
        colorOutcome,
        numberOutcome,
        sizeOutcome,
      });

      console.log(`Timer ${timerName} & ${periodId} ended.`);

      if (bets.length === 0) {
        console.log(`No bets for ${timerName} & ${periodId}`);
        return;
      } else {
        console.log(`Bets for ${timerName} & ${periodId} found.`);
        if (bets.length > 0) {
          bets
            .filter((bet) => bet.selectedTimer === timerName)
            .forEach(async (bet) => {
              let winLoss = 0;
              let status = "lost";
              let result = numberOutcome;
              if (bet.selectedItem === numberOutcome) {
                winLoss =
                  typeof bet.totalBet === "number"
                    ? (bet.totalBet * 9).toString()
                    : "0";
              } else if (bet.selectedItem === colorOutcome) {
                winLoss =
                  typeof bet.totalBet === "number"
                    ? (bet.totalBet * 2).toString()
                    : "0";
              } else if (
                bet.selectedItem === sizeOutcome ||
                bet.sizeOutcome === sizeOutcome
              ) {
                winLoss =
                  typeof bet.totalBet === "number"
                    ? (bet.totalBet * 2).toString()
                    : "0";
              }

              if (winLoss !== 0) {
                const user = await User.findById(bet.userId);
                if (user) {
                  user.walletAmount += Number(winLoss);
                  await user.save();
                }
                status = "win";
              } else {
                winLoss =
                  typeof bet.totalBet === "number"
                    ? (bet.totalBet * -1).toString()
                    : "0";
              }
              await Bets.findByIdAndUpdate(bet._id, {
                status,
                winLoss,
                result,
              });
            });
        }
      }

      const trxBlockAddress = Math.floor(
        Math.random() * 90000000 + 10000000
      ).toString();
      const blockTime = moment().format("HH:mm:ss");
      const hash = crypto.randomBytes(20).toString("hex");
      const numberOutcomeGameResult = hash.match(/\d(?=[^\d]*$)/)[0];

      const gameResult = new TrxResult({
        timer: timerName,
        periodId,
        colorOutcome,
        numberOutcome: numberOutcomeGameResult,
        sizeOutcome,
        trxBlockAddress,
        blockTime,
        hash,
      });

      await gameResult.save();

      // K3 game logic
      const diceOutcome = [
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ];
      const totalSum = diceOutcome.reduce((a, b) => a + b, 0);
      const size = totalSum < 15 ? "Small" : "Big";
      const parity = totalSum % 2 === 0 ? "Even" : "Odd";

      const resultK3 = new K3Result({
        timerName: timerName,
        periodId: periodId,
        totalSum: totalSum,
        size: size,
        parity: parity,
        diceOutcome: diceOutcome,
      });

      resultK3.save();
    }, interval * 60 * 1000);

    console.log(`Timer ${timerName} & ${periodId} started.`);
  };

  jobFunction();

  const job = cron.schedule(cronInterval, jobFunction);

  job.start();
};

const calculateRemainingTime = (periodId, minutes) => {
  const endTime = moment(periodId, "YYYYMMDDHHmmss").add(minutes, "minutes");
  const now = moment();
  const diff = endTime.diff(now, "seconds");
  return diff > 0 ? diff : 0;
};

module.exports = {
  secondsToHms,
  calculateRemainingTime,
  getLatestPeriodId,
  createTimer,
};
