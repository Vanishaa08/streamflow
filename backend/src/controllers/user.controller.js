import User from '../models/user.model.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select(
      'username isLive role _id'
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, { user });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};