import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import api from "../api/axios";
import StrategyCard from "../components/dashboard/StrategyCard";
import DeleteConfirmModal from "../components/dashboard/DeleteConfirmModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    api
      .get("/strategies")
      .then((r) => setStrategies(r.data))
      .catch(() => setError("Не вдалося завантажити стратегії"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    logout();
    navigate("/login");
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/strategies/${toDelete.id}`);
      setStrategies((s) => s.filter((x) => x.id !== toDelete.id));
    } catch {
      setError("Не вдалося видалити стратегію");
    } finally {
      setToDelete(null);
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
          justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          Visual Algo-Trading Builder
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#718096" }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{ background: "#e2e8f0", color: "#4a5568", fontSize: 13 }}
          >
            Вийти
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Мої стратегії</h2>
          <button
            onClick={() => navigate("/strategies/new")}
            style={{ background: "#4a90e2", color: "#fff", fontSize: 14 }}
          >
            + Нова стратегія
          </button>
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <LoadingSpinner />
        ) : strategies.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#a0aec0",
            }}
          >
            <p style={{ fontSize: 16 }}>Стратегій ще немає</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Натисніть «+ Нова стратегія», щоб розпочати
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {strategies.map((s) => (
              <StrategyCard key={s.id} strategy={s} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </main>

      <DeleteConfirmModal
        strategy={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
