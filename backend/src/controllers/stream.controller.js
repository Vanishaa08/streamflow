import * as streamService from '../services/stream.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const authenticateStream = async (req, res) => {
  try {
    const streamKey = req.body.name || req.query.name;

    if (!streamKey) {
      return res.status(401).send('Stream key required');
    }

    const user = await streamService.authenticateStream(streamKey);
    console.log(`[STREAM] ${user.username} started streaming`);
    res.status(200).send('OK');
  } catch (error) {
    console.error(`[STREAM] Auth failed: ${error.message}`);
    res.status(401).send('Unauthorized');
  }
};

export const streamDone = async (req, res) => {
  try {
    const streamKey = req.body.name || req.query.name;

    if (streamKey) {
      const user = await streamService.endStream(streamKey);
      if (user) {
        console.log(`[STREAM] ${user.username} stopped streaming`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error(`[STREAM] Done callback error: ${error.message}`);
    res.status(200).send('OK');
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const analytics = await streamService.getStreamerAnalytics(req.user._id);
    sendSuccess(res, analytics, 200, 'Analytics fetched');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};