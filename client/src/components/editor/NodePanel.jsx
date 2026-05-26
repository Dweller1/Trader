const GROUPS = [
  {
    label: 'Індикатори',
    color: '#DAE8FC',
    nodes: [
      { type: 'SMA', label: 'SMA' },
      { type: 'EMA', label: 'EMA' },
      { type: 'RSI', label: 'RSI' },
      { type: 'MACD', label: 'MACD' },
      { type: 'BOLLINGER', label: 'Bollinger Bands' },
    ],
  },
  {
    label: 'Умови',
    color: '#FFF2CC',
    nodes: [
      { type: 'CrossAbove', label: 'Cross Above ↑' },
      { type: 'CrossBelow', label: 'Cross Below ↓' },
    ],
  },
  {
    label: 'Дії',
    color: '#D5E8D4',
    nodes: [
      { type: 'BuySignal', label: '🟢 Сигнал покупки' },
      { type: 'SellSignal', label: '🔴 Сигнал продажу' },
    ],
  },
];

export default function NodePanel() {
  return (
    <div style={{
      width: 188, flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e0e0e0', overflowY: 'auto', padding: '12px 10px',
    }}>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>Перетягніть вузол на полотно</p>
      {GROUPS.map((g) => (
        <div key={g.label} style={{ marginBottom: 18 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
          }}>
            {g.label}
          </p>
          {g.nodes.map((n) => (
            <div
              key={n.type}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', n.type)}
              style={{
                padding: '7px 10px', marginBottom: 5,
                border: `1.5px solid ${g.color}`,
                borderRadius: 6, fontSize: 12,
                cursor: 'grab', background: `${g.color}88`,
                userSelect: 'none',
              }}
            >
              {n.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
