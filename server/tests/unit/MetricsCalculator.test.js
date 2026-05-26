'use strict';

const {
  calcTotalReturn,
  calcMaxDrawdown,
  calcSharpeRatio,
  calcWinRate,
  calcTotalTrades,
} = require('../../services/MetricsCalculator');

describe('MetricsCalculatorTests', () => {
  test('testTotalReturn_positiveScenario', () => {
    expect(calcTotalReturn(10000, 11000)).toBeCloseTo(10.0);
    expect(calcTotalReturn(10000, 12500)).toBeCloseTo(25.0);
    expect(calcTotalReturn(5000, 7500)).toBeCloseTo(50.0);
  });

  test('testTotalReturn_negativeScenario', () => {
    expect(calcTotalReturn(10000, 9000)).toBeCloseTo(-10.0);
    expect(calcTotalReturn(10000, 5000)).toBeCloseTo(-50.0);
  });

  test('testTotalReturn_zeroTrades', () => {
    expect(calcTotalReturn(10000, 10000)).toBeCloseTo(0.0);
    expect(calcTotalReturn(0, 0)).toBe(0);
  });

  test('testMaxDrawdown_singleDip', () => {
    const equity = [10000, 10500, 9000, 9500, 10000];
    // Peak = 10500, lowest after peak = 9000 → dd = (10500-9000)/10500 ≈ 14.29%
    const dd = calcMaxDrawdown(equity);
    expect(dd).toBeCloseTo(14.29, 1);
  });

  test('testMaxDrawdown_multipleDrops', () => {
    const equity = [10000, 11000, 9000, 12000, 8000];
    // Peak = 12000, lowest after = 8000 → dd = (12000-8000)/12000 ≈ 33.33%
    const dd = calcMaxDrawdown(equity);
    expect(dd).toBeCloseTo(33.33, 1);
  });

  test('testMaxDrawdown_noDrawdown', () => {
    const equity = [10000, 11000, 12000, 13000];
    expect(calcMaxDrawdown(equity)).toBe(0);
  });

  test('testSharpeRatio_positiveReturn', () => {
    const returns = [0.01, 0.02, 0.015, 0.01, 0.02, 0.015];
    expect(calcSharpeRatio(returns)).toBeGreaterThan(0);
  });

  test('testSharpeRatio_zeroVolatility', () => {
    // All identical returns → stdDev = 0 → Sharpe = 0
    const returns = [0.01, 0.01, 0.01, 0.01];
    expect(calcSharpeRatio(returns)).toBe(0);
  });

  test('testWinRate_allWins', () => {
    const trades = [{ pnl: 100 }, { pnl: 200 }, { pnl: 50 }];
    expect(calcWinRate(trades)).toBeCloseTo(100.0);
  });

  test('testWinRate_allLosses', () => {
    const trades = [{ pnl: -100 }, { pnl: -50 }, { pnl: -200 }];
    expect(calcWinRate(trades)).toBeCloseTo(0.0);
  });
});
