import { useNavigate } from "react-router-dom";

export default function StrategyCard({ strategy, onDelete }) {
  const navigate = useNavigate();

  const updated = new Date(strategy.updated_at).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "18px 20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {strategy.name}
        </h3>
        <p style={{ fontSize: 12, color: "#888" }}>Оновлено: {updated}</p>
        {strategy.description && (
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            {strategy.description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => navigate(`/strategies/${strategy.id}`)}
          style={{ background: "#4a90e2", color: "#fff", flex: 1 }}
        >
          Редагувати
        </button>
        <button
          onClick={() => navigate(`/strategies/${strategy.id}/backtest`)}
          style={{ background: "#48bb78", color: "#fff", flex: 1 }}
        >
          Бектест
        </button>
        <button
          onClick={() => onDelete(strategy)}
          style={{ background: "#fc8181", color: "#fff", flex: 1 }}
        >
          Видалити
        </button>
      </div>
    </div>
  );
}
