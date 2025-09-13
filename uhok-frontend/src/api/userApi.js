import api from '../pages/api';

// 사용자 관련 API 함수들
export const userApi = {
  // ===== 인증 관련 =====
  
  // 로그인
  login: async (credentials) => {
    try {
      console.log('🚀 로그인 API 요청:', { email: credentials.email });
      
      // OAuth2 표준에 맞춰 폼 데이터 형식으로 전송
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      formData.append('scope', '');
      formData.append('client_id', '');
      formData.append('client_secret', '');
      
      const response = await api.post('/api/user/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('✅ 로그인 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      throw error;
    }
  },

  // 회원가입
  signup: async (userData) => {
    try {
      console.log('🚀 회원가입 API 요청:', { email: userData.email });
      const response = await api.post('/api/user/signup', userData);
      console.log('✅ 회원가입 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 회원가입 실패:', error);
      throw error;
    }
  },

  // 이메일 중복 확인
  checkEmailDuplicate: async (email) => {
    try {
      console.log('🚀 이메일 중복 확인 API 요청:', { email });
      const response = await api.get('/api/user/signup/email/check', {
        params: { email }
      });
      console.log('✅ 이메일 중복 확인 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 이메일 중복 확인 실패:', error);
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      console.log('🚀 로그아웃 API 요청');
      const response = await api.post('/api/user/logout');
      console.log('✅ 로그아웃 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      throw error;
    }
  },

  // ===== 사용자 정보 =====
  
  // 사용자 정보 조회 (명세서에 맞게 경로 수정)
  getProfile: async () => {
    try {
      console.log('🚀 사용자 정보 조회 API 요청');
      const response = await api.get('/api/user/info');
      console.log('✅ 사용자 정보 조회 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      throw error;
    }
  },

  // 사용자 프로필 수정 (명세서에 없는 기능이므로 제거)
  // updateProfile: async (profileData) => { ... },

  // ===== 활동 로그 =====
  
  // 사용자 활동 로그 기록 (명세서에 맞게 경로 수정)
  logActivity: async (activityData) => {
    try {
      console.log('🚀 사용자 활동 로그 API 요청:', activityData);
      const response = await api.post('/log', activityData);
      console.log('✅ 사용자 활동 로그 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 활동 로그 기록 실패:', error);
      // 활동 로그 실패는 무시 (사용자 경험에 영향 없음)
      return { success: false, message: '활동 로그 기록 실패' };
    }
  },

  // 사용자 활동 로그 조회 (명세서에 맞게 경로 수정)
  getActivityLogs: async (userId) => {
    try {
      console.log('🚀 사용자 활동 로그 조회 API 요청:', { userId });
      const response = await api.get(`/log/user/${userId}`);
      console.log('✅ 사용자 활동 로그 조회 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 활동 로그 조회 실패:', error);
      throw error;
    }
  }
};

export default userApi;
