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




// ----------------------------------------------------------------------------------------





app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(logger);
app.use(routes);
app.use('/', practice);
app.use('/', user);



db.connectDB();
setupWebSocket(server);



server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
