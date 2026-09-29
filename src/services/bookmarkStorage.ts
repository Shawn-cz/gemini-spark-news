import { GlobalNewsItem } from '../types/news';

const BOOKMARKS_STORAGE_KEY = 'gemini_spark_bookmarks';
const BOOKMARKS_CHANGED_EVENT = 'gemini_spark_bookmarks_changed';

/**
 * 从本地存储加载所有已收藏的智库研报列表
 */
export function loadBookmarks(): GlobalNewsItem[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('[BookmarkStorage] 读取本地收藏失败:', err);
    return [];
  }
}

/**
 * 持久化保存研报列表至本地存储，并向全站分发同步事件
 */
export function saveBookmarks(bookmarks: GlobalNewsItem[]): void {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: bookmarks })
    );
  } catch (err) {
    console.error('[BookmarkStorage] 写入本地收藏异常:', err);
  }
}

/**
 * 校验指定研报是否已被收藏
 */
export function isNewsBookmarked(id: string, cachedBookmarks?: GlobalNewsItem[]): boolean {
  if (!id) return false;
  const list = cachedBookmarks || loadBookmarks();
  return list.some(item => item.id === id);
}

/**
 * 切换收藏状态（收藏/取消收藏），原子化更新本地持久化
 */
export function toggleBookmarkStorage(news: GlobalNewsItem): {
  isBookmarked: boolean;
  bookmarks: GlobalNewsItem[];
} {
  const current = loadBookmarks();
  const exists = current.some(item => item.id === news.id);

  let updated: GlobalNewsItem[];
  if (exists) {
    updated = current.filter(item => item.id !== news.id);
  } else {
    // 新增至首位，保留全量研报元数据
    updated = [news, ...current];
  }

  saveBookmarks(updated);
  return {
    isBookmarked: !exists,
    bookmarks: updated
  };
}

/**
 * 订阅全站及跨标签页的收藏变更事件
 */
export function subscribeBookmarks(callback: (bookmarks: GlobalNewsItem[]) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<GlobalNewsItem[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(loadBookmarks());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === BOOKMARKS_STORAGE_KEY) {
      callback(loadBookmarks());
    }
  };

  window.addEventListener(BOOKMARKS_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
