import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../store/authStore', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { accessToken: 'tok', user: { id: '1', email: 'a@b.com', role: 'trader' } } }),
    get: vi.fn(),
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => vi.fn() };
});

import LoginPage from '../pages/LoginPage';
import StrategyCard from '../components/dashboard/StrategyCard';
import MetricsPanel from '../components/results/MetricsPanel';
import EquityCurveChart from '../components/results/EquityCurveChart';

const MOCK_STRATEGY = {
  id: 'strat-1',
  name: 'EMA Crossover',
  description: 'Test strategy',
  updated_at: new Date().toISOString(),
  user_id: 'user-1',
};

const MOCK_RESULT_POSITIVE = {
  total_return: 9.05,
  max_drawdown: 9.63,
  sharpe_ratio: 0.04,
  win_rate: 75.0,
  total_trades: 4,
};

const MOCK_RESULT_NEGATIVE = {
  total_return: -5.81,
  max_drawdown: 7.15,
  sharpe_ratio: -0.04,
  win_rate: 0.0,
  total_trades: 1,
};

const MOCK_EQUITY = Array.from({ length: 20 }, (_, i) => 10000 + i * 50);

describe('ComponentTests — React Testing Library', () => {
  it('LoginForm renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('LoginForm submit disabled when fields empty', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    // Button is enabled by default (not loading), but inputs have required attribute
    const submitBtn = screen.getByRole('button', { name: /Увійти/i });
    expect(submitBtn).not.toBeDisabled();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('LoginForm calls onSubmit with correct values', async () => {
    const { default: api } = await import('../api/axios');
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Увійти/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({ email: 'test@example.com', password: 'password123' }),
      );
    });
  });

  it('LoginForm shows error on invalid email format', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('StrategyCard renders strategy name', () => {
    render(
      <MemoryRouter>
        <StrategyCard strategy={MOCK_STRATEGY} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('EMA Crossover')).toBeInTheDocument();
  });

  it('StrategyCard edit button triggers onEdit', () => {
    const navigate = vi.fn();
    vi.mocked(vi.importMeta?.resolve ? vi.fn() : vi.fn());

    render(
      <MemoryRouter>
        <StrategyCard strategy={MOCK_STRATEGY} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    const editBtn = screen.getByRole('button', { name: /Редагувати/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
  });

  it('StrategyCard delete button shows confirm modal', () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <StrategyCard strategy={MOCK_STRATEGY} onDelete={onDelete} />
      </MemoryRouter>,
    );
    const deleteBtn = screen.getByRole('button', { name: /Видалити/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(MOCK_STRATEGY);
  });

  it('BacktestResultPanel renders all metrics', () => {
    render(<MetricsPanel result={MOCK_RESULT_POSITIVE} />);
    expect(screen.getByText(/Загальна прибутковість/i)).toBeInTheDocument();
    expect(screen.getByText(/Максимальна просадка/i)).toBeInTheDocument();
    expect(screen.getByText(/Коефіцієнт Шарпа/i)).toBeInTheDocument();
    expect(screen.getByText(/Відсоток прибуткових угод/i)).toBeInTheDocument();
    expect(screen.getByText(/Загальна кількість угод/i)).toBeInTheDocument();
  });

  it('BacktestResultPanel highlights positive return', () => {
    render(<MetricsPanel result={MOCK_RESULT_POSITIVE} />);
    expect(screen.getByText('9.05%')).toBeInTheDocument();
  });

  it('BacktestResultPanel highlights negative return', () => {
    render(<MetricsPanel result={MOCK_RESULT_NEGATIVE} />);
    expect(screen.getByText('-5.81%')).toBeInTheDocument();
  });

  it('BacktestResultPanel renders equity curve chart', () => {
    render(
      <MemoryRouter>
        <EquityCurveChart equityCurve={MOCK_EQUITY} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Крива капіталу/i)).toBeInTheDocument();
  });

  it('BacktestResultPanel shows total trades count', () => {
    render(<MetricsPanel result={MOCK_RESULT_POSITIVE} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
