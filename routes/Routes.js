const express = require('express');
const router = express.Router();

const registerRoute = require('../routes/auth/registerRoute');
const loginRoute = require('../routes/auth/loginRoute');
const logoutRoute = require('../routes/auth/logoutRoute');
const walletRoute = require('../routes/wallet/walletRoute');
const betRoute = require('../routes/wingo/wingoRoutes');
const couponRoutes = require('../routes/common/coupenCodeRoute');
const todaysJoinee = require('../routes/users/userDetailsRoute');
const transactions = require('../routes/wallet/TodaysRecharge');
const userBalance = require('../routes/Admin/UserBalance');
const withdraw = require('../routes/Admin/withdrawRoute');
const ChangePassword = require('../routes/ChangePassword/ChangePassword');
const createNotification = require('../routes/Notification/AllUserNotification');
const getNotification = require('../routes/Notification/AllUserNotification');
const commission = require('../routes/Admin/commisionRoute');

router.use('/', registerRoute);
router.use('/', loginRoute);
router.use('/', logoutRoute);
router.use('/', walletRoute);
router.use('/', betRoute);
router.use('/', couponRoutes);
router.use('/', todaysJoinee);
router.use('/', transactions);
router.use('/', userBalance);
router.use('/', withdraw);
router.use('/', ChangePassword);
router.use('/', createNotification); 
router.use('/', getNotification);
router.use('/', commission);

module.exports = router;
