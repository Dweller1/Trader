const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { parse: parseUrl } = require("url");
const { BacktestResult } = require("../models");
const BacktestEngine = require("../services/BacktestEngine");
const registry = require("./backtestRegistry");

/**
 * Attach the backtest WebSocket server to an existing HTTP server.
 *
 * Connection:  ws://host:5000?token=<accessToken>&backtestId=<uuid>
 *   The backtestId must first be obtained from POST /api/strategies/:id/backtest.
 *
 * Server → Client messages:
 *   { type: 'progress', progress: 0-100 }
 *   { type: 'complete', backtestId }
 *   { type: 'error',    message: string }
 *
 * @param {import('http').Server} server
 */
function init(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    const { query } = parseUrl(req.url, true);
    const token = query.token;
    const backtestId = query.backtestId;

    function send(obj) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    }

    if (!token) {
      ws.close(4001, "Missing token");
      return;
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      ws.close(4001, "Invalid or expired token");
      return;
    }

    if (!backtestId) {
      send({ type: "error", message: "backtestId query param required" });
      ws.close(4002, "Missing backtestId");
      return;
    }

    const job = registry.consume(backtestId);
    if (!job) {
      send({
        type: "error",
        message: "Unknown or already-consumed backtestId",
      });
      ws.close(4003, "Job not found");
      return;
    }

    if (job.userId !== user.id) {
      send({ type: "error", message: "Forbidden" });
      ws.close(4001, "Forbidden");
      return;
    }

    (async () => {
      try {
        const result = await BacktestEngine.run(
          job.graphData,
          job.candles,
          job.params,
          (progress) => send({ type: "progress", progress }),
        );

        await BacktestResult.create({
          id: backtestId,
          strategy_id: job.strategyId,
          ticker: job.ticker,
          date_from: job.dateFrom,
          date_to: job.dateTo,
          initial_capital: job.params.initialCapital,
          total_return: result.totalReturn,
          sharpe_ratio: result.sharpeRatio,
          max_drawdown: result.maxDrawdown,
          win_rate: result.winRate,
          total_trades: result.totalTrades,
          equity_curve: result.equityCurve,
        });

        send({ type: "complete", backtestId });
      } catch (err) {
        send({ type: "error", message: err.message });
      }
    })();

    ws.on("error", (err) => console.error("[WS] socket error:", err.message));
  });

  return wss;
}

module.exports = { init };
