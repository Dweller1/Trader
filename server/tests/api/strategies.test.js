'use strict';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../../config/db', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

jest.mock('../../models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  RefreshToken: { findOne: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  Strategy: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  BacktestResult: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const strategyRoutes = require('../../routes/strategies');
const { Strategy } = require('../../models');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/strategies', strategyRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

const USER_ID = 'user-id-1';
const OTHER_USER_ID = 'user-id-2';

function makeToken(userId = USER_ID) {
  return jwt.sign(
    { id: userId, email: 'test@example.com', role: 'trader' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

describe('StrategyAPITests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('testGetStrategies_returns200_authenticated', async () => {
    Strategy.findAll.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/strategies')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('testGetStrategies_returns401_noToken', async () => {
    const res = await request(app).get('/api/strategies');
    expect(res.status).toBe(401);
  });

  test('testGetStrategies_returnsOnlyOwn', async () => {
    const ownStrategies = [
      { id: 's1', name: 'Mine', user_id: USER_ID },
    ];
    Strategy.findAll.mockResolvedValue(ownStrategies);

    const res = await request(app)
      .get('/api/strategies')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user_id).toBe(USER_ID);
  });

  test('testCreateStrategy_returns201_validBody', async () => {
    const created = { id: 'new-strat', name: 'EMA Cross', user_id: USER_ID, graph_data: {} };
    Strategy.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'EMA Cross', graph_data: {} });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('EMA Cross');
  });

  test('testCreateStrategy_returns400_missingName', async () => {
    const res = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ graph_data: {} });

    expect(res.status).toBe(400);
  });

  test('testGetStrategy_returns200_ownRecord', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-1', name: 'Mine', user_id: USER_ID });

    const res = await request(app)
      .get('/api/strategies/strat-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('strat-1');
  });

  test('testGetStrategy_returns403_anotherUsers', async () => {
    Strategy.findByPk.mockResolvedValue({ id: 'strat-2', name: 'Theirs', user_id: OTHER_USER_ID });

    const res = await request(app)
      .get('/api/strategies/strat-2')
      .set('Authorization', `Bearer ${makeToken(USER_ID)}`);

    expect(res.status).toBe(403);
  });

  test('testUpdateStrategy_returns200_validData', async () => {
    const strat = {
      id: 'strat-1', name: 'Old Name', user_id: USER_ID,
      update: jest.fn().mockResolvedValue(true),
    };
    Strategy.findByPk.mockResolvedValue(strat);

    const res = await request(app)
      .put('/api/strategies/strat-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(strat.update).toHaveBeenCalled();
  });

  test('testUpdateStrategy_returns404_notFound', async () => {
    Strategy.findByPk.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/strategies/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(404);
  });

  test('testDeleteStrategy_returns204', async () => {
    const strat = {
      id: 'strat-1', user_id: USER_ID,
      destroy: jest.fn().mockResolvedValue(true),
    };
    Strategy.findByPk.mockResolvedValue(strat);

    const res = await request(app)
      .delete('/api/strategies/strat-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(204);
  });

  test('testDeleteStrategy_removesResults', async () => {
    const strat = {
      id: 'strat-1', user_id: USER_ID,
      destroy: jest.fn().mockResolvedValue(true),
    };
    Strategy.findByPk.mockResolvedValue(strat);

    await request(app)
      .delete('/api/strategies/strat-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(strat.destroy).toHaveBeenCalledTimes(1);
  });
});
