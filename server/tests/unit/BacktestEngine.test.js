'use strict';

const { run } = require('../../services/BacktestEngine');

const makeCandles = (prices) =>
  prices.map((close, i) => ({
    open: close, high: close, low: close, close,
    volume: 1000, timestamp: new Date(2023, 0, i + 1),
  }));

function makeFullGraph() {
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

// SMA(3) crosses above SMA(5) at idx 6 (price=10), crosses below at idx 13 (price=15) → PROFIT
const PROFITABLE_PRICES = [10, 9, 8, 8, 8, 9, 10, 12, 15, 18, 20, 19, 18, 15, 12, 10, 8];
// SMA(3) crosses above at idx 8 (price=15), crosses below at idx 12 (price=5) → LOSS
const LOSS_PRICES = [10, 10, 10, 10, 10, 5, 5, 5, 15, 15, 15, 15, 5, 5, 5, 5];

const BASE_PARAMS = { initialCapital: 10000, commission: 0 };

describe('BacktestEngineTests', () => {
  test('testBacktest_openPosition_onBuySignal', async () => {
    const buyOnlyGraph = {
      nodes: [
        { id: 's1', type: 'SMA', data: { period: 3 } },
        { id: 's2', type: 'SMA', data: { period: 5 } },
        { id: 'ca', type: 'CrossAbove' },
        { id: 'bs', type: 'BuySignal' },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'ca', targetHandle: 'input1' },
        { id: 'e2', source: 's2', target: 'ca', targetHandle: 'input2' },
        { id: 'e5', source: 'ca', target: 'bs' },
      ],
    };
    const result = await run(buyOnlyGraph, makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    // CrossAbove fires → position opens → force-closed at end → 1 trade
    expect(result.totalTrades).toBeGreaterThanOrEqual(1);
  });

  test('testBacktest_closePosition_onSellSignal', async () => {
    const result = await run(makeFullGraph(), makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    expect(result.totalTrades).toBeGreaterThanOrEqual(1);
  });

  test('testBacktest_noDoubleOpen', async () => {
    const result = await run(makeFullGraph(), makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    // Capital should never go below 0 (no double open spending capital twice)
    expect(Math.min(...result.equityCurve)).toBeGreaterThanOrEqual(0);
  });

  test('testBacktest_noCloseWithoutOpen', async () => {
    const sellOnlyGraph = {
      nodes: [
        { id: 's1', type: 'SMA', data: { period: 3 } },
        { id: 's2', type: 'SMA', data: { period: 5 } },
        { id: 'cb', type: 'CrossBelow' },
        { id: 'ss', type: 'SellSignal' },
      ],
      edges: [
        { id: 'e3', source: 's1', target: 'cb', targetHandle: 'input1' },
        { id: 'e4', source: 's2', target: 'cb', targetHandle: 'input2' },
        { id: 'e6', source: 'cb', target: 'ss' },
      ],
    };
    const result = await run(sellOnlyGraph, makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    expect(result.totalTrades).toBe(0);
  });

  test('testBacktest_pnl_positive_scenario', async () => {
    const result = await run(makeFullGraph(), makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    expect(result.totalReturn).toBeGreaterThan(0);
  });

  test('testBacktest_pnl_negative_scenario', async () => {
    const result = await run(makeFullGraph(), makeCandles(LOSS_PRICES), BASE_PARAMS, () => {});
    expect(result.totalReturn).toBeLessThan(0);
  });

  test('testBacktest_commission_deducted', async () => {
    const noComm = await run(
      makeFullGraph(), makeCandles(PROFITABLE_PRICES),
      { initialCapital: 10000, commission: 0 }, () => {},
    );
    const highComm = await run(
      makeFullGraph(), makeCandles(PROFITABLE_PRICES),
      { initialCapital: 10000, commission: 1e9 }, () => {},
    );
    // Without commission profitable trade → winRate > 0
    expect(noComm.winRate).toBeGreaterThan(0);
    // With huge commission same trade → pnl < 0 → winRate = 0
    expect(highComm.winRate).toBe(0);
  });

  test('testBacktest_equityCurveLength', async () => {
    const candles = makeCandles(PROFITABLE_PRICES);
    const result = await run(makeFullGraph(), candles, BASE_PARAMS, () => {});
    expect(result.equityCurve).toHaveLength(candles.length);
  });

  test('testBacktest_equityIncreases_onProfit', async () => {
    const result = await run(makeFullGraph(), makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    const finalEquity = result.equityCurve[result.equityCurve.length - 1];
    expect(finalEquity).toBeGreaterThan(BASE_PARAMS.initialCapital);
  });

  test('testBacktest_equityDecreases_onLoss', async () => {
    const result = await run(makeFullGraph(), makeCandles(LOSS_PRICES), BASE_PARAMS, () => {});
    const finalEquity = result.equityCurve[result.equityCurve.length - 1];
    expect(finalEquity).toBeLessThan(BASE_PARAMS.initialCapital);
  });

  test('testBacktest_multipleRounds', async () => {
    // Extended prices with two CrossAbove/CrossBelow cycles
    const prices = [
      10, 9, 8, 8, 8, 9, 10, 12, 15, 18, 20, 19, 18, 15, 12, 10, 8,
      8, 8, 9, 10, 12, 15, 18, 20, 20, 18, 15, 12, 10, 8, 7,
    ];
    const result = await run(makeFullGraph(), makeCandles(prices), BASE_PARAMS, () => {});
    expect(result.totalTrades).toBeGreaterThanOrEqual(1);
  });

  test('testBacktest_emptyGraph_noTrades', async () => {
    const result = await run({ nodes: [], edges: [] }, makeCandles(PROFITABLE_PRICES), BASE_PARAMS, () => {});
    expect(result.totalTrades).toBe(0);
  });

  test('testBacktest_progressCallback_called', async () => {
    const onProgress = jest.fn();
    await run(makeFullGraph(), makeCandles(PROFITABLE_PRICES), BASE_PARAMS, onProgress);
    expect(onProgress).toHaveBeenCalled();
    const calls = onProgress.mock.calls;
    calls.forEach(([pct]) => {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  test('testBacktest_allCandlesProcessed', async () => {
    const candles = makeCandles(PROFITABLE_PRICES);
    const result = await run(makeFullGraph(), candles, BASE_PARAMS, () => {});
    expect(result.equityCurve).toHaveLength(candles.length);
  });
});
