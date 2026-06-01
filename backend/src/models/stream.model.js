import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    streamKey: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Live Stream',
      maxlength: 100,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries by user
streamSchema.index({ user: 1, createdAt: -1 });
streamSchema.index({ streamKey: 1 });

const Stream = mongoose.model('Stream', streamSchema);
export default Stream;