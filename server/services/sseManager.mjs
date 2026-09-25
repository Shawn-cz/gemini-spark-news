/**
 * Gemini Spark SSE 实时推流中心
 * 管理与前端 EventSource 的长连接池、阶段进展广播及心跳保活
 */

const clients = new Map();
let clientIdCounter = 1;
let heartbeatTimer = null;

export function getClientCount() {
  return clients.size;
}

export function addSSEClient(res) {
  const id = clientIdCounter++;
  clients.set(id, res);

  // 初次握手：发送连接成功欢迎消息
  const welcomePayload = {
    type: 'CONNECTED',
    clientId: id,
    message: 'Gemini Spark SSE Stream Connected',
    timestamp: new Date().toISOString()
  };

  try {
    res.write(`data: ${JSON.stringify(welcomePayload)}\n\n`);
  } catch (err) {
    console.warn(`[SSEManager] 向客户端 #${id} 发送欢迎消息失败:`, err.message);
    clients.delete(id);
    return null;
  }

  ensureHeartbeat();
  return id;
}

export function removeSSEClient(id) {
  clients.delete(id);
  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function broadcastSSEMessage(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const [id, res] of clients.entries()) {
    try {
      res.write(data);
    } catch (err) {
      console.warn(`[SSEManager] 向客户端 #${id} 写入失败，自动移除:`, err.message);
      clients.delete(id);
    }
  }

  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  // 15 秒心跳包保持长连接
  heartbeatTimer = setInterval(() => {
    if (clients.size === 0) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      return;
    }
    for (const [id, res] of clients.entries()) {
      try {
        res.write(':heartbeat\n\n');
      } catch (e) {
        clients.delete(id);
      }
    }
    if (clients.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, 15000);

  if (typeof heartbeatTimer?.unref === 'function') {
    heartbeatTimer.unref();
  }
}
