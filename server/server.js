require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");

const sequelize = require("./config/db");
require("./models");

const authRoutes = require("./routes/auth");
const strategyRoutes = require("./routes/strategies");
const backtestRoutes = require("./routes/backtests");
const { init: initWebSocket } = require("./websocket/backtestSocket");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/strategies/:id/backtest", backtestRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (statusCode === 500) {
    console.error("[ERROR]", err);
  }
  res.status(statusCode).json({ statusCode, message });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initWebSocket(server);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established.");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`VAT Builder server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
