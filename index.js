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
const withdraw = require('./routes/Admin/withdrawRoute')
const cors = require('cors')
const Subordinates = require('./routes/Admin/Subordinates')
const levelAmount = require('./routes/Admin/CommissionPercentage')
const cron = require('node-cron');
const moment = require('moment');
const Salary = require('./models/salaryModel');
const User = require('./models/userModel');
const manageUsers = require('./routes/Admin/manageUsersRoute')
const practice = require('./routes/common/practice')



// ----------------------------------------------------------------------------------------




app.use(express.json());
app.use(cookieParser());
app.use(cors())
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
app.use('/',withdraw)
app.use('/',manageUsers)
app.use('/',practice)


db.connectDB();  
setupWebSocket(server);
copyData();

cron.schedule('* * * * *', async () => {
    const salaries = await Salary.find({ nextPaymentDate: { $lte: new Date() }, frequencyLimit: { $gt: 0 } });
    for (let salary of salaries) {
      const user = await User.findOne({ uid: salary.uid });
      user.walletAmount += salary.salaryAmount;
      await user.save();
  
      salary.nextPaymentDate = moment(salary.nextPaymentDate).add(1, salary.salaryFrequency.toLowerCase()).toDate();
      salary.frequencyLimit--;
      await salary.save();
    }
  });


server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});





