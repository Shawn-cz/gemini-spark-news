import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addSSEClient,
  removeSSEClient,
  broadcastSSEMessage,
  getClientCount
} from '../server/services/sseManager.mjs';

test('SSEManager - 能够添加和移除客户端并正确追踪客户端数量', () => {
  const initial = getClientCount();
  const mockRes = {
    write: () => {},
    end: () => {}
  };
  const clientId = addSSEClient(mockRes);
  assert.equal(getClientCount(), initial + 1);

  removeSSEClient(clientId);
  assert.equal(getClientCount(), initial);
});

test('SSEManager - 客户端连接时发送初始 CONNECTED 欢迎消息', () => {
  const messages = [];
  const mockRes = {
    write: (chunk) => {
      messages.push(chunk);
    }
  };
  const clientId = addSSEClient(mockRes);
  assert.equal(messages.length, 1);
  assert.ok(messages[0].startsWith('data: '));
  assert.ok(messages[0].endsWith('\n\n'));

  const payload = JSON.parse(messages[0].replace(/^data: /, '').trim());
  assert.equal(payload.type, 'CONNECTED');
  assert.equal(payload.clientId, clientId);
  assert.equal(payload.message, 'Gemini Spark SSE Stream Connected');
  assert.ok(payload.timestamp);

  removeSSEClient(clientId);
});

test('SSEManager - 广播推流时向所有客户端写入正确 SSE 格式', () => {
  const messages = [];
  const mockRes = {
    write: (chunk) => {
      messages.push(chunk);
    }
  };

  const clientId = addSSEClient(mockRes);
  broadcastSSEMessage({
    type: 'PROGRESS',
    stage: 'SEARCHING',
    progress: 40,
    message: '检索中...'
  });

  removeSSEClient(clientId);

  assert.ok(messages.length >= 2);
  const lastMsg = messages[messages.length - 1];
  assert.ok(lastMsg.startsWith('data: '));
  assert.ok(lastMsg.endsWith('\n\n'));
  assert.ok(lastMsg.includes('"stage":"SEARCHING"'));
  assert.ok(lastMsg.includes('"progress":40'));
});

test('SSEManager - 写入失败时自动安全移除异常连接客户端', () => {
  const faultyRes = {
    write: (chunk) => {
      if (chunk.includes('FAIL_TRIGGER')) {
        throw new Error('Connection reset by peer');
      }
    }
  };

  const clientId = addSSEClient(faultyRes);
  const countBefore = getClientCount();

  broadcastSSEMessage({
    type: 'TRIGGER',
    message: 'FAIL_TRIGGER'
  });

  assert.equal(getClientCount(), countBefore - 1);
});
