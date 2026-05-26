const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ statusCode: 409, message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password_hash,
      role: role === 'admin' ? 'admin' : 'trader',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });

    return res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ statusCode: 401, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });

    return res.status(200).json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ statusCode: 401, message: 'Refresh token missing' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (_) {
      return res.status(401).json({ statusCode: 401, message: 'Invalid or expired refresh token' });
    }

    const stored = await RefreshToken.findOne({ where: { token, user_id: payload.id } });
    if (!stored || stored.expires_at < new Date()) {
      return res.status(401).json({ statusCode: 401, message: 'Refresh token revoked or expired' });
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await stored.destroy();
    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      await RefreshToken.destroy({ where: { token } });
    }
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
