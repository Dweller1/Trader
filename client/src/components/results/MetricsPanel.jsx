const fmt = (v, decimals = 2) =>
  v == null ? "—" : Number(v).toFixed(decimals);

function cardStyle(type, num) {
  if (type === "return") {
    return num >= 0
      ? { color: "#276749", bg: "#f0fff4" }
      : { color: "#c53030", bg: "#fff5f5" };
  }
  if (type === "sharpe") {
    if (num > 1) return { color: "#276749", bg: "#f0fff4" };
    if (num >= 0) return { color: "#744210", bg: "#fefcbf" };
    return { color: "#c53030", bg: "#fff5f5" };
  }
  if (type === "drawdown") return { color: "#c53030", bg: "#fff5f5" };
  return { color: "#2d3748", bg: "#fff" };
}

function MetricCard({ label, value, type }) {
  const num = parseFloat(value);
  const { color, bg } = cardStyle(type, isNaN(num) ? 0 : num);
  return (
    <div
      style={{
        background: bg,
        borderRadius: 8,
        padding: "14px 18px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#718096",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export default function MetricsPanel({ result }) {
  if (!result) return null;
  const ret = result.total_return ?? result.totalReturn;
  const sharpe = result.sharpe_ratio ?? result.sharpeRatio;
  const dd = result.max_drawdown ?? result.maxDrawdown;
  const winRate = result.win_rate ?? result.winRate;
  const trades = result.total_trades ?? result.totalTrades;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 14,
      }}
    >
      <MetricCard
        label="Загальна прибутковість"
        value={`${fmt(ret)}%`}
        type="return"
      />
      <MetricCard
        label="Максимальна просадка"
        value={`${fmt(dd)}%`}
        type="drawdown"
      />
      <MetricCard label="Коефіцієнт Шарпа" value={fmt(sharpe)} type="sharpe" />
      <MetricCard
        label="Відсоток прибуткових угод"
        value={`${fmt(winRate)}%`}
        type="winRate"
      />
      <MetricCard
        label="Загальна кількість угод"
        value={fmt(trades, 0)}
        type="trades"
      />
    </div>
  );
}
