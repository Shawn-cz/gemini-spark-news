import rateLimit from 'express-rate-limit';

/**
 * 通用 API 读取请求限流器 (120 次/分钟)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.RATE_LIMIT_GLOBAL ? parseInt(process.env.RATE_LIMIT_GLOBAL, 10) : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => ({
    code: 429,
    message: '请求过于频繁，请稍后再试 (Too Many Requests)',
    timestamp: new Date().toISOString()
  }),
  skip: (req) => {
    // 豁免原生 SSE 推流保活通道与健康探针 (支持直接挂载与带路由前缀挂载如 app.use('/api', apiRateLimiter))
    const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    return fullPath === '/api/spark/stream' || fullPath === '/api/health' || req.path === '/spark/stream' || req.path === '/health';
  }
});

/**
 * 敏感管理操作严格限流器 (10 次/分钟)
 * 针对批次生成调度、模型热切等高计算开销操作
 */
export const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.RATE_LIMIT_ADMIN ? parseInt(process.env.RATE_LIMIT_ADMIN, 10) : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => ({
    code: 429,
    message: '敏感操作请求过于频繁，触发频率保护，请 1 分钟后重试',
    timestamp: new Date().toISOString()
  })
});
