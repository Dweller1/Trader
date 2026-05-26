import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState, addEdge, useReactFlow,
} from '@xyflow/react';
import SMANode from './nodes/SMANode';
import EMANode from './nodes/EMANode';
import RSINode from './nodes/RSINode';
import MACDNode from './nodes/MACDNode';
import BollingerNode from './nodes/BollingerNode';
import CrossAboveNode from './nodes/CrossAboveNode';
import CrossBelowNode from './nodes/CrossBelowNode';
import BuySignalNode from './nodes/BuySignalNode';
import SellSignalNode from './nodes/SellSignalNode';

const NODE_TYPES = {
  SMA: SMANode, EMA: EMANode, RSI: RSINode, MACD: MACDNode,
  BOLLINGER: BollingerNode, CrossAbove: CrossAboveNode,
  CrossBelow: CrossBelowNode, BuySignal: BuySignalNode, SellSignal: SellSignalNode,
};

const NODE_DEFAULTS = {
  SMA: { period: 14 }, EMA: { period: 14 },
  RSI: { period: 14, overbought: 70, oversold: 30 },
  MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  BOLLINGER: { period: 20, stdDev: 2 },
  CrossAbove: {}, CrossBelow: {}, BuySignal: {}, SellSignal: {},
};

const StrategyCanvas = forwardRef(function StrategyCanvas(
  { initialNodes = [], initialEdges = [], onNodeSelect },
  ref
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useImperativeHandle(ref, () => ({
    getGraphData: () => ({ nodes: nodesRef.current, edges: edgesRef.current }),
    resetGraph: (ns, es) => { setNodes(ns); setEdges(es); },
  }));

  const onConnect = useCallback(
    (params) => setEdges((es) => addEdge(params, es)),
    [setEdges]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((ns) => [
        ...ns,
        { id: crypto.randomUUID(), type, position, data: { ...NODE_DEFAULTS[type] } },
      ]);
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes: sel }) => onNodeSelect?.(sel[0]?.id ?? null),
    [onNodeSelect]
  );

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onSelectionChange={onSelectionChange}
      fitView
      style={{ flex: 1 }}
    >
      <Background gap={16} />
      <Controls />
    </ReactFlow>
  );
});

export default StrategyCanvas;
