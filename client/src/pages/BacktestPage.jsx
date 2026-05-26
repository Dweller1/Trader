import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getToken } from "../api/axios";
import BacktestForm from "../components/backtest/BacktestForm";
import ProgressBar from "../components/backtest/ProgressBar";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function BacktestPage() {
  const { id: strategyId } = useParams();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const runningRef = useRef(false);

  const [strategy, setStrategy] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/strategies/${strategyId}`)
      .then((r) => setStrategy(r.data))
      .catch(() => setError("Не вдалося завантажити стратегію"));
    return () => wsRef.current?.close();
  }, [strategyId]);

  const handleSubmit = async (form) => {
    setError("");
    setProgress(0);

    try {
      const { data } = await api.post(
        `/strategies/${strategyId}/backtest`,
        form,
      );
      const { backtestId } = data;

      setRunning(true);
      runningRef.current = true;

      const token = getToken();
      const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${wsProto}://${window.location.host}/ws?token=${token}&backtestId=${backtestId}`,
      );
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "progress") {
          setProgress(msg.progress);
        } else if (msg.type === "complete") {
          runningRef.current = false;
          ws.close();
          navigate(`/results/${backtestId}`, { state: { strategyId } });
        } else if (msg.type === "error") {
          setError(msg.message || "Помилка бектесту");
          runningRef.current = false;
          setRunning(false);
        }
      };

      ws.onerror = () => {
        setError("Помилка WebSocket з'єднання");
        runningRef.current = false;
        setRunning(false);
      };

      ws.onclose = () => {
        if (runningRef.current) {
          runningRef.current = false;
          setRunning(false);
        }
      };
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося запустити бектест");
    }
  };

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
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>
          Бектест{strategy ? `: ${strategy.name}` : ""}
        </h1>
      </header>

      <main style={{ maxWidth: 520, margin: "40px auto", padding: "0 24px" }}>
        <div className="page-card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
            Параметри бектесту
          </h2>
          <ErrorMessage message={error} />
          <BacktestForm onSubmit={handleSubmit} disabled={running} />
          {running && <ProgressBar progress={progress} />}
        </div>
      </main>
    </div>
  );
}
