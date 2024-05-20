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
<<<<<<< HEAD
const transactions = require('./routes/wallet/TodaysRecharge')
const userBalance = require('./routes/Admin/UserBalance')
=======
const todaysJoinee = require('./routes/users/userDetailsRoute')

>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806

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
<<<<<<< HEAD
app.use('/',transactions)
app.use('/',userBalance)
=======
app.use('/',todaysJoinee)
>>>>>>> d99099c7a07264f89ef3c8ac107a27bbba90c806


db.connectDB();  
setupWebSocket(server);
copyData();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});












