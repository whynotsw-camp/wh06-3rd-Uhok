import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import '../styles/header_nav_Order.css';

// 주문 내역 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 주문 내역 텍스트), 중앙(빈 공간)
const HeaderNavOrder = ({ onBackClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-order-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="order-title">주문 내역</span>
      </div>
      
      <div className="hn-order-center" aria-hidden="true" />
    </HeaderNavFrame>
  );
};

export default HeaderNavOrder;
