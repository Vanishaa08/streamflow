import { createServer } from 'http';
import app from './app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';
import { initializeSocket } from './src/sockets/index.js';

const startServer = async () => {
  await connectDB();

  // Create HTTP server from Express app
  // Socket.io needs the raw HTTP server, not the Express app
  const httpServer = createServer(app);

  // Initialize Socket.io on the same HTTP server
  const io = initializeSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`
╔════════════════════════════════════════╗
║         StreamFlow API Server          ║
╠════════════════════════════════════════╣
║  Port    : ${env.port}                         ║
║  Mode    : ${env.nodeEnv.padEnd(12)}              ║
║  Health  : http://localhost:${env.port}/health ║
║  Socket  : enabled                     ║
╚════════════════════════════════════════╝
    `);
  });

  const shutdown = (signal) => {
    console.log(`\n[SERVER] ${signal} received. Shutting down...`);
    httpServer.close(() => {
      console.log('[SERVER] All connections drained. Bye.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[SERVER] Unhandled rejection:', reason);
  });
};

startServer();