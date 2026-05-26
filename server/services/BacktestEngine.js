const {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollinger,
} = require("./IndicatorEngine");
const { topologicalSort } = require("./GraphInterpreter");
const {
  calcTotalReturn,
  calcMaxDrawdown,
  calcSharpeRatio,
  calcWinRate,
  calcTotalTrades,
} = require("./MetricsCalculator");

/**
 * Pre-compute all indicator nodes.
 * MACD and Bollinger store their full multi-series objects so individual
 * series can be selected via sourceHandle when routing edges.
 *
 * @param {object[]} nodes
 * @param {string[]} sortedIds
 * @param {number[]} closes
 * @returns {Object.<string, number[]|{macdLine,signal,histogram}|{middle,upper,lower}>}
 */
function computeAllIndicators(nodes, sortedIds, closes) {
  const outputs = {};

  for (const nodeId of sortedIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const p = node.data || node.params || {};

    switch (node.type) {
      case "SMA":
        outputs[nodeId] = computeSMA(closes, p.period || 14);
        break;
      case "EMA":
        outputs[nodeId] = computeEMA(closes, p.period || 14);
        break;
      case "RSI":
        outputs[nodeId] = computeRSI(closes, p.period || 14);
        break;
      case "MACD":
        outputs[nodeId] = computeMACD(
          closes,
          p.fastPeriod || 12,
          p.slowPeriod || 26,
          p.signalPeriod || 9,
        );
        break;
      case "BOLLINGER":
        outputs[nodeId] = computeBollinger(
          closes,
          p.period || 20,
          p.stdDev || 2,
        );
        break;
      default:
        break;
    }
  }

  return outputs;
}

/**
 * Read one value from a node's output at a given candle index.
 * Handles single-series (SMA/EMA/RSI) and multi-series (MACD/Bollinger) nodes.
 * The `sourceHandle` selects a sub-series for multi-output nodes:
 *   MACD    → 'macd' (default), 'signal', 'histogram'
 *   Bollinger → 'middle' (default), 'upper', 'lower'
 *
 * @param {*} output   value from computeAllIndicators[nodeId]
 * @param {string} sourceHandle
 * @param {number} index
 * @returns {number}
 */
function readOutput(output, sourceHandle, index) {
  if (output === undefined) return NaN;

  if (Array.isArray(output)) {
    const v = output[index];
    return v === undefined ? NaN : v;
  }

  if (typeof output === "object" && output !== null) {
    if ("macdLine" in output) {
      const series =
        sourceHandle === "signal"
          ? output.signal
          : sourceHandle === "histogram"
            ? output.histogram
            : output.macdLine;
      const v = series[index];
      return v === undefined ? NaN : v;
    }
    if ("upper" in output) {
      const series =
        sourceHandle === "upper"
          ? output.upper
          : sourceHandle === "lower"
            ? output.lower
            : output.middle;
      const v = series[index];
      return v === undefined ? NaN : v;
    }
  }

  return NaN;
}

/**
 * Evaluate a CrossAbove or CrossBelow condition node at candle index i.
 *
 * Edges into the node carry `targetHandle` to distinguish the two inputs:
 *   targetHandle === 'input1'  (or first edge if no handle) → value1
 *   targetHandle === 'input2'  (or second edge)             → value2
 *
 * CrossAbove: prevValue1 < prevValue2 AND currentValue1 > currentValue2
 * CrossBelow: prevValue1 > prevValue2 AND currentValue1 < currentValue2
 *
 * @param {string} type  'CrossAbove' | 'CrossBelow'
 * @param {object[]} inEdges
 * @param {object} indicatorOutputs
 * @param {number} i
 * @returns {boolean}
 */
function evalCrossNode(type, inEdges, indicatorOutputs, i) {
  if (i < 1 || inEdges.length < 2) return false;

  const edge1 =
    inEdges.find((e) => !e.targetHandle || e.targetHandle === "input1") ||
    inEdges[0];
  const edge2 =
    inEdges.find((e) => e.targetHandle === "input2") ||
    inEdges.find((e) => e !== edge1) ||
    inEdges[1];

  if (!edge1 || !edge2 || edge1 === edge2) return false;

  const v1c = readOutput(indicatorOutputs[edge1.source], edge1.sourceHandle, i);
  const v1p = readOutput(
    indicatorOutputs[edge1.source],
    edge1.sourceHandle,
    i - 1,
  );
  const v2c = readOutput(indicatorOutputs[edge2.source], edge2.sourceHandle, i);
  const v2p = readOutput(
    indicatorOutputs[edge2.source],
    edge2.sourceHandle,
    i - 1,
  );

  if (isNaN(v1c) || isNaN(v1p) || isNaN(v2c) || isNaN(v2p)) return false;

  if (type === "CrossAbove") return v1p < v2p && v1c > v2c;
  if (type === "CrossBelow") return v1p > v2p && v1c < v2c;
  return false;
}

/**
 * Evaluate all condition nodes and return a boolean map for candle i.
 *
 * @param {object[]} nodes
 * @param {string[]} sortedIds
 * @param {object[]} edges
 * @param {object} indicatorOutputs
 * @param {number} i
 * @returns {Object.<string, boolean>}
 */
function evalConditions(nodes, sortedIds, edges, indicatorOutputs, i) {
  const results = {};

  for (const nodeId of sortedIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    if (node.type === "CrossAbove" || node.type === "CrossBelow") {
      const inEdges = edges.filter((e) => e.target === nodeId);
      results[nodeId] = evalCrossNode(node.type, inEdges, indicatorOutputs, i);
    }
  }

  return results;
}

/**
 * Check if a BuySignal or SellSignal node fires at candle i.
 * All incoming condition edges must evaluate to true (AND logic).
 *
 * @param {string} signalNodeId
 * @param {object[]} edges
 * @param {Object.<string, boolean>} conditionResults
 * @returns {boolean}
 */
function evalSignalNode(signalNodeId, edges, conditionResults) {
  const inEdges = edges.filter((e) => e.target === signalNodeId);
  if (inEdges.length === 0) return false;
  return inEdges.every((e) => conditionResults[e.source] === true);
}

/**
 * Event-driven backtest simulation.
 *
 * Graph evaluation per candle:
 *   1. Read pre-computed indicator outputs
 *   2. Evaluate CrossAbove/CrossBelow condition nodes
 *   3. Activate BuySignal/SellSignal if all upstream conditions are true
 *   4. Open long if BuySignal and no open position
 *   5. Close long if SellSignal and position open
 *      PnL = (closePrice - openPrice) * shares - commission
 *   6. Append current equity to equityCurve
 *   7. Call onProgress(percent, equityCurve) every 1%
 *
 * @param {object} graphData    - { nodes: [], edges: [] }
 * @param {object[]} candles    - [{ open, high, low, close, volume, timestamp }]
 * @param {object} params       - { initialCapital, commission }
 * @param {function} onProgress - (percent: number, equityCurve: number[]) => void
 * @returns {Promise<{totalReturn, sharpeRatio, maxDrawdown, winRate, totalTrades, equityCurve}>}
 */
async function run(graphData, candles, params, onProgress) {
  const initialCapital =
    params && params.initialCapital != null ? params.initialCapital : 10000;
  const commission =
    params && params.commission != null ? params.commission : 0;

  const nodes = (graphData && graphData.nodes) || [];
  const edges = (graphData && graphData.edges) || [];

  let sortedIds;
  try {
    sortedIds = topologicalSort(nodes, edges);
  } catch (_) {
    sortedIds = nodes.map((n) => n.id);
  }

  const closes = candles.map((c) => c.close);
  const indicatorOutputs = computeAllIndicators(nodes, sortedIds, closes);

  const buySignalNodeIds = nodes
    .filter((n) => n.type === "BuySignal")
    .map((n) => n.id);
  const sellSignalNodeIds = nodes
    .filter((n) => n.type === "SellSignal")
    .map((n) => n.id);

  let capital = initialCapital;
  let position = null;
  const trades = [];
  const equityCurve = [initialCapital];
  const totalCandles = candles.length;
  let lastReportedPercent = 0;

  for (let i = 1; i < totalCandles; i++) {
    const candle = candles[i];

    const percent = Math.floor((i / totalCandles) * 100);
    if (percent >= lastReportedPercent + 1) {
      lastReportedPercent = percent;
      if (typeof onProgress === "function") {
        onProgress(percent, equityCurve.slice());
      }
    }

    const conditionResults = evalConditions(
      nodes,
      sortedIds,
      edges,
      indicatorOutputs,
      i,
    );

    const buySignal =
      buySignalNodeIds.length > 0 &&
      buySignalNodeIds.some((id) =>
        evalSignalNode(id, edges, conditionResults),
      );

    const sellSignal =
      sellSignalNodeIds.length > 0 &&
      sellSignalNodeIds.some((id) =>
        evalSignalNode(id, edges, conditionResults),
      );

    if (buySignal && !position) {
      const openPrice = candle.close;
      const shares = Math.floor(capital / openPrice);
      if (shares > 0) {
        capital -= openPrice * shares;
        position = { shares, openPrice, entryIndex: i };
      }
    } else if (sellSignal && position) {
      const closePrice = candle.close;
      const pnl =
        (closePrice - position.openPrice) * position.shares - commission;
      capital += closePrice * position.shares;
      trades.push({ entryIndex: position.entryIndex, exitIndex: i, pnl });
      position = null;
    }

    const currentEquity = position
      ? capital + position.shares * candle.close
      : capital;
    equityCurve.push(currentEquity);
  }

  if (position && candles.length > 0) {
    const closePrice = candles[candles.length - 1].close;
    const pnl =
      (closePrice - position.openPrice) * position.shares - commission;
    capital += closePrice * position.shares;
    trades.push({
      entryIndex: position.entryIndex,
      exitIndex: candles.length - 1,
      pnl,
    });
    equityCurve[equityCurve.length - 1] = capital;
  }

  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i - 1] !== 0) {
      returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
    }
  }

  return {
    totalReturn: calcTotalReturn(initialCapital, capital),
    sharpeRatio: calcSharpeRatio(returns),
    maxDrawdown: calcMaxDrawdown(equityCurve),
    winRate: calcWinRate(trades),
    totalTrades: calcTotalTrades(trades),
    equityCurve,
  };
}

module.exports = { run };
