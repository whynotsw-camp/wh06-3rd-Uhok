// 토큰 갱신 테스트 유틸리티
export const tokenTestUtils = {
  // 토큰 만료 시간을 확인하는 함수
  getTokenExpiry: (token) => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiryTime = new Date(payload.exp * 1000);
      const currentTime = new Date();
      const timeUntilExpiry = expiryTime - currentTime;
      
      return {
        expiryTime,
        currentTime,
        timeUntilExpiry,
        isExpired: timeUntilExpiry <= 0,
        minutesUntilExpiry: Math.floor(timeUntilExpiry / (1000 * 60))
      };
    } catch (error) {
      console.error('토큰 만료 시간 확인 실패:', error);
      return null;
    }
  },

  // 토큰 정보를 콘솔에 출력하는 함수
  logTokenInfo: (token) => {
    const tokenInfo = tokenTestUtils.getTokenExpiry(token);
    if (tokenInfo) {
      console.log('🔍 토큰 정보:', {
        만료시간: tokenInfo.expiryTime.toLocaleString('ko-KR'),
        현재시간: tokenInfo.currentTime.toLocaleString('ko-KR'),
        만료까지남은시간: `${tokenInfo.minutesUntilExpiry}분`,
        만료여부: tokenInfo.isExpired ? '만료됨' : '유효함'
      });
    } else {
      console.log('❌ 토큰 정보를 확인할 수 없습니다.');
    }
  },

  // 토큰 갱신 테스트 함수
  testTokenRefresh: async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🧪 토큰 갱신 테스트 시작');
    console.log('현재 access_token:', token ? '있음' : '없음');
    console.log('현재 refresh_token:', refreshToken ? '있음' : '없음');
    
    if (token) {
      tokenTestUtils.logTokenInfo(token);
    }
    
    // 토큰 갱신 시도
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 토큰 갱신 성공:', data);
        
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          console.log('새로운 토큰 정보:');
          tokenTestUtils.logTokenInfo(data.access_token);
        }
      } else {
        console.log('❌ 토큰 갱신 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 에러:', error);
    }
  }
};

// 개발 환경에서만 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.tokenTestUtils = tokenTestUtils;
  console.log('🧪 토큰 테스트 유틸리티가 전역으로 등록되었습니다. window.tokenTestUtils를 사용하세요.');
}
