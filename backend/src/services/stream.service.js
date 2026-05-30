import User from '../models/user.model.js';

export const authenticateStream = async (streamKey) => {
  // Find user with this stream key
  const user = await User.findOne({ streamKey });

  if (!user) {
    const error = new Error('Invalid stream key');
    error.statusCode = 401;
    throw error;
  }

  // Mark user as live
  user.isLive = true;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const endStream = async (streamKey) => {
  const user = await User.findOne({ streamKey });

  if (!user) return;

  // Mark user as offline
  user.isLive = false;
  await user.save({ validateBeforeSave: false });

  return user;
};