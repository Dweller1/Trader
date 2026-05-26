import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EquityCurveChart({ equityCurve }) {
  if (!equityCurve || equityCurve.length === 0) return null;

  const data = equityCurve.map((value, i) => ({ index: i, value: +value.toFixed(2) }));

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#2d3748' }}>
        Крива капіталу
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 20, bottom: 4, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11 }}
            label={{ value: 'Свічка', position: 'insideBottomRight', offset: -6, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <Tooltip
            formatter={(v) => [`$${v.toLocaleString()}`, 'Капітал']}
            labelFormatter={(i) => `Свічка ${i}`}
          />
          <Line
            type="monotone" dataKey="value"
            stroke="#4a90e2" strokeWidth={2} dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
