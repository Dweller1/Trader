import { Handle, Position } from '@xyflow/react';

export default function BaseNode({
  title, borderColor = '#aaa', bg = '#fff', children,
  inputs = [{ id: 'input' }], outputs = [{ id: 'output' }],
}) {
  return (
    <div style={{
      border: `2px solid ${borderColor}`, borderRadius: 8,
      padding: '8px 12px', background: bg, minWidth: 158, fontSize: 12, position: 'relative',
    }}>
      {inputs.map((h, i) => (
        <Handle key={h.id} type="target" position={Position.Left} id={h.id}
          style={{ top: inputs.length > 1 ? `${((i + 1) * 100) / (inputs.length + 1)}%` : '50%' }}
        />
      ))}
      <strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>{title}</strong>
      {children}
      {outputs.map((h, i) => (
        <Handle key={h.id} type="source" position={Position.Right} id={h.id}
          style={{ top: outputs.length > 1 ? `${((i + 1) * 100) / (outputs.length + 1)}%` : '50%' }}
        />
      ))}
    </div>
  );
}
