import { useNodes, useReactFlow } from '@xyflow/react';

const CONFIGS = {
  SMA:      [{ key: 'period',       label: 'Період',    def: 14 }],
  EMA:      [{ key: 'period',       label: 'Період',    def: 14 }],
  RSI:      [
    { key: 'period',     label: 'Період',    def: 14 },
    { key: 'overbought', label: 'Перекупленість', def: 70 },
    { key: 'oversold',   label: 'Перепроданість', def: 30 },
  ],
  MACD:     [
    { key: 'fastPeriod',   label: 'Швидкий EMA', def: 12 },
    { key: 'slowPeriod',   label: 'Повільний EMA', def: 26 },
    { key: 'signalPeriod', label: 'Сигнальний',   def: 9  },
  ],
  BOLLINGER: [
    { key: 'period', label: 'Період', def: 20 },
    { key: 'stdDev', label: 'Std Dev', def: 2  },
  ],
};

const s = {
  panel: {
    width: 210, flexShrink: 0, background: '#fafafa',
    borderLeft: '1px solid #e0e0e0', padding: 16, overflowY: 'auto',
  },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#2d3748' },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 12, fontSize: 13, color: '#555' },
  input: { marginTop: 5, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 5, fontSize: 13 },
  empty: { fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 40 },
};

export default function ParamsPanel({ selectedNodeId }) {
  const nodes = useNodes();
  const { updateNodeData } = useReactFlow();
  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;

  if (!node) {
    return (
      <div style={s.panel}>
        <p style={s.empty}>Оберіть вузол<br />для редагування</p>
      </div>
    );
  }

  const fields = CONFIGS[node.type] ?? [];

  return (
    <div style={s.panel}>
      <div style={s.title}>{node.type}</div>
      {fields.length === 0 && (
        <p style={{ fontSize: 12, color: '#888' }}>Цей вузол не має параметрів</p>
      )}
      {fields.map((f) => (
        <label key={f.key} style={s.field}>
          {f.label}
          <input
            style={s.input}
            type="number"
            value={node.data[f.key] ?? f.def}
            onChange={(e) => updateNodeData(node.id, { [f.key]: +e.target.value })}
          />
        </label>
      ))}
    </div>
  );
}
