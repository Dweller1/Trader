export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 6,
      padding: '10px 14px', color: '#c53030', fontSize: 14, marginBottom: 12,
    }}>
      {message}
    </div>
  );
}
