import { useReactFlow } from '@xyflow/react';
import BaseNode from './BaseNode';

export default function RSINode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const upd = (key) => (e) => updateNodeData(id, { [key]: +e.target.value });
  return (
    <BaseNode title="RSI" borderColor="#DAE8FC">
      <label>Період: <input className="node-input nodrag" type="number" value={data.period ?? 14} onChange={upd('period')} /></label><br />
      <label>Перекуп.: <input className="node-input nodrag" type="number" value={data.overbought ?? 70} onChange={upd('overbought')} /></label><br />
      <label>Перепрод.: <input className="node-input nodrag" type="number" value={data.oversold ?? 30} onChange={upd('oversold')} /></label>
    </BaseNode>
  );
}
