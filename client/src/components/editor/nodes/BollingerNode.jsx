import { useReactFlow } from '@xyflow/react';
import BaseNode from './BaseNode';

export default function BollingerNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const upd = (key) => (e) => updateNodeData(id, { [key]: +e.target.value });
  return (
    <BaseNode title="Bollinger Bands" borderColor="#DAE8FC">
      <label>Період: <input className="node-input nodrag" type="number" value={data.period ?? 20} onChange={upd('period')} /></label><br />
      <label>Std Dev: <input className="node-input nodrag" type="number" value={data.stdDev ?? 2} onChange={upd('stdDev')} /></label>
    </BaseNode>
  );
}
