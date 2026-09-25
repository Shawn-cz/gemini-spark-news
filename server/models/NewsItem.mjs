import mongoose from 'mongoose';

const NewsItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    batchDate: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    englishTitle: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      required: true,
      trim: true
    },
    sourceCountry: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['ai', 'finance', 'geopolitics', 'climate'],
      index: true
    },
    region: {
      type: String,
      required: true,
      trim: true
    },
    impactLevel: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium'],
      default: 'high',
      index: true
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    sentiment: {
      type: String,
      required: true,
      enum: ['positive', 'neutral', 'negative']
    },
    sentimentScore: {
      type: Number,
      required: true,
      min: -1.0,
      max: 1.0
    },
    nlpKeyEntities: {
      type: [String],
      default: []
    },
    coverUrl: {
      type: String,
      default: ''
    },
    publishTime: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// 复合索引：加速按天和领域、影响级别的过滤排序
NewsItemSchema.index({ batchDate: -1, impactLevel: -1 });
NewsItemSchema.index({ batchDate: -1, category: 1 });

// 全文检索索引：为 MVP 4 跨期全文检索打下坚实基础
NewsItemSchema.index({
  title: 'text',
  englishTitle: 'text',
  summary: 'text',
  tags: 'text'
});

export const NewsItemModel = mongoose.models.NewsItem || mongoose.model('NewsItem', NewsItemSchema);
