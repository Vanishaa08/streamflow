import dotenv from 'dotenv';
dotenv.config();

// These variables are non-negotiable — the app cannot function without them
// If any is missing, crash immediately with a clear message
// This is called the fail-fast principle
const REQUIRED_VARS = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`\n[FATAL] Missing required environment variable: ${key}`);
    console.error('[FATAL] Check your .env file. Server cannot start.\n');
    process.exit(1);
  }
});

// Export a typed config object instead of scattering process.env throughout the codebase
// Benefits: one place to change variable names, autocomplete in IDE, easy to mock in tests
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  isDev: process.env.NODE_ENV !== 'production',
};

export default env;
