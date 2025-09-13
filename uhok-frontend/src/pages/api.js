import axios from 'axios';

// 토큰 갱신 상태 관리
let isRefreshing = false;
let refreshPromise = null;

// JWT 토큰 만료 시간 확인 함수
const isTokenExpired = (token) => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return true;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 실제 만료 시간만 확인 (미리 갱신하지 않음)
    return payload.exp < currentTime;
  } catch (error) {
    console.warn('토큰 만료 시간 확인 실패:', error);
    return true;
  }
};

// 토큰이 곧 만료될지 확인하는 함수 (5분 전에 갱신)
const isTokenExpiringSoon = (token) => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return true;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60; // 5분을 초로 변환
    
    // 5분 이내에 만료될 예정이면 true 반환
    return payload.exp < (currentTime + fiveMinutes);
  } catch (error) {
    console.warn('토큰 만료 예정 시간 확인 실패:', error);
    return true;
  }
};

// 토큰 갱신 시도 함수 (중복 갱신 방지)
const attemptTokenRefresh = async () => {
  // 이미 갱신 중이면 기존 Promise 반환
  if (isRefreshing && refreshPromise) {
    console.log('토큰 갱신이 이미 진행 중입니다. 기존 Promise 대기...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.log('리프레시 토큰이 없습니다.');
        return false;
      }

      console.log('토큰 갱신 시도 중...');
      
      // 토큰 갱신 API 호출 - 여러 엔드포인트 시도
      let response;
      try {
        // 첫 번째 시도: 표준 refresh 엔드포인트
        response = await axios.post('/api/auth/refresh', {
          refresh_token: refreshToken
        });
      } catch (firstError) {
        console.log('첫 번째 토큰 갱신 시도 실패, 대체 엔드포인트 시도:', firstError.response?.status);
        
        try {
          // 두 번째 시도: 대체 엔드포인트
          response = await axios.post('/api/users/refresh-token', {
            refresh_token: refreshToken
          });
        } catch (secondError) {
          console.log('두 번째 토큰 갱신 시도 실패, 마지막 시도:', secondError.response?.status);
          
          // 세 번째 시도: 다른 형식
          response = await axios.post('/api/auth/token/refresh', {
            refresh_token: refreshToken
          });
        }
      }

      if (response && response.data && response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        console.log('✅ 토큰 갱신 성공');
        return true;
      }
      
      console.log('토큰 갱신 응답에 access_token이 없습니다:', response?.data);
      return false;
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error);
      
      // 개발 환경에서는 토큰 갱신 실패를 더 자세히 로깅
      if (process.env.NODE_ENV === 'development') {
        console.error('토큰 갱신 실패 상세:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      
      return false;
    } finally {
      // 갱신 완료 후 상태 초기화
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const api = axios.create({
  baseURL: '', // 프록시를 사용하므로 baseURL을 비워둠
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000, // 60초로 타임아웃 증가 (검색 히스토리 API 대응)
 });



// 요청 인터셉터: 토큰 자동 추가 및 로그인 상태 확인
api.interceptors.request.use(
  async (config) => {
    // 토큰이 있는 경우 헤더에 추가
    let token = localStorage.getItem('access_token');
    
    if (token) {
      // 토큰 만료 확인
      if (isTokenExpired(token)) {
        console.warn('토큰이 만료되었습니다. 갱신을 시도합니다.');
        
        // 토큰 갱신 시도
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          token = localStorage.getItem('access_token');
          console.log('토큰 갱신 후 요청 계속');
        } else {
          console.warn('토큰 갱신 실패. 토큰 없이 요청을 계속합니다.');
          // 토큰 갱신 실패 시에도 토큰을 제거하지 않고 요청을 계속
          // (서버에서 401 에러를 반환하면 해당 컴포넌트에서 처리하도록 함)
        }
      } else if (isTokenExpiringSoon(token)) {
        // 토큰이 곧 만료될 예정이면 미리 갱신 시도
        console.warn('토큰이 곧 만료될 예정입니다. 미리 갱신을 시도합니다.');
        
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          token = localStorage.getItem('access_token');
          console.log('토큰 미리 갱신 성공');
        } else {
          console.warn('토큰 미리 갱신 실패. 현재 토큰으로 요청 계속');
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // 인증이 필요한 페이지에서 토큰이 없으면 요청을 중단
      const currentPath = window.location.pathname;
      const authRequiredPaths = [
        '/notifications',
        '/cart',
        '/wishlist',
        '/orderlist',
        '/kok/payment',
        '/recipes'
      ];
      
      const isAuthRequiredPath = authRequiredPaths.some(path => currentPath.startsWith(path));
      
      if (isAuthRequiredPath) {
        console.log('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
        return Promise.reject(new Error('토큰이 없어서 요청을 중단합니다.'));
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 자동 로그아웃
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 500 에러 처리 (서버 내부 오류)
    if (error.response?.status === 500) {
      console.error('서버 내부 오류 발생:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // 500 에러는 서버 측 문제이므로 사용자에게 명확한 안내
      console.warn('500 에러는 서버 측 문제입니다. 백엔드 개발자에게 문의하세요.');
    }
    
    // 401 에러 처리 (인증 실패)
    if (error.response?.status === 401) {
      console.log('401 에러 발생:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        currentPath: window.location.pathname
      });
      
      // 토큰 갱신 시도
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        console.log('✅ 토큰 갱신 성공. 원래 요청을 재시도합니다.');
        // 원래 요청 재시도
        const originalRequest = error.config;
        const newToken = localStorage.getItem('access_token');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      
      // 토큰 갱신 실패 시 처리
      console.log('❌ 토큰 갱신 실패. 인증 상태를 정리합니다.');
      
      // 특정 페이지에서는 토큰을 삭제하지 않고 에러만 전달
      const currentPath = window.location.pathname;
      const tokenPreservePaths = ['/orderlist', '/mypage'];
      if (tokenPreservePaths.some(path => currentPath.startsWith(path))) {
        console.log(`${currentPath} 페이지에서 401 에러 - 토큰 유지하고 에러만 전달`);
        return Promise.reject(error);
      }
      
      // 다른 페이지에서는 토큰 제거 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('refresh_token');
      
      // 인증이 필요한 페이지에서 401 에러가 발생하면 로그인 페이지로 리다이렉트
      const authRequiredPaths = [
        '/notifications',
        '/cart',
        '/wishlist',
        '/kok/payment',
        '/recipes'
      ];
      
      const isAuthRequiredPath = authRequiredPaths.some(path => currentPath.startsWith(path));
      
      if (isAuthRequiredPath) {
        // 중복 알림 방지를 위해 한 번만 표시
        if (!window.sessionExpiredAlertShown) {
          window.sessionExpiredAlertShown = true;
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            window.sessionExpiredAlertShown = false;
          }, 1000);
        }
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
    // 404 에러 처리 (API 엔드포인트 없음)
    if (error.response?.status === 404) {
      console.log('API 엔드포인트가 존재하지 않습니다:', error.config.url);
      // 404 에러는 개발 환경에서 흔한 상황이므로 에러를 그대로 전달
      return Promise.reject(error);
    }
    
    // 403 에러 처리 (권한 없음)
    if (error.response?.status === 403) {
      console.error('권한이 없습니다:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: error.response.data
      });
      alert('해당 작업을 수행할 권한이 없습니다.');
      return Promise.reject(error);
    }
    
    // 422 에러 처리 (유효성 검증 실패)
    if (error.response?.status === 422) {
      console.error('422 유효성 검증 에러:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        requestData: error.config?.data
      });
      
      // 필드별 에러 상세 분석
      if (error.response.data?.detail && Array.isArray(error.response.data.detail)) {
        error.response.data.detail.forEach((err, index) => {
          console.error(`422 필드 에러 ${index + 1}:`, {
            type: err.type,
            location: err.loc,
            message: err.msg,
            input: err.input
          });
        });
      }
    }
    
    // 기타 에러들에 대한 로깅
    if (error.response) {
      console.error('API 응답 에러:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API 요청 에러 (응답 없음):', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        request: error.request
      });
    } else {
      console.error('API 설정 에러:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
