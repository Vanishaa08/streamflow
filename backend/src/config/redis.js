import { createClient } from 'redis';
import env from './env.js';

// We need TWO Redis clients for pub/sub
// One for publishing, one for subscribing
// A client in subscribe mode cannot be used for other commands
const pubClient = createClient({ url: env.redisUrl });
const subClient = pubClient.duplicate();

export const connectRedis = async () => {
  try {
    await pubClient.connect();
    await subClient.connect();
    console.log('[REDIS] Connected successfully');
  } catch (error) {
    console.error(`[REDIS] Connection failed: ${error.message}`);
    // Redis failure is not fatal — app can run without it
    // but pub/sub and viewer counts won't work
  }
};

pubClient.on('error', (err) => console.error('[REDIS] Error:', err.message));
subClient.on('error', (err) => console.error('[REDIS] Sub error:', err.message));

export { pubClient, subClient };
export default pubClient;