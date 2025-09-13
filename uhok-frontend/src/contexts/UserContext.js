import React, { createContext, useContext, useState, useEffect } from 'react';
import { logApi } from '../api/logApi';

// 사용자 Context 생성
const UserContext = createContext();

// 토큰 유효성 검사 함수
const validateToken = (token) => {
  if (!token) return false;
  
  // 개발용 토큰인지 먼저 확인
  if (token.includes('dev_signature_') || token.startsWith('temp_token_')) {
    console.log('개발용 토큰 감지, 검증 성공');
    return true;
  }
  
  try {
    // JWT 형식 검사 (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('토큰 형식이 올바르지 않습니다 (3개 부분이 아님)');
      return false;
    }
    
    // payload 디코딩 시도
    const payload = JSON.parse(atob(parts[1]));
    
    // 만료 시간 검사 (여유 시간 없이 정확히 검사)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log('토큰이 만료되었습니다. exp:', payload.exp, 'current:', currentTime, 'diff:', currentTime - payload.exp);
      return false;
    }
    
    console.log('토큰 검증 성공:', { sub: payload.sub, exp: payload.exp });
    return true;
  } catch (error) {
    console.log('토큰 형식이 올바르지 않습니다:', error.message);
    return false;
  }
};

// 토큰이 곧 만료될지 확인하는 함수 (5분 전에 갱신)
const isTokenExpiringSoon = (token) => {
  if (!token) return false;
  
  // 개발용 토큰은 항상 유효
  if (token.includes('dev_signature_') || token.startsWith('temp_token_')) {
    return false;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60; // 5분을 초로 변환
    
    // 5분 이내에 만료될 예정이면 true 반환
    return payload.exp < (currentTime + fiveMinutes);
  } catch (error) {
    console.warn('토큰 만료 예정 시간 확인 실패:', error);
    return true;
  }
};

// 토큰 갱신 시도 함수
const attemptTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('리프레시 토큰이 없습니다.');
      return false;
    }

    console.log('UserContext - 토큰 갱신 시도 중...');
    
    // 토큰 갱신 API 호출 - 여러 엔드포인트 시도
    let response;
    let data;
    
    try {
      // 첫 번째 시도: 표준 refresh 엔드포인트
      response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });
      
      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (firstError) {
      console.log('UserContext - 첫 번째 토큰 갱신 시도 실패, 대체 엔드포인트 시도:', firstError.message);
      
      try {
        // 두 번째 시도: 대체 엔드포인트
        response = await fetch('/api/users/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          })
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (secondError) {
        console.log('UserContext - 두 번째 토큰 갱신 시도 실패, 마지막 시도:', secondError.message);
        
        // 세 번째 시도: 다른 형식
        response = await fetch('/api/auth/token/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          })
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    }

    if (data && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      console.log('✅ UserContext - 토큰 갱신 성공');
      return true;
    }
    
    console.log('UserContext - 토큰 갱신 응답에 access_token이 없습니다:', data);
    return false;
  } catch (error) {
    console.error('❌ UserContext - 토큰 갱신 실패:', error);
    
    // 개발 환경에서는 토큰 갱신 실패를 더 자세히 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('UserContext - 토큰 갱신 실패 상세:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return false;
  }
};

// 사용자 정보 Provider 컴포넌트
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');
    
    console.log('UserContext - 초기화 중:', { 
      hasToken: !!token, 
      tokenType,
      tokenLength: token?.length 
    });
    
    if (token) {
      // 토큰이 있으면 검증 시도
      const isValid = validateToken(token);
      
      if (isValid) {
        // 토큰이 유효하면 로그인 상태로 설정
        console.log('UserContext - 유효한 토큰으로 로그인 상태 설정');
        setUser({
          token: token,
          tokenType: tokenType || 'bearer',
          isLoggedIn: true
        });
      } else {
        console.log('UserContext - 유효하지 않은 토큰 제거');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        setUser(null);
      }
    } else {
      console.log('UserContext - 로컬 스토리지에 토큰이 없습니다.');
      setUser(null);
    }
    
    // 항상 로딩 상태를 false로 설정
    setIsLoading(false);
    console.log('UserContext - 초기화 완료, isLoading: false');
  }, []);

  // 토큰 만료 감지를 위한 주기적 검증
  useEffect(() => {
    if (!user || !user.token) return;
    
    const checkTokenExpiry = async () => {
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        console.log('UserContext - 로컬 스토리지에 토큰이 없음, 로그아웃');
        logout();
        return;
      }
      
      const isValid = validateToken(currentToken);
      if (!isValid) {
        console.log('UserContext - 토큰 만료 감지, 자동 로그아웃');
        logout();
        return;
      }
      
      // 토큰이 곧 만료될 예정이면 미리 갱신 시도
      if (isTokenExpiringSoon(currentToken)) {
        console.log('UserContext - 토큰이 곧 만료될 예정, 미리 갱신 시도');
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          const newToken = localStorage.getItem('access_token');
          setUser(prev => prev ? { ...prev, token: newToken } : null);
          console.log('UserContext - 토큰 미리 갱신 성공');
        } else {
          console.log('UserContext - 토큰 미리 갱신 실패');
        }
      }
    };
    
    // 1분마다 토큰 검증
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // 로그인 함수
  const login = async (userData) => {
    console.log('UserContext - 로그인 함수 호출:', userData);
    
    // 토큰을 로컬 스토리지에 저장
    if (userData.token) {
      localStorage.setItem('access_token', userData.token);
      localStorage.setItem('token_type', userData.tokenType || 'bearer');
      
      // 리프레시 토큰이 있다면 저장
      if (userData.refresh_token) {
        localStorage.setItem('refresh_token', userData.refresh_token);
      }
    }
    
    setUser({
      ...userData,
      isLoggedIn: true
    });
    
    console.log('UserContext - 사용자 정보 설정 완료:', {
      hasToken: !!userData.token,
      email: userData.email,
      isLoggedIn: true
    });

    // 로그인 이벤트 로그 기록 (API 명세서에 맞춘 처리)
    try {
      if (userData.user_id) {
        await logApi.createUserLog({
          action: 'user_login',
          path: '/login',
          label: '사용자 로그인',
          user_id: userData.user_id,
          event_type: 'USER_LOGIN',
          event_data: {
            email: userData.email,
            login_time: new Date().toISOString()
          }
        });
        console.log('✅ 로그인 이벤트 로그 기록 완료');
      }
    } catch (error) {
      console.error('❌ 로그인 이벤트 로그 기록 실패:', error);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    console.log('UserContext - 로그아웃 함수 호출');
    
    // 로그아웃 이벤트 로그 기록 (API 명세서에 맞춘 처리)
    try {
      if (user && user.user_id) {
        await logApi.createUserLog({
          action: 'user_logout',
          path: '/logout',
          label: '사용자 로그아웃',
          user_id: user.user_id,
          event_type: 'USER_LOGOUT',
          event_data: {
            email: user.email,
            logout_time: new Date().toISOString()
          }
        });
        console.log('✅ 로그아웃 이벤트 로그 기록 완료');
      }
    } catch (error) {
      console.error('❌ 로그아웃 이벤트 로그 기록 실패:', error);
    }

    // 로컬 스토리지에서 모든 토큰 제거
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('refresh_token');
    
    // 사용자 상태 초기화
    setUser(null);
    console.log('UserContext - 로그아웃 완료');
  };

  // 토큰 갱신 함수 (외부에서 호출 가능)
  const refreshToken = async () => {
    console.log('UserContext - 토큰 갱신 시도');
    
    // 리프레시 토큰이 있는지 먼저 확인
    const hasRefreshToken = localStorage.getItem('refresh_token');
    if (!hasRefreshToken) {
      console.log('UserContext - 리프레시 토큰이 없어서 갱신 불가능');
      return false;
    }
    
    const success = await attemptTokenRefresh();
    
    if (success) {
      const newToken = localStorage.getItem('access_token');
      setUser(prev => prev ? { ...prev, token: newToken } : null);
      console.log('UserContext - 토큰 갱신 성공');
      return true;
    } else {
      console.log('UserContext - 토큰 갱신 실패');
      // 갱신 실패 시 자동 로그아웃하지 않음 (호출하는 쪽에서 처리하도록 함)
      return false;
    }
  };

  // 토큰 업데이트 함수
  const updateToken = (token, tokenType) => {
    if (token) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('token_type', tokenType || 'bearer');
    }
    
    setUser(prev => ({
      ...prev,
      token,
      tokenType: tokenType || 'bearer'
    }));
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateToken,
    refreshToken,
    isLoggedIn: !!user && !!user.isLoggedIn && !!user.token
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 사용자 Context 사용을 위한 Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
