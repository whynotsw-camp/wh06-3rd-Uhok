// React 관련 라이브러리 import
import React, { useState } from 'react';
// React Router의 useNavigate와 Link 훅/컴포넌트 import
import { useNavigate, Link } from 'react-router-dom';
// userApi import
import { userApi } from '../../api/userApi';
// 회원가입 페이지 스타일 CSS 파일 import
import '../../styles/signup.css';
// 모달 관리자 컴포넌트 import
import ModalManager, { showAlert, hideModal } from '../../components/LoadingModal';

// ===== 회원가입 페이지 컴포넌트 =====
// 사용자 회원가입을 처리하는 페이지 컴포넌트
const Signup = () => {
  // ===== 상태 관리 =====
  // 이메일 입력값 상태 관리
  const [email, setEmail] = useState('');
  // 이메일 중복 확인 완료 여부 상태 관리
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  // 이메일 중복 확인 결과 메시지 상태 관리
  const [emailMessage, setEmailMessage] = useState('');
  // 비밀번호 입력값 상태 관리
  const [password, setPassword] = useState('');
  // 비밀번호 확인 입력값 상태 관리
  const [confirmPassword, setConfirmPassword] = useState('');
  // 사용자 이름 입력값 상태 관리
  const [username, setUsername] = useState('');
  // 에러 메시지 상태 관리
  const [errorMsg, setErrorMsg] = useState('');
  // 로딩 상태 관리
  const [loading, setLoading] = useState(false);
  // 이메일 확인 로딩 상태 관리
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });

  // ===== React Router 훅 =====
  // 페이지 이동을 위한 navigate 함수 가져오기
  const navigate = useNavigate();

  // ===== 모달 관련 함수 =====
  // 알림 모달 표시 함수
  const showAlertModal = (message, buttonText = "확인", buttonStyle = "primary") => {
    setModalState(showAlert(message, buttonText, buttonStyle));
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
    // 회원가입 성공 후 모달이 닫히면 로그인 페이지로 이동
    if (modalState.modalType === 'alert' && modalState.alertButtonStyle === 'primary') {
      navigate('/login');
    }
  };

  // ===== 이벤트 핸들러 함수들 =====
  
  // 이메일 중복 확인 핸들러 함수 (API 명세서에 맞춘 비동기 처리)
  const handleEmailCheck = async () => {
    // 이메일이 비어있는 경우 처리
    if (!email.trim()) {
      setEmailMessage('이메일을 입력해주세요.');
      return;
    }
    
    try {
      setEmailCheckLoading(true);
      setEmailMessage('');
      
      // API 명세서에 맞춘 이메일 중복 확인 요청
      // GET /api/user/signup/email/check?email=test@example.com
      const response = await userApi.checkEmailDuplicate(email);
      
      console.log('이메일 중복 확인 API 응답:', response);

      // API 명세서 응답 형식에 맞춘 처리
      // Response: { "email": "test@example.com", "is_duplicate": true, "message": "string" }
      if (response.is_duplicate) {
        // 중복된 경우 (이미 존재하는 이메일)
        setEmailMessage(response.message || '이미 존재하는 아이디입니다.');
        setIsEmailChecked(false);
      } else {
        // 중복되지 않은 경우 (사용 가능한 이메일)
        setEmailMessage('사용 가능한 아이디입니다.');
        setIsEmailChecked(true);
      }
    } catch (err) {
      console.error('이메일 중복 확인 API 에러:', err);
      
      // API 서버 연결 실패 시 임시 처리 (개발용)
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.log('API 서버 연결 실패, 임시 이메일 확인 처리 (개발용)');
        setEmailMessage('사용 가능한 아이디입니다. (개발용)');
        setIsEmailChecked(true);
        return;
      }
      
      // 서버 에러 응답 처리
      if (err.response) {
        const errorMessage = err.response.data?.message || '이메일 중복 확인에 실패했습니다.';
        setEmailMessage(errorMessage);
        setIsEmailChecked(false);
        console.error('서버 에러 응답:', err.response.data);
      } else {
        setEmailMessage('이메일 중복 확인에 실패했습니다.');
        setIsEmailChecked(false);
      }
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // 회원가입 제출 핸들러 함수 (API 명세서에 맞춘 비동기 처리)
  const handleSignup = async (e) => {
    // 기본 폼 제출 동작 방지
    e.preventDefault();

    // 이메일 중복 확인이 완료되지 않은 경우
    if (!isEmailChecked) {
      setErrorMsg('이메일 중복 확인을 해주세요.');
      return;
    }

    // 비밀번호와 비밀번호 확인이 일치하지 않는 경우
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      
      // API 명세서에 맞춘 회원가입 요청
      // POST /api/user/signup
      // Body: { "email": "user@example.com", "password": "string", "username": "string" }
      const response = await userApi.signup({
        email: email,
        password: password,
        username: username
      });
      
      console.log('회원가입 API 응답:', response);

      // API 명세서 응답 형식에 맞춘 처리
      // Response: { "user_id": 0, "email": "user@example.com", "username": "string", "created_at": "2025-08-10T02:44:56.611Z" }
      if (response.user_id) {
        console.log('회원가입 성공 - 사용자 ID:', response.user_id);
        
        // 회원가입 성공 시 알림 표시
        showAlertModal('회원가입이 완료되었습니다!', '로그인', 'primary');
      } else {
        setErrorMsg('회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error('회원가입 API 에러:', err);
      
              // API 서버 연결 실패 시 임시 처리 (개발용)
        if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
          console.log('API 서버 연결 실패, 임시 회원가입 처리 (개발용)');
          showAlertModal('회원가입이 완료되었습니다! (개발용)', '로그인', 'primary');
          return;
        }
      
      // 서버 에러 응답 처리
      if (err.response) {
        const errorMessage = err.response.data?.message || '회원가입에 실패했습니다.';
        setErrorMsg(errorMessage);
        console.error('서버 에러 응답:', err.response.data);
      } else {
        setErrorMsg('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 페이지 JSX 반환
  return (
    // 회원가입 페이지 컨테이너
    <div>
      {/* 앱 제목 */}
      <h1>U+hok</h1>
      
      {/* 회원가입 폼 */}
      <form className="signup-form" onSubmit={handleSignup}>
        {/* 이메일 중복 확인 그룹 */}
        <div className="email-check-group">
          {/* 이메일 입력 필드 */}
          <input
            type="email" // 이메일 입력 타입으로 변경
            placeholder="이메일" // 입력 안내 텍스트
            value={email} // 현재 이메일 상태값
            onChange={(e) => {
              setEmail(e.target.value); // 이메일 상태 업데이트
              setIsEmailChecked(false); // 이메일 변경 시 중복 확인 상태 초기화
              setEmailMessage(''); // 이메일 메시지 초기화
            }}
            required // 필수 입력 필드
          />
          {/* 이메일 중복 확인 버튼 */}
          <button 
            type="button" 
            onClick={handleEmailCheck}
            disabled={emailCheckLoading}
          >
            {emailCheckLoading ? '확인 중...' : '중복 확인'}
          </button>
        </div>

        {/* 이메일 중복 확인 결과 메시지 표시 */}
        {emailMessage && <p className="email-message">{emailMessage}</p>}

        {/* 비밀번호 입력 필드 */}
        <input
          type="password" // 비밀번호 입력 타입 (마스킹 처리)
          placeholder="비밀번호" // 입력 안내 텍스트
          value={password} // 현재 비밀번호 상태값
          onChange={(e) => setPassword(e.target.value)} // 비밀번호 변경 시 상태 업데이트
          required // 필수 입력 필드
        />

        {/* 비밀번호 확인 입력 필드 */}
        <input
          type="password" // 비밀번호 입력 타입 (마스킹 처리)
          placeholder="비밀번호 확인" // 입력 안내 텍스트
          value={confirmPassword} // 현재 비밀번호 확인 상태값
          onChange={(e) => setConfirmPassword(e.target.value)} // 비밀번호 확인 변경 시 상태 업데이트
          required // 필수 입력 필드
        />

        {/* 사용자 이름 입력 필드 */}
        <input
          type="text" // 텍스트 입력 타입
          placeholder="이름" // 입력 안내 텍스트
          value={username} // 현재 사용자 이름 상태값
          onChange={(e) => setUsername(e.target.value)} // 사용자 이름 변경 시 상태 업데이트
          required // 필수 입력 필드
        />

        {/* 에러 메시지 표시 */}
        {errorMsg && <p className="error-message">{errorMsg}</p>}

        {/* 회원가입 버튼 */}
        <button type="submit" disabled={loading}>
          {loading ? '회원가입 중...' : '회원가입'}
        </button>

        {/* 로그인 링크 영역 */}
        <div className="login-link">
          {/* 로그인 페이지로 이동하는 링크 */}
          <Link to="/login">로그인</Link>
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
export default Signup;
