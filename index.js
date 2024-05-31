const express = require("express");
const logger = require("./middlewares/logger");
const db = require("./db");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const app = express();
const http = require("http");
const server = http.createServer(app);
const { setupWebSocket } = require("./websockets/websocket");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const routes = require("./routes/Routes");
const practice = require("./routes/common/practice");
const user = require("./routes/common/userSchema");
const path = require("path");
const session = require("express-session");




// ----------------------------------------------------------------------------------------


app.use(express.static(path.join(__dirname, 'build')));


app.use(session({
  cookie: {
    sameSite: 'None',
    secure: true
  }
}));


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3001', // replace with the domain of your front-end
  credentials: true
}));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(logger);
app.use(routes);
app.use('/', practice);
app.use('/', user);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

db.connectDB();
setupWebSocket(server);



server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
