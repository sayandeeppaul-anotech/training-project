const express = require('express');
const logger = require('./middlewares/logger');
const db = require('./db');
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const app = express()
const http = require('http');
const server = http.createServer(app);
const {setupWebSocket, wss} = require('./websockets/websocket');
const cookieParser = require('cookie-parser');
const registerRoute = require('./routes/auth/registerRoute');
const loginRoute = require('./routes/auth/loginRoute');
const logoutRoute = require('./routes/auth/logoutRoute');
const walletRoute = require('./routes/wallet/walletRoute');
const betRoute = require('./routes/wingo/wingoRoutes');
const copyData = require('./controllers/copyCronJobControllers');
const couponRoutes = require('./routes/common/coupenCodeRoute');
const todaysJoinee = require('./routes/users/userDetailsRoute')
const transactions = require('./routes/wallet/TodaysRecharge')
const userBalance = require('./routes/Admin/UserBalance')
const Subordinates = require('./routes/Admin/Subordinates')
const levelAmount = require('./routes/Admin/CommissionPercentage')
const ChangePassword = require('./routes/ChangePassword/ChangePassword')
const createNotification = require('./routes/Notification/AllUserNotification')
const updateNotification = require('./routes/Notification/AllUserNotification')
const getNotification = require('./routes/Notification/AllUserNotification')
// ----------------------------------------------------------------------------------------



app.use(express.json());
app.use(cookieParser());
app.use(logger);
app.use('/', registerRoute);
app.use('/', loginRoute);
app.use('/', logoutRoute);
app.use('/', walletRoute);
app.use('/', betRoute);
app.use('/', couponRoutes);
app.use('/',todaysJoinee)
app.use('/',transactions)
app.use('/',userBalance)
app.use('/',Subordinates)
app.use('/',levelAmount)
app.use('/',ChangePassword)
app.use('/',createNotification)
app.use('/',updateNotification)
app.use('/',getNotification)


db.connectDB();  
setupWebSocket(server);
copyData();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});












