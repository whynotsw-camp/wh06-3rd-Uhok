import api from '../pages/api';

// 로그 API 함수들
export const logApi = {
  // 사용자 로그 적재
  createUserLog: async (logData) => {
    try {
      // 토큰 가져오기
      const token = localStorage.getItem('access_token');
      
      // 데이터 검증 및 로깅
      console.log('📝 createUserLog 호출됨 - 원본 데이터:', logData);
      console.log('📝 createUserLog 호출됨 - logData 타입:', typeof logData);
      console.log('📝 createUserLog 호출됨 - logData가 null인가?', logData === null);
      console.log('📝 createUserLog 호출됨 - logData가 undefined인가?', logData === undefined);
      console.log('📝 createUserLog 호출됨 - logData 키들:', logData ? Object.keys(logData) : 'logData가 null/undefined');
      
      if (logData) {
        console.log('📝 createUserLog 호출됨 - 데이터 타입:', {
          actionType: typeof logData.action,
          pathType: typeof logData.path,
          labelType: typeof logData.label
        });
        console.log('📝 createUserLog 호출됨 - 각 필드 값:', {
          actionValue: logData.action,
          pathValue: logData.path,
          labelValue: logData.label
        });
      }
      
      // 백엔드에서 요구하는 형식으로 데이터 정리
      const cleanLogData = {
        action: logData?.action || 'unknown',
        path: logData?.path || 'unknown',
        label: logData?.label || 'unknown'
      };
      
      console.log('📝 createUserLog 호출됨 - 정리된 데이터:', cleanLogData);
      
      console.log('📝 사용자 로그 적재 API 요청:', cleanLogData);
      console.log('🔑 Authorization 헤더:', `Bearer ${token}`);
      
      // 올바른 헤더 설정
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // JWT 토큰
        'Accept': 'application/json'
      };
      
      const response = await api.post('/api/log/user/activity', cleanLogData, { headers });
      console.log('✅ 사용자 로그 적재 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 로그 적재 실패:', error);
      throw error;
    }
  },

  // 특정 사용자의 최근 로그 조회
  getUserLogs: async (userId) => {
    try {
      // 토큰 가져오기
      const token = localStorage.getItem('access_token');
      
      // 올바른 헤더 설정
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // JWT 토큰
        'Accept': 'application/json'
      };
      
      console.log('📋 사용자 로그 조회 API 요청:', { userId });
      const response = await api.get(`/api/log/user/activity/user/${userId}`, { headers });
      console.log('✅ 사용자 로그 조회 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 로그 조회 실패:', error);
      throw error;
    }
  }
};

export default logApi;
