/**
 * Technical indicator computation functions.
 * All functions accept an array of closing prices and return an array of equal length.
 * Positions where insufficient data is available are filled with NaN.
 */

function computeSMA(closes, period) {
  const result = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += closes[j];
    }
    result[i] = sum / period;
  }
  return result;
}

function computeEMA(closes, period) {
  const result = new Array(closes.length).fill(NaN);
  if (closes.length < period) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let ema = sum / period;
  result[period - 1] = ema;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

/**
 * RSI using Wilder's smoothing method.
 * Returns NaN for the first `period` values (need period+1 candles for first RSI).
 */
function computeRSI(closes, period) {
  const result = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }
  return result;
}

/**
 * MACD: EMA(fast) - EMA(slow); signal = EMA(macdLine, signalPeriod).
 * Returns { macdLine, signal, histogram } — all length-aligned with closes, NaN where unavailable.
 */
function computeMACD(closes, fastPeriod, slowPeriod, signalPeriod) {
  const fastEMA = computeEMA(closes, fastPeriod);
  const slowEMA = computeEMA(closes, slowPeriod);

  const macdLine = closes.map((_, i) =>
    !isNaN(fastEMA[i]) && !isNaN(slowEMA[i]) ? fastEMA[i] - slowEMA[i] : NaN,
  );

  const validStartIdx = macdLine.findIndex((v) => !isNaN(v));
  const signal = new Array(closes.length).fill(NaN);
  const histogram = new Array(closes.length).fill(NaN);

  if (validStartIdx !== -1) {
    const validMacd = macdLine.slice(validStartIdx);
    const signalRaw = computeEMA(validMacd, signalPeriod);

    for (let i = 0; i < signalRaw.length; i++) {
      signal[validStartIdx + i] = signalRaw[i];
    }

    for (let i = 0; i < closes.length; i++) {
      if (!isNaN(macdLine[i]) && !isNaN(signal[i])) {
        histogram[i] = macdLine[i] - signal[i];
      }
    }
  }

  return { macdLine, signal, histogram };
}

/**
 * Bollinger Bands: { upper: SMA + k*std, middle: SMA, lower: SMA - k*std }.
 * Returns NaN for the first `period-1` values.
 */
function computeBollinger(closes, period, stdDev) {
  const middle = computeSMA(closes, period);
  const upper = new Array(closes.length).fill(NaN);
  const lower = new Array(closes.length).fill(NaN);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance =
      slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }

  return { middle, upper, lower };
}

module.exports = {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollinger,
};
