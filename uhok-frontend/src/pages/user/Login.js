// React 관련 라이브러리 import
import React, { useState } from 'react';
// React Router의 Link와 useNavigate 훅 import
import { Link, useNavigate } from 'react-router-dom';
// userApi import
import { userApi } from '../../api/userApi';
// 로그인 페이지 스타일 CSS 파일 import
import '../../styles/login.css';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';
// 모달 관리자 컴포넌트 import
import ModalManager, { showAlert, hideModal } from '../../components/LoadingModal';

// ===== 로그인 페이지 컴포넌트 =====
// 사용자 로그인을 처리하는 페이지 컴포넌트
const Login = () => {
  // ===== 상태 관리 =====
  // 이메일 입력값 상태 관리
  const [email, setEmail] = useState('');
  // 비밀번호 입력값 상태 관리
  const [password, setPassword] = useState('');
  // 로딩 상태 관리
  const [loading, setLoading] = useState(false);
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });


  // ===== React Router 훅 =====
  // 페이지 이동을 위한 navigate 함수 가져오기
  const navigate = useNavigate();
  
  // ===== 사용자 Context 훅 =====
  // 사용자 정보 관리
  const { login } = useUser();

  // ===== 모달 관련 함수 =====
  // 알림 모달 표시 함수
  const showAlertModal = (message, buttonText = "확인", buttonStyle = "primary") => {
    setModalState(showAlert(message, buttonText, buttonStyle));
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };

  // ===== 이벤트 핸들러 함수 =====
  // 폼 제출 핸들러 함수 (API 명세서에 맞춘 비동기 처리)
  const handleSubmit = async (e) => {
    // 기본 폼 제출 동작 방지
    e.preventDefault();
    
    // 로딩 상태 설정
    setLoading(true);
    
    // 콘솔에 로그인 시도 정보 출력
    console.log('로그인 시도:', { email, password });

    // 입력 데이터 검증
    if (!email.trim()) {
      showAlertModal('이메일을 입력해주세요.');
      setLoading(false);
      return;
    }
    
    if (!password.trim()) {
      showAlertModal('비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // API 명세서에 맞춘 로그인 요청
      // POST /api/user/login
      // Request body: { "email": "user@example.com", "password": "secure_password" }
      const requestData = {
        email: email.trim(),
        password: password.trim()
      };
      
      console.log('로그인 요청 데이터:', requestData);
      console.log('요청 URL:', '/api/user/login');
      
      // 새로운 userApi 사용
      const response = await userApi.login(requestData);
      
      console.log('로그인 API 응답:', response);

      // API 명세서 응답 형식에 맞춘 처리
      // Response: { "access_token": "eyJhbGciOiJIUzI1...", "token_type": "bearer" }
      if (response && response.access_token) {
        console.log('백엔드에서 토큰을 성공적으로 받았습니다!');
        
        // 사용자 정보 조회 (API 명세서에 맞춘 처리)
        let userData;
        try {
          const userInfo = await userApi.getProfile();
          console.log('사용자 정보 조회 성공:', userInfo);
          
          // 사용자 Context에 로그인 정보 저장
          userData = {
            token: response.access_token,
            tokenType: response.token_type,
            email: email,
            user_id: userInfo.user_id,
            username: userInfo.username
          };
          await login(userData);
        } catch (error) {
          console.error('사용자 정보 조회 실패:', error);
          // 사용자 정보 조회 실패 시에도 기본 정보로 로그인 진행
          userData = {
            token: response.access_token,
            tokenType: response.token_type,
            email: email
          };
          await login(userData);
        }
        
        console.log('로그인 성공 - 백엔드 토큰 저장 완료:', userData);
        console.log('저장된 토큰 확인:', {
          access_token: localStorage.getItem('access_token'),
          token_type: localStorage.getItem('token_type')
        });
        // 로그인 성공 시 메인 페이지로 이동
        navigate('/main');
      } else {
        // 토큰이 없는 경우 에러 처리
        console.error('백엔드 응답에 토큰이 없습니다:', response);
        showAlertModal('로그인에 실패했습니다. 토큰을 받지 못했습니다.');
      }
    } catch (err) {
      console.error('로그인 API 에러:', err);
      
      // API 서버 연결 실패 시 에러 처리
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.log('API 서버 연결 실패');
        showAlertModal('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        return;
      }
      
      // 422 에러 처리 - 임시 로그인 비활성화
      if (err.response?.status === 422) {
        console.log('422 에러 발생 - 백엔드 API 문제');
        console.error('422 에러 상세 정보:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        console.error('422 에러 데이터 상세:', JSON.stringify(err.response.data, null, 2));
        
        // 백엔드에서 전달하는 구체적인 에러 메시지 표시
        const errorData = err.response.data;
        if (errorData.detail) {
          showAlertModal(`백엔드 API 오류: ${JSON.stringify(errorData.detail)}`);
        } else if (errorData.message) {
          showAlertModal(`백엔드 API 오류: ${errorData.message}`);
        } else {
          showAlertModal('백엔드 API에서 422 오류가 발생했습니다. 백엔드 개발자에게 문의하세요.');
        }
        return; // 임시 로그인 처리하지 않고 에러 메시지만 표시
      }
      
      // 서버 에러 응답 처리
      if (err.response) {
        console.error('서버 에러 상세 정보:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
        
        // 422 에러는 이미 위에서 처리했으므로 다른 에러만 처리
        if (err.response.status !== 422) {
          const errorMessage = err.response.data?.message || '로그인에 실패했습니다.';
          showAlertModal(errorMessage);
        }
      } else {
        showAlertModal('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      // 로딩 상태 해제
      setLoading(false);
    }
  };

    // 로그인 페이지 JSX 반환
  return (
    // 로그인 페이지 컨테이너
    <div>
      {/* 앱 제목 */}
      <h1>U+hok</h1>
      
      {/* 로그인 폼 */}
      <form className="login-form" onSubmit={handleSubmit}>
        {/* 이메일 입력 필드 */}
        <input
          type="email" // 이메일 입력 타입으로 변경
          placeholder="이메일" // 입력 안내 텍스트
          value={email} // 현재 이메일 상태값
          onChange={(e) => setEmail(e.target.value)} // 이메일 변경 시 상태 업데이트
          required // 필수 입력 필드
        />
        
        {/* 비밀번호 입력 필드 */}
        <input
          type="password" // 비밀번호 입력 타입 (마스킹 처리)
          placeholder="비밀번호" // 입력 안내 텍스트
          value={password} // 현재 비밀번호 상태값
          onChange={(e) => setPassword(e.target.value)} // 비밀번호 변경 시 상태 업데이트
          required // 필수 입력 필드
        />
        
        
        
        {/* 로그인 버튼 */}
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {/* 회원가입 링크 영역 */}
        <div className="signup-link">
          {/* 회원가입 페이지로 이동하는 링크 */}
          <Link to="/signup">회원가입</Link>
        </div>
      </form>

      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={closeModal}
      />
    </div>
  );
};

// 컴포넌트를 기본 export로 내보내기
export default Login;