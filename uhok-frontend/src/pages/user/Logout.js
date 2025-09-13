// React 관련 라이브러리 import
import React, { useEffect, useState } from 'react';
// React Router의 useNavigate 훅 import
import { useNavigate } from 'react-router-dom';
// userApi import
import { userApi } from '../../api/userApi';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';
// LoadingModal import
import ModalManager, { showLogoutCompleteNotification, hideModal } from '../../components/LoadingModal';
// 로그아웃 페이지 스타일 CSS 파일 import
import '../../styles/logout.css';

// ===== 로그아웃 페이지 컴포넌트 =====
// 사용자 로그아웃을 처리하는 페이지 컴포넌트
const Logout = () => {
  // ===== React Router 훅 =====
  // 페이지 이동을 위한 navigate 함수 가져오기
  const navigate = useNavigate();
  
  // ===== 사용자 Context 훅 =====
  // 사용자 정보 관리
  const { logout } = useUser();

  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ isVisible: false });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    // 모달 닫은 후 로그인 페이지로 이동
    navigate('/');
  };

  // ===== useEffect =====
  // 컴포넌트 마운트 시 자동 로그아웃 실행
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🚪 로그아웃 시작');
        
        // API 명세서에 맞춘 로그아웃 요청
        // POST /api/user/logout
        // Header: Authorization: Bearer <access_token>
        await userApi.logout();
        
        // 사용자 Context에서 로그아웃 처리
        logout();
        
        console.log('✅ 로그아웃 완료');
        
        // 로그아웃 완료 모달 표시
        setModalState(showLogoutCompleteNotification());
      } catch (error) {
        console.error('❌ 로그아웃 실패:', error);
        
        // 에러가 발생해도 로컬 상태는 정리
        logout();
        
        // 로그아웃 완료 모달 표시 (에러가 있어도 로컬 상태는 정리됨)
        setModalState(showLogoutCompleteNotification());
      }
    };

    performLogout();
  }, [logout, navigate]);

  // 로그아웃 진행 중 표시
  return (
    <>
      <div className="logout-container">
        <h1>U+hok</h1>
        <div className="logout-message">
          <p>로그아웃 중입니다...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </>
  );
};

// 컴포넌트를 기본 export로 내보내기
export default Logout;
