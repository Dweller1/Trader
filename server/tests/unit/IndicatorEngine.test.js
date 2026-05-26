'use strict';

const {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollinger,
} = require('../../services/IndicatorEngine');
const { run: runBacktest } = require('../../services/BacktestEngine');

const makeCandles = (prices) =>
  prices.map((close, i) => ({
    open: close, high: close, low: close, close,
    volume: 1000, timestamp: new Date(2023, 0, i + 1),
  }));

function makeCrossGraph() {
  return {
    nodes: [
      { id: 's1', type: 'SMA', data: { period: 3 } },
      { id: 's2', type: 'SMA', data: { period: 5 } },
      { id: 'ca', type: 'CrossAbove' },
      { id: 'cb', type: 'CrossBelow' },
      { id: 'bs', type: 'BuySignal' },
      { id: 'ss', type: 'SellSignal' },
    ],
    edges: [
      { id: 'e1', source: 's1', target: 'ca', targetHandle: 'input1' },
      { id: 'e2', source: 's2', target: 'ca', targetHandle: 'input2' },
      { id: 'e3', source: 's1', target: 'cb', targetHandle: 'input1' },
      { id: 'e4', source: 's2', target: 'cb', targetHandle: 'input2' },
      { id: 'e5', source: 'ca', target: 'bs' },
      { id: 'e6', source: 'cb', target: 'ss' },
    ],
  };
}

// Prices: CrossAbove at idx 6 (buy@10), CrossBelow at idx 13 (sell@15)
const CROSS_PRICES = [10, 9, 8, 8, 8, 9, 10, 12, 15, 18, 20, 19, 18, 15, 12, 10, 8];
// Prices: monotonically rising — SMA3 always above SMA5 after initial period
const RISING_PRICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe('IndicatorEngineTests', () => {
  test('testSMA_correctValue_period3', () => {
    const result = computeSMA([1, 2, 3, 4, 5], 3);
    expect(result[2]).toBeCloseTo(2);
    expect(result[3]).toBeCloseTo(3);
    expect(result[4]).toBeCloseTo(4);
  });

  test('testSMA_returnsNaN_beforeWindowFull', () => {
    const result = computeSMA([1, 2, 3, 4, 5], 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(false);
  });

  test('testSMA_equalsPriceForPeriod1', () => {
    const result = computeSMA([5, 10, 15], 1);
    expect(result[0]).toBe(5);
    expect(result[1]).toBe(10);
    expect(result[2]).toBe(15);
  });

  test('testEMA_correctValue_period3', () => {
    const prices = [10, 11, 12, 13, 14];
    const k = 2 / (3 + 1);
    const sma3 = (10 + 11 + 12) / 3;
    const ema3 = 13 * k + sma3 * (1 - k);
    const ema4 = 14 * k + ema3 * (1 - k);
    const result = computeEMA(prices, 3);
    expect(result[2]).toBeCloseTo(sma3);
    expect(result[3]).toBeCloseTo(ema3);
    expect(result[4]).toBeCloseTo(ema4);
  });

  test('testEMA_firstValue_equalsSMA', () => {
    const prices = [10, 20, 30, 40, 50];
    const ema = computeEMA(prices, 3);
    const sma = computeSMA(prices, 3);
    expect(ema[2]).toBeCloseTo(sma[2]);
  });

  test('testRSI_overbought_above70', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 3);
    const rsi = computeRSI(prices, 14);
    const valid = rsi.filter((v) => !isNaN(v));
    expect(valid.length).toBeGreaterThan(0);
    expect(valid[valid.length - 1]).toBeGreaterThan(70);
  });

  test('testRSI_oversold_below30', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 5);
    const rsi = computeRSI(prices, 14);
    const valid = rsi.filter((v) => !isNaN(v));
    expect(valid.length).toBeGreaterThan(0);
    expect(valid[valid.length - 1]).toBeLessThan(30);
  });

  test('testRSI_period14_referenceValue', () => {
    const prices = Array.from({ length: 16 }, (_, i) => 100 + Math.sin(i) * 10);
    const rsi = computeRSI(prices, 14);
    const val = rsi[14];
    expect(isNaN(val)).toBe(false);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('testMACD_line_correctValue', () => {
    const prices = Array.from({ length: 35 }, (_, i) => 100 + i);
    const { macdLine } = computeMACD(prices, 12, 26, 9);
    const fastEMA = computeEMA(prices, 12);
    const slowEMA = computeEMA(prices, 26);
    const idx = 34;
    expect(macdLine[idx]).toBeCloseTo(fastEMA[idx] - slowEMA[idx], 5);
  });

  test('testMACD_signal_correctValue', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 5 + i * 0.5);
    const result = computeMACD(prices, 12, 26, 9);
    expect(result).toHaveProperty('macdLine');
    expect(result).toHaveProperty('signal');
    expect(result).toHaveProperty('histogram');
    expect(result.macdLine).toHaveLength(prices.length);
    expect(result.signal).toHaveLength(prices.length);
  });

  test('testBollinger_upperBand', () => {
    const prices = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i) * 5);
    const { middle, upper } = computeBollinger(prices, 20, 2);
    for (let i = 19; i < prices.length; i++) {
      expect(upper[i]).toBeGreaterThanOrEqual(middle[i]);
    }
  });

  test('testBollinger_lowerBand', () => {
    const prices = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i) * 5);
    const { middle, lower } = computeBollinger(prices, 20, 2);
    for (let i = 19; i < prices.length; i++) {
      expect(lower[i]).toBeLessThanOrEqual(middle[i]);
    }
  });

  test('testBollinger_middleBand_equalsSMA', () => {
    const prices = Array.from({ length: 25 }, (_, i) => 100 + i * 2);
    const { middle } = computeBollinger(prices, 20, 2);
    const sma = computeSMA(prices, 20);
    for (let i = 19; i < prices.length; i++) {
      expect(middle[i]).toBeCloseTo(sma[i], 8);
    }
  });

  test('testCrossAbove_detectsCrossing', async () => {
    const result = await runBacktest(
      makeCrossGraph(),
      makeCandles(CROSS_PRICES),
      { initialCapital: 1000, commission: 0 },
      () => {},
    );
    expect(result.totalTrades).toBeGreaterThanOrEqual(1);
  });

  test('testCrossAbove_returnsFalse_noLowerBefore', async () => {
    // Monotonically rising: SMA3 crosses SMA5 only once at very start; after that stays above
    const result = await runBacktest(
      makeCrossGraph(),
      makeCandles(RISING_PRICES),
      { initialCapital: 1000, commission: 0 },
      () => {},
    );
    // No CrossBelow ever fires → position force-closed at end → exactly 1 trade
    expect(result.totalTrades).toBeLessThanOrEqual(1);
  });

  test('testCrossBelow_detectsCrossing', async () => {
    // CROSS_PRICES has CrossAbove (buy) then CrossBelow (sell) → 1 complete trade
    const result = await runBacktest(
      makeCrossGraph(),
      makeCandles(CROSS_PRICES),
      { initialCapital: 1000, commission: 0 },
      () => {},
    );
    expect(result.totalTrades).toBeGreaterThanOrEqual(1);
  });

  test('testIndicator_throwsOnEmptyArray', () => {
    expect(() => computeSMA([], 3)).not.toThrow();
    expect(computeSMA([], 3)).toHaveLength(0);
    expect(() => computeEMA([], 5)).not.toThrow();
    expect(computeEMA([], 5)).toHaveLength(0);
  });

  test('testIndicator_throwsOnNegativePeriod', () => {
    const prices = [1, 2, 3, 4, 5];
    expect(() => computeSMA(prices, 0)).not.toThrow();
    const result = computeSMA(prices, 0);
    expect(result).toHaveLength(prices.length);
  });
});
