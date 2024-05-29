const express = require("express");
const router = express.Router();
const { requestWithdraw } = require("../../controllers/requestWithdrawController");
const auth = require("../../middlewares/auth");
const {isAdmin,isNormal,} = require("../../middlewares/roleSpecificMiddleware");
const { fetchWithdrawController } = require("../../controllers/fetchWithdrawController");
const {withdrawAcceptanceController,} = require("../../controllers/withdrawAcceptanceController");
const {totalWithdrawRequestController,} = require("../../controllers/totalWithdrawRequestController");
const { totalWithdrawsController } = require("../../controllers/totalWithdrawsController");
const {getTotalWithdrawAmountLast24Hours,} = require("../../controllers/todaysWithdrawController");

router.post("/withdraw-request", auth, isNormal, requestWithdraw);
router.get("/all-withdraw-history-admin_only",auth,isAdmin,fetchWithdrawController);
router.get("/all-withdraw-history", auth, isNormal, fetchWithdrawController);
router.post("/update-withdraw-status",auth,isAdmin,withdrawAcceptanceController);

router.get("/total-withdraw-request-amount",auth,isAdmin,totalWithdrawRequestController);
router.get("/total-withdrawl-amount", auth, isAdmin, totalWithdrawsController);
router.get("/total-withdraw-amount-last-24-hours",auth,isAdmin,getTotalWithdrawAmountLast24Hours);


module.exports = router;
