export default function DeleteConfirmModal({ strategy, onConfirm, onCancel }) {
  if (!strategy) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32,
        maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <h3 style={{ marginBottom: 12, fontSize: 18 }}>Видалити стратегію?</h3>
        <p style={{ color: '#555', marginBottom: 24, lineHeight: 1.5 }}>
          Ви впевнені, що хочете видалити стратегію{' '}
          <strong>«{strategy.name}»</strong>?<br />
          Цю дію неможливо скасувати. Усі результати бектестів буде також видалено.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: '#e2e8f0', color: '#2d3748' }}>
            Скасувати
          </button>
          <button onClick={onConfirm} style={{ background: '#e53e3e', color: '#fff' }}>
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}
