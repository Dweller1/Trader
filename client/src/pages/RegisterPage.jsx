import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import api from '../api/axios';
import ErrorMessage from '../components/shared/ErrorMessage';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Паролі не збігаються');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
      });
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const inp = (key, type = 'text', placeholder = '') => ({
    type, value: form[key], onChange: set(key), required: true, placeholder,
    style: { padding: '9px 12px', border: '1px solid #cbd5e0', borderRadius: 6 },
  });

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
          Створіть новий акаунт
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { k: 'email',    label: 'Email',           type: 'email',    ph: 'you@example.com' },
            { k: 'password', label: 'Пароль',          type: 'password', ph: '••••••••' },
            { k: 'confirm',  label: 'Підтвердіть пароль', type: 'password', ph: '••••••••' },
          ].map(({ k, label, type, ph }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568' }}>{label}</label>
              <input {...inp(k, type, ph)} />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            style={{ background: '#48bb78', color: '#fff', padding: '10px 0', fontSize: 15, marginTop: 6 }}
          >
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#718096' }}>
          Вже є акаунт?{' '}
          <Link to="/login" style={{ color: '#4a90e2', fontWeight: 500 }}>
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
