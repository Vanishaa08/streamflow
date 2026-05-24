import app from './app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';

const startServer = async () => {
  // Connect to DB before accepting any requests
  // If DB connection fails, connectDB() calls process.exit(1) — we never reach listen()
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`
╔════════════════════════════════════════╗
║         StreamFlow API Server          ║
╠════════════════════════════════════════╣
║  Port    : ${env.port}                         ║
║  Mode    : ${env.nodeEnv.padEnd(12)}           ║
║  Health  : http://localhost:${env.port}/health ║
╚════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown 
  // SIGTERM: sent by Docker (docker stop), Kubernetes, or process managers
  // SIGINT:  sent by Ctrl+C in terminal
  //
  // Without this: Docker kills the process after 10s timeout, dropping in-flight requests
  // With this: we stop accepting new connections, finish current ones, then exit cleanly
 
  const shutdown = (signal) => {
    console.log(`\n[SERVER] Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      console.log('[SERVER] All connections closed. Exiting.');
      process.exit(0);
    });

    // Force exit after 10s if connections don't drain
    // (e.g., a WebSocket client that never disconnects)
    setTimeout(() => {
      console.warn('[SERVER] Forced exit after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Catch unhandled promise rejections — these would otherwise silently fail
  // In production, this should trigger an alert and potentially restart the service
  process.on('unhandledRejection', (reason) => {
    console.error('[SERVER] Unhandled promise rejection:', reason);
  });
};

startServer();