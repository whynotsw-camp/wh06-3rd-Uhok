import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import '../styles/header_nav_Cart.css';

// 장바구니 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 장바구니 텍스트), 중앙(빈 공간), 우측(알림)
const HeaderNavCart = ({ onBackClick, onNotificationClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-cart-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="cart-title">장바구니</span>
      </div>
      
      <div className="hn-cart-center" aria-hidden="true" />
      
      <div className="hn-cart-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavCart;
