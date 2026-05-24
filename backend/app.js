import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './src/config/env.js';

const app = express();

//  Security middleware
// helmet sets 15 HTTP response headers that prevent common attacks
// Examples: X-Content-Type-Options (no MIME sniffing), X-Frame-Options (no clickjacking)

app.use(helmet());

// CORS: tells browsers which origins are allowed to call our API
// credentials:true is required when the frontend sends cookies (for refresh token)
// Without this, the browser refuses to send the HTTP-only cookie cross-origin
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

//Rate limiting 
// Applies to all routes — 200 requests per 15 minutes per IP
// This is a coarse global limit; auth routes get a stricter limit (10/15min)

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,  // sends RateLimit-* headers so clients know their limit
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, slow down' },
});
app.use(globalLimiter);

// Request logging 
// morgan 'dev' format: "POST /api/auth/login 200 43ms"
// morgan 'combined' format: Apache-style logs for production log aggregators (Datadog, etc.)
app.use(morgan(env.isDev ? 'dev' : 'combined'));

//  Body parsing 
// limit:'10kb' prevents large payload attacks (sending 100MB JSON to crash the server)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Routes 

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

//404 handler 
// Catches any request that didn't match a route above
// Must come after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
});

//Global error handler 
// Express identifies this as an error handler by the 4-parameter signature (err, req, res, next)
// Any route that calls next(error) lands here
// In production we hide the stack trace — never expose internals to users
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    message: env.isDev ? err.message : 'Internal server error',
  });
});

export default app;