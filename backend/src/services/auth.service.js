import crypto from 'crypto';
import User from '../models/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';

export const registerUser = async ({ username, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    const error = new Error(`This ${field} is already registered`);
    error.statusCode = 409;
    throw error;
  }

  // Generate unique stream key for this user
  const streamKey = crypto.randomBytes(16).toString('hex');

  const user = await User.create({
    username,
    email,
    password,
    streamKey,
  });

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      streamKey: user.streamKey,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async ({ email, password }) => {
  // Explicitly select password — excluded by default via select:false
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Same error for wrong email AND wrong password
    // Never reveal which one is incorrect — prevents user enumeration
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      streamKey: user.streamKey,
      isLive: user.isLive,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');

  if (!user || user.refreshToken !== incomingRefreshToken) {
    const error = new Error('Refresh token reuse detected');
    error.statusCode = 401;
    throw error;
  }

  // Rotation — issue new both tokens, invalidate old refresh token
  const newAccessToken = signAccessToken(user._id.toString());
  const newRefreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};