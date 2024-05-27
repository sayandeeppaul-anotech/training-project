const express = require("express");
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
///////////////////////////////////////////////////////////////////////////////////////////////////////
const CreateAddress = require('./Admin/TRX-Address')
const UpdateAddress = require('./Admin/TRX-Address')
const getAddresses = require('./Admin/TRX-Address')
const UPIAddress = require('./Admin/UPIAddress')
const UpdateUPI = require('./Admin/UPIAddress')
const Getid = require('./Admin/UPIAddress')
////////////////////////////////////////////////////////////////////////////////////////////////////////
const transaction = require('./Admin/TransactionHistoryRoute')
const Savings = require('./wallet/SavingsAmount')
const ShowSavings = require('./wallet/SavingsAmount')

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
///////////////////////////////////////////////////////////
router.use('/', CreateAddress)
router.use('/', UpdateAddress)
router.use('/', getAddresses)
router.use('/',UPIAddress)
router.use('/',UpdateUPI)
router.use('/',Getid)

router.use('/',transaction)
router.use('/',Savings)
router.use('/',ShowSavings)

module.exports = router;
