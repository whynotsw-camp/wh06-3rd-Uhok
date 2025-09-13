import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import '../styles/header_nav_Noti.css';

// 알림 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 알림 텍스트), 중앙(빈 공간)
const HeaderNavNoti = ({ onBackClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-noti-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="noti-title">알림</span>
      </div>
      
      <div className="hn-noti-center" aria-hidden="true" />
    </HeaderNavFrame>
  );
};

export default HeaderNavNoti;
