// API 캐싱 유틸리티
class ApiCache {
  constructor(ttl = 5 * 60 * 1000) { // 기본 5분 TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}_${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // TTL 확인
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  // 특정 패턴의 캐시 삭제
  clearPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// 전역 캐시 인스턴스
export const apiCache = new ApiCache();

// React Query 스타일의 간단한 캐싱 훅
export const useApiCache = () => {
  const cache = apiCache;

  const getCachedData = (url, params) => {
    const key = cache.generateKey(url, params);
    return cache.get(key);
  };

  const setCachedData = (url, params, data) => {
    const key = cache.generateKey(url, params);
    cache.set(key, data);
  };

  const clearCache = (pattern) => {
    if (pattern) {
      cache.clearPattern(pattern);
    } else {
      cache.clear();
    }
  };

  return {
    getCachedData,
    setCachedData,
    clearCache
  };
};

// 중복 요청 방지를 위한 요청 관리자
class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
  }

  async request(key, requestFn) {
    // 이미 진행 중인 요청이 있으면 기존 요청 반환
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // 새로운 요청 생성
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestManager = new RequestManager();
