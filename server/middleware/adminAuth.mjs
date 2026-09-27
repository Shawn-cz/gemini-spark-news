import crypto from 'crypto';

const DEFAULT_DEV_ADMIN_KEY = 'gemini-spark-dev-secret';

/**
 * 获取当前生效的管理员秘钥
 */
export function getEffectiveAdminKey() {
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_KEY) {
    console.warn('[SECURITY WARNING] ADMIN_KEY 环境变量未设置，生产环境请勿使用默认秘钥！');
  }
  return process.env.ADMIN_KEY || DEFAULT_DEV_ADMIN_KEY;
}

/**
 * 使用常数时间安全比对两个字符串，杜绝计时侧信道攻击
 * 采用 SHA-256 摘要哈希将任意长度输入映射为 32 字节定长 Buffer，彻底消除长度泄露与 RangeError 风险
 */
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * 管理员鉴权守卫中间件
 */
export function adminAuthGuard(req, res, next) {
  const adminKey = getEffectiveAdminKey();
  
  // 提取请求凭证：优先 X-Admin-Key 头，次选 Authorization: Bearer <key> (支持 RFC 6750 大小写不敏感)
  let clientKey = req.headers['x-admin-key'];
  if (!clientKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        clientKey = match[1].trim();
      }
    }
  }

  if (typeof clientKey === 'string') {
    clientKey = clientKey.trim();
  }

  if (!clientKey || !safeCompare(clientKey, adminKey)) {
    return res.status(401).json({
      code: 401,
      message: '未授权操作：该管理接口需要提供有效的 X-Admin-Key 凭证',
      timestamp: new Date().toISOString()
    });
  }

  next();
}
