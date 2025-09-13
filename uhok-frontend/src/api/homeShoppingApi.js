// 홈쇼핑 관련 API 엔드포인트 관리
import api from '../pages/api';

export const homeShoppingApi = {
  // ===== 편성표 관련 =====
  
  // 편성표 조회
  getSchedule: async (liveDate = null) => {
    try {
      // liveDate가 없으면 오늘 날짜로 설정
      const today = new Date();
      const formattedDate = liveDate || today.toISOString().split('T')[0]; // yyyy-mm-dd 형식
      
      // API 요청 시 날짜 파라미터와 limit 파라미터 전달
      const params = {
        page: 1,
        size: 20
      };
      if (liveDate) {
        params.live_date = formattedDate;
      }
      
      const response = await api.get('/api/homeshopping/schedule', { params });
      return response;
    } catch (error) {
      console.error('❌ 편성표 조회 실패:', error);
      throw error;
    }
  },

  // 편성표 전체 데이터 조회 (페이지네이션을 통한 모든 데이터 수집)
  getScheduleAll: async (liveDate = null) => {
    try {
      // liveDate가 없으면 오늘 날짜로 설정
      const today = new Date();
      const formattedDate = liveDate || today.toISOString().split('T')[0]; // yyyy-mm-dd 형식
      
      let allSchedules = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 20; // 한 번에 가져올 데이터 개수
      let lastResponse = null; // 마지막 응답을 저장할 변수
      
      // 페이지네이션을 통해 모든 데이터 수집
      while (hasMore) {
        const params = {
          page: page,
          size: pageSize
        };
        
        if (liveDate) {
          params.live_date = formattedDate;
        }
        
        const response = await api.get('/api/homeshopping/schedule', { params });
        lastResponse = response; // 마지막 응답 저장
        
        if (response && response.data && response.data.schedules) {
          const schedules = response.data.schedules;
          allSchedules = [...allSchedules, ...schedules];
          
          // 더 이상 데이터가 없거나 페이지 크기보다 적으면 종료
          if (schedules.length === 0 || schedules.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      
      // 마지막 응답이 있으면 그 구조를 사용하고, 없으면 기본 구조 생성
      if (lastResponse) {
        const finalResponse = {
          ...lastResponse,
          data: {
            ...lastResponse.data,
            schedules: allSchedules
          }
        };
        return finalResponse;
      } else {
        // 응답이 없는 경우 기본 구조 반환
        return {
          data: {
            schedules: allSchedules
          }
        };
      }
      
    } catch (error) {
      console.error('❌ 편성표 전체 데이터 조회 실패:', error);
      throw error;
    }
  },

  // ===== 상품 관련 =====
  
  // 홈쇼핑 상품 상세 조회
  getProductDetail: async (liveId) => {
    try {
      const response = await api.get(`/api/homeshopping/product/${liveId}`);
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 상품 상세 조회 실패:', error);
      throw error;
    }
  },

  // 상품 기반 콕 상품 및 레시피 추천
  getKokRecommendations: async (productId) => {
    try {
      const response = await api.get(`/api/homeshopping/product/${productId}/kok-recommend`);
      return response.data;
    } catch (error) {
      console.error('❌ 콕 상품 추천 실패:', error);
      throw error;
    }
  },

  // 상품 분류 확인 (식재료/완제품)
  checkProductClassification: async (productId) => {
    try {
      const response = await api.get(`/api/homeshopping/product/${productId}/check`);
      return response.data;
    } catch (error) {
      console.error('❌ 상품 분류 확인 실패:', error);
      throw error;
    }
  },

  // 상품이 식재료/완제품인지 확인
  checkProductType: async (productId) => {
    try {
      const response = await api.get(`/api/homeshopping/product/${productId}/check`);
      return response.data;
    } catch (error) {
      console.error('❌ 상품 타입 확인 실패:', error);
      throw error;
    }
  },

  // 레시피 추천 (식재료인 경우)
  getRecipeRecommendations: async (productId) => {
    try {
      const response = await api.get(`/api/homeshopping/product/${productId}/recipe-recommend`);
      return response.data;
    } catch (error) {
      console.error('❌ 레시피 추천 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 라이브 영상 URL 조회 (homeshopping_id 또는 src 사용) - API 명세서와 일치
  getLiveStreamUrl: async (homeshoppingId, src = null) => {
    try {

      
      // API 명세서에 맞게 homeshopping_id 또는 src 중 하나를 사용
      const params = {};
      if (homeshoppingId) params.homeshopping_id = homeshoppingId;
      if (src) params.src = src;
      
      const response = await api.get('/api/homeshopping/schedule/live-stream', { params });
      
      // HTML 템플릿에서 m3u8 URL 추출 (API 명세서와 일치: window.__LIVE_SRC__)
      if (response.data && typeof response.data === 'string') {
        // API 명세서에 맞게 window.__LIVE_SRC__ 사용
        const match = response.data.match(/window\.__LIVE_SRC__\s*=\s*"([^"]+)"/);
        
        if (match && match[1]) {
          return {
            stream_url: match[1],
            html_template: response.data
          };
        }
      }
      return response.data;
    } catch (error) {
      console.error('❌ 라이브 스트림 URL 조회 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 라이브 스트림 HTML 템플릿 조회 (API 명세서와 일치)
  getLiveStreamTemplate: async (homeshoppingId = null, src = null) => {
    try {
      // API 명세서에 맞게 homeshopping_id 또는 src 중 하나를 사용
      const params = {};
      if (homeshoppingId) params.homeshopping_id = homeshoppingId;
      if (src) params.src = src;
      
      const response = await api.get('/api/homeshopping/schedule/live-stream', { params });
      return response.data;
    } catch (error) {
      console.error('❌ 라이브 스트림 HTML 템플릿 조회 실패:', error);
      throw error;
    }
  },

  // ===== 검색 관련 =====
  
  // 상품 검색
  searchProducts: async (keyword, page = 1, size = 20) => {
    try {
      const response = await api.get('/api/homeshopping/search', {
        params: { keyword, page, size }
      });
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 상품 검색 실패:', error);
      throw error;
    }
  },

  // 검색어 저장
  saveSearchHistory: async (keyword, token) => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await api.post('/api/homeshopping/search/history', { keyword }, { headers });
      return response.data;
    } catch (error) {
      console.error('❌ 검색어 저장 실패:', error);
      throw error;
    }
  },

  // 검색어 조회
  getSearchHistory: async (limit = 20, token) => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await api.get('/api/homeshopping/search/history', {
        params: { limit },
        headers
      });
      return response.data;
    } catch (error) {
      console.error('❌ 검색어 조회 실패:', error);
      throw error;
    }
  },

  // 검색어 삭제
  deleteSearchHistory: async (historyId, token) => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await api.delete('/api/homeshopping/search/history', {
        data: { homeshopping_history_id: historyId },
        headers
      });
      return response.data;
    } catch (error) {
      console.error('❌ 검색어 삭제 실패:', error);
      throw error;
    }
  },

  // ===== 찜 기능 =====
  
  // 상품 찜 등록/해제
  toggleProductLike: async (liveId) => {
    try {
      const response = await api.post('/api/homeshopping/likes/toggle', {
        live_id: liveId
      });
      return response.data;
    } catch (error) {
      console.error('❌ 상품 찜 토글 실패:', error);
      throw error;
    }
  },

  // 찜한 상품 목록 조회
  getLikedProducts: async (limit = 20) => {
    try {
      const response = await api.get('/api/homeshopping/likes', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ 찜한 상품 목록 조회 실패:', error);
      throw error;
    }
  },

  // ===== 주문 관련 =====
  
  // 홈쇼핑 주문 생성
  createOrder: async (productId, quantity = 1) => {
    try {
      const response = await api.post('/api/orders/homeshopping/order', {
        product_id: productId,
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 주문 생성 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 주문 상태 조회
  getOrderStatus: async (homeshoppingOrderId) => {
    try {
      const response = await api.get(`/api/orders/homeshopping/${homeshoppingOrderId}/status`);
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 주문 상태 조회 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 주문과 상태 함께 조회
  getOrderWithStatus: async (homeshoppingOrderId) => {
    try {
      const response = await api.get(`/api/orders/homeshopping/${homeshoppingOrderId}/with-status`);
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 주문과 상태 함께 조회 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 결제 확인(단건)
  confirmPayment: async (homeshoppingOrderId) => {
    try {
      const response = await api.post(`/api/orders/homeshopping/${homeshoppingOrderId}/payment/confirm`);
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 결제 확인 실패:', error);
      throw error;
    }
  },

  // 홈쇼핑 자동 상태 업데이트 시작 (테스트용)
  startAutoUpdate: async (homeshoppingOrderId) => {
    try {
      const response = await api.post(`/api/orders/homeshopping/${homeshoppingOrderId}/auto-update`);
      return response.data;
    } catch (error) {
      console.error('❌ 홈쇼핑 자동 상태 업데이트 시작 실패:', error);
      throw error;
    }
  },

  // ===== 알림 관련 =====
  
  // 주문 알림 조회
  getOrderNotifications: async (limit = 20, offset = 0) => {
    try {
      const response = await api.get('/api/homeshopping/notifications/orders', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('❌ 주문 알림 조회 실패:', error);
      throw error;
    }
  },

  // 방송 알림 조회
  getBroadcastNotifications: async (limit = 20, offset = 0) => {
    try {
      const response = await api.get('/api/homeshopping/notifications/broadcasts', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('❌ 방송 알림 조회 실패:', error);
      throw error;
    }
  },

  // 알림 내역 통합 조회 (주문 + 방송)
  getAllNotifications: async (limit = 20, offset = 0) => {
    try {
      const response = await api.get('/api/homeshopping/notifications/all', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('❌ 모든 알림 내역 조회 실패:', error);
      throw error;
    }
  }
};

export default homeShoppingApi;

// ===== 라이브 스트림 관련 API 함수 =====

// 편성표 데이터에서 homeshopping_id를 추출하는 함수
export function getHomeshoppingIdFromScheduleData(scheduleData) {
  if (!scheduleData || !scheduleData.homeshopping_id) {
    return null;
  }
  return scheduleData.homeshopping_id;
}

export async function fetchLiveStreamInfo(apiBase, homeshoppingUrl) {
  const u = new URL(`${apiBase}/schedule/live-stream/info`);
  u.searchParams.set("homeshopping_url", homeshoppingUrl);
  const res = await fetch(u.toString(), {
    credentials: "include", // 쿠키 기반 인증 시 필요
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`(${res.status}) ${text || "정보 조회 실패"}`);
  }
  const json = await res.json();
  // 키 유연 매핑 (백엔드 응답 키가 달라도 동작하도록)
  const m3u8 =
    json.stream_url ||
    json.playlist_url ||
    json.m3u8_url ||
    json.hls ||
    json.url ||
    null;

  return {
    channel: json.channel || json.channel_name || json.homeshopping_channel || "-",
    title: json.title || json.live_title || json.program_title || "-",
    source: json.source || json.homeshopping_url || json.original_url || "-",
    m3u8,
    raw: json,
  };
} 