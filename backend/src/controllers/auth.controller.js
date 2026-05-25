import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import env from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,     // JS cannot read this cookie — prevents XSS theft
  secure: !env.isDev, // HTTPS only in production
  sameSite: 'strict', // prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return sendError(res, 'Username, email and password are required', 400);
    }

    const { user, accessToken, refreshToken } = await authService.registerUser({
      username, email, password,
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { user, accessToken }, 201, 'Registration successful');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const { user, accessToken, refreshToken } = await authService.loginUser({
      email, password,
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { user, accessToken }, 200, 'Login successful');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return sendError(res, 'No refresh token provided', 401);
    }

    const { accessToken, refreshToken } = await authService.refreshAccessToken(
      incomingRefreshToken
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken }, 200, 'Token refreshed');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

export const logout = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
      const { verifyRefreshToken } = await import('../utils/jwt.utils.js');
      try {
        const decoded = verifyRefreshToken(incomingRefreshToken);
        await authService.logoutUser(decoded.userId);
      } catch {
        // token already invalid — still clear the cookie
      }
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    sendSuccess(res, null, 200, 'Logged out successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};