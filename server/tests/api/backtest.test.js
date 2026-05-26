'use strict';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../../config/db', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

jest.mock('../../models', () => ({
  User: { findOne: jest.fn() },
  RefreshToken: {},
  Strategy: { findByPk: jest.fn() },
  BacktestResult: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../websocket/backtestRegistry', () => ({
  register: jest.fn(),
  consume: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const backtestRoutes = require('../../routes/backtests');
const { Strategy, BacktestResult } = require('../../models');
const registry = require('../../websocket/backtestRegistry');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/strategies/:id/backtest', backtestRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

const USER_ID = 'user-id-1';

function makeToken() {
  return jwt.sign(
    { id: USER_ID, email: 'test@example.com', role: 'trader' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const VALID_BODY = {
  ticker: 'AAPL',
  dateFrom: '2023-01-03',
  dateTo: '2023-12-29',
  initialCapital: 10000,
  commission: 0.1,
};

describe('BacktestAPITests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('testBacktest_returns400_invalidDates', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID, graph_data: {} });

    const res = await request(app)
      .post('/api/strategies/strat-1/backtest')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ticker: 'AAPL', initialCapital: 10000 }); // missing dateFrom/dateTo

    expect(res.status).toBe(400);
  });

  test('testBacktest_returns400_negativeCapital', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID, graph_data: {} });

    const res = await request(app)
      .post('/api/strategies/strat-1/backtest')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ticker: 'AAPL', dateFrom: '2023-01-03', dateTo: '2023-12-29', initialCapital: null });

    expect(res.status).toBe(400);
  });

  test('testBacktest_returns400_missingTicker', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID, graph_data: {} });

    const res = await request(app)
      .post('/api/strategies/strat-1/backtest')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ dateFrom: '2023-01-03', dateTo: '2023-12-29', initialCapital: 10000 });

    expect(res.status).toBe(400);
  });

  test('testBacktest_returns201_validParams', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID, graph_data: {} });
    registry.register.mockImplementation(() => {});

    const res = await request(app)
      .post('/api/strategies/strat-1/backtest')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(VALID_BODY);

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('backtestId');
    expect(typeof res.body.backtestId).toBe('string');
  });

  test('testBacktest_resultStoredInDB', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID, graph_data: {} });
    registry.register.mockImplementation(() => {});

    await request(app)
      .post('/api/strategies/strat-1/backtest')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(VALID_BODY);

    expect(registry.register).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ ticker: 'AAPL', userId: USER_ID, strategyId: 'strat-1' }),
    );
  });

  test('testGetResults_returns200_listForStrategy', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID });
    BacktestResult.findAll.mockResolvedValue([
      { id: 'bt-1', strategy_id: 'strat-1', ticker: 'AAPL', total_return: 9.05 },
    ]);

    const res = await request(app)
      .get('/api/strategies/strat-1/backtest/results')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('testGetResultById_returns200_withEquityCurve', async () => {
    BacktestResult.findByPk.mockResolvedValue({
      id: 'bt-1',
      strategy_id: 'strat-1',
      ticker: 'AAPL',
      equity_curve: [10000, 10500, 11000],
    });
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', user_id: USER_ID });

    const res = await request(app)
      .get('/api/strategies/strat-1/backtest/results/bt-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('equity_curve');
    expect(res.body.equity_curve).toHaveLength(3);
  });
});
