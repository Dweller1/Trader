import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import MetricsPanel from "../components/results/MetricsPanel";
import EquityCurveChart from "../components/results/EquityCurveChart";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function ResultsPage() {
  const { backtestId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sid = state?.strategyId;
  const effectiveSid = sid ?? result?.strategy_id;

  useEffect(() => {
    if (!sid) {
      setError("Не вдалося визначити стратегію. Поверніться на дашборд.");
      setLoading(false);
      return;
    }
    api
      .get(`/strategies/${sid}/backtest/results/${backtestId}`)
      .then((r) => setResult(r.data))
      .catch(() => setError("Не вдалося завантажити результати бектесту"))
      .finally(() => setLoading(false));
  }, [backtestId, sid]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      <header
        style={{
          background: "#fff",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "#e2e8f0", color: "#4a5568", fontSize: 13 }}
        >
          ← Назад
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Результати бектесту</h1>
        {result && (
          <span style={{ fontSize: 13, color: "#718096", marginLeft: 8 }}>
            {result.ticker} · {result.date_from} — {result.date_to}
          </span>
        )}
      </header>

      <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 24px" }}>
        <ErrorMessage message={error} />
        {loading ? (
          <LoadingSpinner />
        ) : result ? (
          <div className="page-card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              Підсумкові показники
            </h2>
            <MetricsPanel result={result} />
            <EquityCurveChart equityCurve={result.equity_curve} />

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate(`/strategies/${effectiveSid}/backtest`)}
                style={{ background: "#4a90e2", color: "#fff" }}
              >
                ↻ Новий бектест
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ background: "#e2e8f0", color: "#4a5568" }}
              >
                ← Назад до дашборду
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
