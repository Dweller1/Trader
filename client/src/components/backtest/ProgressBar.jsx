export default function ProgressBar({ progress }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#555' }}>
        <span>Виконання бектесту…</span>
        <span style={{ fontWeight: 600 }}>{progress}%</span>
      </div>
      <div style={{ height: 10, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #4a90e2, #48bb78)',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
