import { app } from '../server/mock-server.mjs';
import { initDatabase } from '../server/repository.mjs';

let isDbInitialized = false;

/**
 * Vercel Serverless Function 统一网关入口
 * 将所有 /api/* 请求无缝代理转发给 Express 核心应用
 */
export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless Gateway] initDatabase warning:', err.message);
    }
  }
  return app(req, res);
}
