import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';
import '../styles/header_nav_Mypage.css';

// 마이페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 마이페이지 텍스트), 중앙(빈 공간), 우측(알림, 장바구니)
const HeaderNavMypage = ({ onBackClick, onNotificationClick, onCartClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-mypage-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="mypage-title">마이페이지</span>
      </div>
      
      <div className="hn-mypage-center" aria-hidden="true" />
      
      <div className="hn-mypage-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
        <HeaderNavIconBucket onClick={onCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavMypage;
