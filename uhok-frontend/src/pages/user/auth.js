// 공통 API 설정 모듈 import
import api from '../api';

// ===== 사용자 인증 관련 API 함수들 =====

// ===== 로그인 API 함수 =====
// 사용자 로그인을 처리하는 API 함수
// Login.js 컴포넌트에서 사용됨
export const login = async ({ email, password }) => {
  // URLSearchParams 객체 생성 (폼 데이터 형식으로 전송하기 위함)
  const formData = new URLSearchParams();
  // FastAPI에서 username으로 받는 것에 맞춰 email을 username으로 전송
  formData.append('username', email);
  // 비밀번호 추가
  formData.append('password', password);

  // try-catch 블록으로 에러 처리
  try {
    // 로그인 API 엔드포인트로 POST 요청 전송
    const response = await api.post('/api/user/login', formData, {
      headers: {
        // 폼 데이터 형식으로 전송하기 위한 Content-Type 설정
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    // 성공 시 응답 데이터 반환
    return response.data;
  } catch (error) {
    // 에러 발생 시 에러 메시지 추출 및 처리
    const message =
      error.response?.data?.message || // 서버에서 전달한 에러 메시지
      error.message || // 기본 에러 메시지
      '로그인 실패'; // 기본값
    // 에러를 다시 던져서 호출한 컴포넌트에서 처리할 수 있도록 함
    throw new Error(message);
  }
};

// ===== 회원가입 API 함수 =====
// 사용자 회원가입을 처리하는 API 함수
// Signup.js 컴포넌트에서 사용됨
export const signup = async ({ email, password, password_confirm, username }) => {
  // try-catch 블록으로 에러 처리
  try {
    // 회원가입 API 엔드포인트로 POST 요청 전송
    const response = await api.post('/api/user/signup', {
      email,      // 이메일
      password,   // 비밀번호
      username,   // 사용자 이름
    });
    // 성공 시 응답 데이터 반환
    return response.data;
  } catch (error) {
    // 에러 발생 시 에러 메시지 추출 및 처리
    const message =
      error.response?.data?.message || // 서버에서 전달한 에러 메시지
      error.message || // 기본 에러 메시지
      '회원가입 실패'; // 기본값
    // 에러를 다시 던져서 호출한 컴포넌트에서 처리할 수 있도록 함
    throw new Error(message);
  }
};

// ===== 이메일 중복 확인 API 함수 =====
// 회원가입 시 이메일 중복 여부를 확인하는 API 함수
// Signup.js 컴포넌트에서 사용됨
export const checkEmail = async (email) => {
  // try-catch 블록으로 에러 처리
  try {
    // 이메일 중복 확인 API 엔드포인트로 GET 요청 전송
    const response = await api.get('/api/user/signup/email/check', {
      params: { email }, // URL 파라미터로 이메일 전송
    });
    // 성공 시 응답 데이터 반환 (중복 여부 정보 포함)
    return response.data;
  } catch (error) {
    // 에러 발생 시 에러 메시지 추출 및 처리
    const message =
      error.response?.data?.message || // 서버에서 전달한 에러 메시지
      error.message || // 기본 에러 메시지
      '이메일 중복 확인 실패'; // 기본값
    // 에러를 다시 던져서 호출한 컴포넌트에서 처리할 수 있도록 함
    throw new Error(message);
  }
};
