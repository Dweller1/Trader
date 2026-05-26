import { useState } from "react";

const fieldStyle = { display: "flex", flexDirection: "column", gap: 5 };
const inputStyle = {
  padding: "8px 12px",
  border: "1px solid #cbd5e0",
  borderRadius: 6,
  fontSize: 14,
};
const labelStyle = { fontSize: 13, fontWeight: 500, color: "#4a5568" };

export default function BacktestForm({ onSubmit, disabled }) {
  const [form, setForm] = useState({
    ticker: "AAPL",
    dateFrom: "2023-01-03",
    dateTo: "2024-06-30",
    initialCapital: 10000,
    commission: 0,
  });

  const set = (key) => (e) => {
    const raw = e.target.value;
    const num = +raw;
    setForm((f) => ({ ...f, [key]: isNaN(num) ? raw : num }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={fieldStyle}>
        <label style={labelStyle}>Тікер</label>
        <input
          style={inputStyle}
          value={form.ticker}
          onChange={(e) =>
            setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))
          }
          required
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Дата початку</label>
          <input
            style={inputStyle}
            type="date"
            value={form.dateFrom}
            onChange={set("dateFrom")}
            required
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Дата кінця</label>
          <input
            style={inputStyle}
            type="date"
            value={form.dateTo}
            onChange={set("dateTo")}
            required
          />
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Початковий капітал ($)</label>
        <input
          style={inputStyle}
          type="number"
          min="1"
          value={form.initialCapital}
          onChange={set("initialCapital")}
          required
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Комісія ($, за угоду)</label>
        <input
          style={inputStyle}
          type="number"
          min="0"
          step="0.01"
          value={form.commission}
          onChange={set("commission")}
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        style={{
          background: "#4a90e2",
          color: "#fff",
          padding: "10px 0",
          fontSize: 15,
          marginTop: 4,
        }}
      >
        {disabled ? "Виконується..." : "▶ Запустити бектест"}
      </button>
    </form>
  );
}
