import User from '../models/user.model.js';
import Stream from '../models/stream.model.js';
import redisClient from '../config/redis.js';

export const authenticateStream = async (streamKey) => {
  const user = await User.findOne({ streamKey });

  if (!user) {
    const error = new Error('Invalid stream key');
    error.statusCode = 401;
    throw error;
  }

  // Create a new stream session in MongoDB
  const stream = await Stream.create({
    user: user._id,
    streamKey,
    title: `${user.username}'s Stream`,
    startedAt: new Date(),
  });

  // Store stream session ID in Redis for quick access
  await redisClient.set(`stream:active:${streamKey}`, stream._id.toString());

  // Mark user as live
  user.isLive = true;
  await user.save({ validateBeforeSave: false });

  console.log(`[STREAM] Session created: ${stream._id}`);

  return user;
};

export const endStream = async (streamKey) => {
  const user = await User.findOne({ streamKey });
  if (!user) return;

  // Get active stream session ID from Redis
  const streamId = await redisClient.get(`stream:active:${streamKey}`);

  if (streamId) {
    // Get peak viewer count from Redis
    const peakViewers = await redisClient.get(`viewers:peak:${streamKey}`) || 0;
    const totalMessages = await redisClient.get(`messages:${streamKey}`) || 0;

    const endedAt = new Date();
    const stream = await Stream.findById(streamId);

    if (stream) {
      stream.endedAt = endedAt;
      stream.duration = Math.floor((endedAt - stream.startedAt) / 1000);
      stream.peakViewers = parseInt(peakViewers);
      stream.totalMessages = parseInt(totalMessages);
      stream.isActive = false;
      await stream.save();
    }

    // Cleanup Redis keys
    await redisClient.del(`stream:active:${streamKey}`);
    await redisClient.del(`viewers:${streamKey}`);
    await redisClient.del(`viewers:peak:${streamKey}`);
    await redisClient.del(`messages:${streamKey}`);
  }

  user.isLive = false;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const getStreamerAnalytics = async (userId) => {
  // Get all streams for this user
  const streams = await Stream.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate aggregate stats
  const totalStreams = await Stream.countDocuments({ user: userId });
  const totalDuration = await Stream.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: '$duration' } } },
  ]);

  const avgViewers = await Stream.aggregate([
    { $match: { user: userId, peakViewers: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: '$peakViewers' } } },
  ]);

  return {
    recentStreams: streams,
    totalStreams,
    totalDuration: totalDuration[0]?.total || 0,
    avgPeakViewers: Math.round(avgViewers[0]?.avg || 0),
  };
};