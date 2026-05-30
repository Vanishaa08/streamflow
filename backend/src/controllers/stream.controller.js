import * as streamService from '../services/stream.service.js';

export const authenticateStream = async (req, res) => {
  try {
    // Nginx RTMP sends stream key as 'name' in the request body
    const streamKey = req.body.name || req.query.name;

    if (!streamKey) {
      return res.status(401).send('Stream key required');
    }

    const user = await streamService.authenticateStream(streamKey);

    console.log(`[STREAM] ${user.username} started streaming`);

    // Nginx expects 2xx to allow, anything else rejects the stream
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
    res.status(200).send('OK'); // always return 200 for done callback
  }
};