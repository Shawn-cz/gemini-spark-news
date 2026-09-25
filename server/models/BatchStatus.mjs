import mongoose from 'mongoose';

const BatchStatusSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    status: {
      type: String,
      required: true,
      enum: ['COMPLETED', 'RUNNING', 'PENDING', 'ERROR'],
      default: 'COMPLETED'
    },
    statusText: {
      type: String,
      default: '已完成归档'
    },
    generatedTime: {
      type: String,
      default: ''
    },
    nextScheduleTime: {
      type: String,
      default: '明日 08:30:00 (每日晨报)'
    },
    scheduleInterval: {
      type: String,
      default: '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)'
    },
    scheduleCron: {
      type: String,
      default: '30 8 * * *'
    },
    estimatedRemainingMinutes: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    currentStage: {
      type: String,
      default: 'Gemini Spark 智能体 24H 简报生成与交叉校验完成'
    },
    globalSentimentIndex: {
      type: Number,
      default: 0
    },
    batchNewsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const BatchStatusModel = mongoose.models.BatchStatus || mongoose.model('BatchStatus', BatchStatusSchema);
