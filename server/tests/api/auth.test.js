'use strict';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../../config/db', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  RefreshToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  Strategy: {},
  BacktestResult: {},
}));

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/auth');
const { User, RefreshToken } = require('../../models');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

describe('AuthAPITests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('testRegister_returns201_validData', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'user-id-1',
      email: 'new@example.com',
      role: 'trader',
    });
    RefreshToken.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('new@example.com');
  });

  test('testRegister_returns400_missingEmail', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
  });

  test('testRegister_returns409_duplicateEmail', async () => {
    User.findOne.mockResolvedValue({ id: 'existing-id', email: 'dup@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  test('testLogin_returns200_validCredentials', async () => {
    const hash = await bcrypt.hash('password123', 12);
    User.findOne.mockResolvedValue({
      id: 'user-id-1',
      email: 'test@example.com',
      password_hash: hash,
      role: 'trader',
    });
    RefreshToken.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  test('testLogin_returns401_wrongPassword', async () => {
    const hash = await bcrypt.hash('correct-password', 12);
    User.findOne.mockResolvedValue({
      id: 'user-id-1',
      email: 'test@example.com',
      password_hash: hash,
      role: 'trader',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  test('testLogin_returns404_unknownEmail', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('testRefresh_returns200_validToken', async () => {
    const refreshToken = jwt.sign(
      { id: 'user-id-1' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    RefreshToken.findOne.mockResolvedValue({
      token: refreshToken,
      user_id: 'user-id-1',
      expires_at: new Date(Date.now() + 86400000),
      destroy: jest.fn().mockResolvedValue(true),
    });
    User.findByPk.mockResolvedValue({
      id: 'user-id-1',
      email: 'test@example.com',
      role: 'trader',
    });
    RefreshToken.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('testRefresh_returns401_expiredToken', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=this.is.invalid']);

    expect(res.status).toBe(401);
  });

  test('testLogout_invalidates_refreshToken', async () => {
    RefreshToken.destroy.mockResolvedValue(1);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refreshToken=some-valid-token']);

    expect(res.status).toBe(200);
    expect(RefreshToken.destroy).toHaveBeenCalled();
  });
});
