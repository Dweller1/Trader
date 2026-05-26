/**
 * In-memory registry for pending backtest jobs.
 * REST POST creates the job entry; the WS connection consumes it.
 * Map key: backtestId (UUID)
 * Map value: { userId, strategyId, graphData, candles, params, ticker, dateFrom, dateTo }
 */
const pending = new Map();

function register(backtestId, job) {
  pending.set(backtestId, job);
}

function consume(backtestId) {
  const job = pending.get(backtestId) ?? null;
  if (job) pending.delete(backtestId);
  return job;
}

module.exports = { register, consume };
