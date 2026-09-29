import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test runner
const memoryStorage = new Map();
global.localStorage = {
  getItem: (key) => memoryStorage.get(key) || null,
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear()
};

global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.CustomEvent = class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};

const BOOKMARKS_STORAGE_KEY = 'gemini_spark_bookmarks';
const BOOKMARKS_CHANGED_EVENT = 'gemini_spark_bookmarks_changed';

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: bookmarks })
    );
  } catch (err) {
    console.error(err);
  }
}

function isNewsBookmarked(id, cachedBookmarks) {
  if (!id) return false;
  const list = cachedBookmarks || loadBookmarks();
  return list.some(item => item.id === id);
}

function toggleBookmarkStorage(news) {
  const current = loadBookmarks();
  const exists = current.some(item => item.id === news.id);

  let updated;
  if (exists) {
    updated = current.filter(item => item.id !== news.id);
  } else {
    updated = [news, ...current];
  }

  saveBookmarks(updated);
  return {
    isBookmarked: !exists,
    bookmarks: updated
  };
}

describe('Gemini Spark Bookmark Storage Service', () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  const mockNewsItem = {
    id: 'test-news-bookmark-01',
    title: '全球前沿 AI 算力突破测试',
    source: 'MIT Technology Review',
    publishTime: '2026-09-29T08:30:00.000Z',
    summary: '测试研报摘要内容...',
    category: 'ai',
    region: 'Global',
    impactLevel: 'critical',
    tags: ['AI', 'Computing'],
    sentiment: 'positive',
    sentimentScore: 0.85,
    batchDate: '2026-09-29'
  };

  it('初始状态下加载收藏夹应返回空数组', () => {
    const list = loadBookmarks();
    assert.deepStrictEqual(list, []);
  });

  it('收藏研报后应成功持久化并返回 isBookmarked: true', () => {
    const res = toggleBookmarkStorage(mockNewsItem);
    assert.strictEqual(res.isBookmarked, true);
    assert.strictEqual(res.bookmarks.length, 1);
    assert.strictEqual(res.bookmarks[0].id, mockNewsItem.id);

    const loaded = loadBookmarks();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, mockNewsItem.id);
    assert.strictEqual(isNewsBookmarked(mockNewsItem.id), true);
  });

  it('再次触发收藏应取消收藏并返回 isBookmarked: false', () => {
    // 第一次收藏
    toggleBookmarkStorage(mockNewsItem);
    assert.strictEqual(isNewsBookmarked(mockNewsItem.id), true);

    // 第二次取消收藏
    const res = toggleBookmarkStorage(mockNewsItem);
    assert.strictEqual(res.isBookmarked, false);
    assert.strictEqual(res.bookmarks.length, 0);

    const loaded = loadBookmarks();
    assert.strictEqual(loaded.length, 0);
    assert.strictEqual(isNewsBookmarked(mockNewsItem.id), false);
  });

  it('当 localStorage 中数据损坏或为非 JSON 格式时，应优雅容错降级返回空数组', () => {
    memoryStorage.set('gemini_spark_bookmarks', 'invalid-corrupted-json-data{{{');
    const list = loadBookmarks();
    assert.deepStrictEqual(list, []);
  });
});
