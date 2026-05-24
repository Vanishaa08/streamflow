import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000, // fail in 5s if mongo unreachable
    });

    console.log(`[DB] MongoDB connected → ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    // We exit here because the app is useless without a database
    // Other errors (e.g., Redis down) might be recoverable — DB is not
    process.exit(1);
  }
};

// These events are critical in production
// Without them, a MongoDB blip looks like the app is still healthy
// With them, you get logs you can alert on
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected — attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.info('[DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DB] MongoDB error: ${err.message}`);
});

export default connectDB;