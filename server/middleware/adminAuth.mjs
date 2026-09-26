import crypto from 'crypto';

const DEFAULT_DEV_ADMIN_KEY = 'gemini-spark-dev-secret';

/**
 * 获取当前生效的管理员秘钥
 */
export function getEffectiveAdminKey() {
  return process.env.ADMIN_KEY || DEFAULT_DEV_ADMIN_KEY;
}

/**
 * 使用常数时间安全比对两个字符串，杜绝计时侧信道攻击
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // 保持相同长度比对以消耗恒定时间，随后判定失败
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 管理员鉴权守卫中间件
 */
export function adminAuthGuard(req, res, next) {
  const adminKey = getEffectiveAdminKey();
  
  // 提取请求凭证：优先 X-Admin-Key 头，次选 Authorization: Bearer <key>
  let clientKey = req.headers['x-admin-key'];
  if (!clientKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      clientKey = authHeader.slice(7).trim();
    }
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
