import { useReactFlow } from '@xyflow/react';
import BaseNode from './BaseNode';

export default function SMANode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode title="SMA" borderColor="#DAE8FC">
      <label>
        Період:{' '}
        <input className="node-input nodrag" type="number"
          value={data.period ?? 14}
          onChange={(e) => updateNodeData(id, { period: +e.target.value })} />
      </label>
    </BaseNode>
  );
}
