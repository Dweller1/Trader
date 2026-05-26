import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import api from "../api/axios";
import NodePanel from "../components/editor/NodePanel";
import StrategyCanvas from "../components/editor/StrategyCanvas";
import ParamsPanel from "../components/editor/ParamsPanel";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

function EditorContent({ strategyId }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [strategyName, setStrategyName] = useState("Нова стратегія");
  const [graphData, setGraphData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (strategyId) {
      api
        .get(`/strategies/${strategyId}`)
        .then((r) => {
          setStrategyName(r.data.name);
          const gd = r.data.graph_data || { nodes: [], edges: [] };
          setGraphData({ nodes: gd.nodes || [], edges: gd.edges || [] });
        })
        .catch(() => setError("Не вдалося завантажити стратегію"));
    } else {
      setGraphData({ nodes: [], edges: [] });
    }
  }, [strategyId]);

  const handleSave = useCallback(async () => {
    setError("");
    const { nodes, edges } = canvasRef.current.getGraphData();
    const hasSignal = nodes.some(
      (n) => n.type === "BuySignal" || n.type === "SellSignal",
    );
    if (!hasSignal) {
      setError(
        "Стратегія повинна містити хоча б один вузол «Сигнал покупки» або «Сигнал продажу»",
      );
      return;
    }
    if (!strategyName.trim()) {
      setError("Введіть назву стратегії");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: strategyName.trim(),
        graph_data: { nodes, edges },
      };
      if (strategyId) {
        await api.put(`/strategies/${strategyId}`, payload);
      } else {
        const { data } = await api.post("/strategies", payload);
        navigate(`/strategies/${data.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  }, [strategyId, strategyName, navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          height: 52,
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "#e2e8f0",
            color: "#4a5568",
            fontSize: 13,
            padding: "6px 12px",
          }}
        >
          ← Назад
        </button>
        <input
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          style={{
            border: "none",
            borderBottom: "2px solid transparent",
            background: "transparent",
            fontSize: 16,
            fontWeight: 600,
            outline: "none",
            minWidth: 220,
            ":focus": { borderBottomColor: "#4a90e2" },
          }}
          onFocus={(e) => (e.target.style.borderBottomColor = "#4a90e2")}
          onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
        />
        {error && (
          <span style={{ fontSize: 12, color: "#e53e3e", flex: 1 }}>
            {error}
          </span>
        )}
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: "#4a90e2", color: "#fff", fontSize: 14 }}
          >
            {saving ? "Збереження..." : "💾 Зберегти"}
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <NodePanel />
        {graphData === null ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingSpinner />
          </div>
        ) : (
          <StrategyCanvas
            ref={canvasRef}
            initialNodes={graphData.nodes}
            initialEdges={graphData.edges}
            onNodeSelect={setSelectedNodeId}
          />
        )}
        <ParamsPanel selectedNodeId={selectedNodeId} />
      </div>
    </div>
  );
}

export default function StrategyEditorPage() {
  const { id } = useParams();
  return (
    <ReactFlowProvider>
      <EditorContent strategyId={id} />
    </ReactFlowProvider>
  );
}
