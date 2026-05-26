import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import api from '../api/axios';
import ErrorMessage from '../components/shared/ErrorMessage';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f6fa',
    }}>
      <div className="page-card" style={{ width: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          VAT Builder
        </h1>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: 28, fontSize: 14 }}>
          Увійдіть до свого акаунту
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568' }}>Email</label>
            <input
              type="email" value={form.email} onChange={set('email')} required
              placeholder="you@example.com"
              style={{ padding: '9px 12px', border: '1px solid #cbd5e0', borderRadius: 6 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568' }}>Пароль</label>
            <input
              type="password" value={form.password} onChange={set('password')} required
              placeholder="••••••••"
              style={{ padding: '9px 12px', border: '1px solid #cbd5e0', borderRadius: 6 }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ background: '#4a90e2', color: '#fff', padding: '10px 0', fontSize: 15, marginTop: 6 }}
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#718096' }}>
          Немає акаунту?{' '}
          <Link to="/register" style={{ color: '#4a90e2', fontWeight: 500 }}>
            Зареєструватись
          </Link>
        </p>
      </div>
    </div>
  );
}
