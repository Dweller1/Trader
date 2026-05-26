import { useReactFlow } from '@xyflow/react';
import BaseNode from './BaseNode';

export default function MACDNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const upd = (key) => (e) => updateNodeData(id, { [key]: +e.target.value });
  return (
    <BaseNode title="MACD" borderColor="#DAE8FC">
      <label>Швидкий: <input className="node-input nodrag" type="number" value={data.fastPeriod ?? 12} onChange={upd('fastPeriod')} /></label><br />
      <label>Повільний: <input className="node-input nodrag" type="number" value={data.slowPeriod ?? 26} onChange={upd('slowPeriod')} /></label><br />
      <label>Сигнал: <input className="node-input nodrag" type="number" value={data.signalPeriod ?? 9} onChange={upd('signalPeriod')} /></label>
    </BaseNode>
  );
}
