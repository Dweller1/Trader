/**
 * Financial performance metrics calculator.
 * All percentage-returning functions produce values like 15.0 (meaning 15%), not 0.15.
 */

/**
 * @param {number} initialCapital
 * @param {number} finalCapital
 * @returns {number} total return as percentage  e.g. 15.0 means +15%
 */
function calcTotalReturn(initialCapital, finalCapital) {
  if (initialCapital === 0) return 0;
  return (finalCapital / initialCapital - 1) * 100;
}

/**
 * @param {number[]} equityCurve
 * @returns {number} maximum drawdown as percentage  e.g. 20.0 means 20% drawdown
 */
function calcMaxDrawdown(equityCurve) {
  if (!equityCurve || equityCurve.length === 0) return 0;
  let peak = equityCurve[0];
  let maxDD = 0;
  for (const value of equityCurve) {
    if (value > peak) peak = value;
    if (peak > 0) {
      const dd = ((peak - value) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return maxDD;
}

/**
 * Sharpe Ratio: mean(returns) / stdDev(returns).
 * Returns 0 on division by zero or insufficient data.
 * @param {number[]} returns  array of per-candle percentage returns
 * @returns {number}
 */
function calcSharpeRatio(returns) {
  if (!returns || returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return mean / stdDev;
}

/**
 * @param {Array<{pnl: number}>} trades
 * @returns {number} win rate as percentage  e.g. 60.0 means 60% win rate
 */
function calcWinRate(trades) {
  if (!trades || trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return (wins / trades.length) * 100;
}

/**
 * @param {Array} trades
 * @returns {number}
 */
function calcTotalTrades(trades) {
  return trades ? trades.length : 0;
}

module.exports = {
  calcTotalReturn,
  calcMaxDrawdown,
  calcSharpeRatio,
  calcWinRate,
  calcTotalTrades,
};
