const express = require("express");
const router = express.Router({ mergeParams: true });
const requireAuth = require("../middleware/requireAuth");
const BacktestController = require("../controllers/BacktestController");

router.use(requireAuth);

router.post("/", BacktestController.startBacktest);
router.get("/results", BacktestController.getResults);
router.get("/results/:backtestId", BacktestController.getResultById);

module.exports = router;
