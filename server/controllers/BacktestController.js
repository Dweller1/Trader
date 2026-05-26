const { v4: uuidv4 } = require("uuid");
const { Strategy, BacktestResult } = require("../models");
const { getCandles } = require("../services/MarketDataProvider");
const registry = require("../websocket/backtestRegistry");

async function startBacktest(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);

    if (!strategy) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Strategy not found" });
    }
    if (strategy.user_id !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        message: "Forbidden: you do not own this strategy",
      });
    }

    const { ticker, dateFrom, dateTo, initialCapital, commission } = req.body;

    if (!ticker || !dateFrom || !dateTo || initialCapital == null) {
      return res.status(400).json({
        statusCode: 400,
        message: "ticker, dateFrom, dateTo and initialCapital are required",
      });
    }

    const candles = getCandles(ticker, dateFrom, dateTo);
    if (candles.length === 0) {
      return res.status(422).json({
        statusCode: 422,
        message: `No candle data available for ticker "${ticker}" in the requested date range`,
      });
    }

    const backtestId = uuidv4();
    registry.register(backtestId, {
      userId: req.user.id,
      strategyId: strategy.id,
      graphData: strategy.graph_data,
      candles,
      params: {
        initialCapital: Number(initialCapital),
        commission: commission != null ? Number(commission) : 0,
      },
      ticker,
      dateFrom,
      dateTo,
    });

    return res.status(202).json({ backtestId });
  } catch (err) {
    next(err);
  }
}

async function getResults(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);

    if (!strategy) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Strategy not found" });
    }
    if (strategy.user_id !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        message: "Forbidden: you do not own this strategy",
      });
    }

    const results = await BacktestResult.findAll({
      where: { strategy_id: strategy.id },
      attributes: { exclude: ["equity_curve"] },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(results);
  } catch (err) {
    next(err);
  }
}

async function getResultById(req, res, next) {
  try {
    const record = await BacktestResult.findByPk(req.params.backtestId);

    if (!record) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Backtest result not found" });
    }

    const strategy = await Strategy.findByPk(record.strategy_id);
    if (!strategy || strategy.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ statusCode: 403, message: "Access denied" });
    }

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

module.exports = { startBacktest, getResults, getResultById };
