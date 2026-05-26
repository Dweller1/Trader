/**
 * MarketDataProvider — static OHLCV candle source for backtesting.
 * Uses a seeded LCG + Box-Muller transform to generate 330 deterministic
 * daily candles for AAPL starting 2023-01-03 (skips weekends).
 * No external API calls required.
 */

function seededLCG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function generateAAPLCandles() {
  const rng = seededLCG(0xdeadbeef);
  const candles = [];

  let ts = Math.floor(new Date('2023-01-03T00:00:00Z').getTime() / 1000);
  let prevClose = 125.07;

  while (candles.length < 330) {
    const d = new Date(ts * 1000);
    const dow = d.getUTCDay();

    if (dow === 0 || dow === 6) {
      ts += 86400;
      continue;
    }

    const u1 = rng() + 1e-10;
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const drift = 0.0003;
    const vol = 0.015;
    const dailyReturn = Math.max(-0.08, Math.min(0.08, drift + vol * z));

    const open = +(prevClose * (1 + (rng() - 0.5) * 0.004)).toFixed(2);
    const close = +(open * (1 + dailyReturn)).toFixed(2);
    const high = +(Math.max(open, close) * (1 + rng() * 0.01)).toFixed(2);
    const low = +(Math.min(open, close) * (1 - rng() * 0.01)).toFixed(2);
    const volume = Math.round(50e6 + rng() * 100e6);

    candles.push({
      timestamp: ts,
      date: d.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume,
    });

    prevClose = close;
    ts += 86400;
  }

  return candles;
}

const AAPL_CANDLES = generateAAPLCandles();

/**
 * Return candles for a given ticker filtered by optional date range.
 * Only 'AAPL' is available as built-in data; returns [] for unknown tickers.
 *
 * @param {string} ticker
 * @param {string|null} dateFrom  ISO date string 'YYYY-MM-DD' (inclusive)
 * @param {string|null} dateTo    ISO date string 'YYYY-MM-DD' (inclusive)
 * @returns {{ timestamp, date, open, high, low, close, volume }[]}
 */
function getCandles(ticker, dateFrom, dateTo) {
  if (ticker.toUpperCase() !== 'AAPL') return [];

  return AAPL_CANDLES.filter((c) => {
    if (dateFrom && c.date < dateFrom) return false;
    if (dateTo && c.date > dateTo) return false;
    return true;
  });
}

module.exports = { getCandles, AAPL_CANDLES };
