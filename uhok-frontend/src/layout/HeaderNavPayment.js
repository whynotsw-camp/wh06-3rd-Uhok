import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import '../styles/header_nav_Payment.css';

// 주문 결제 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 주문 결제 텍스트), 중앙(빈 공간)
const HeaderNavPayment = ({ onBackClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-payment-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="payment-title">주문 결제</span>
      </div>
      
      <div className="hn-payment-center" aria-hidden="true" />
    </HeaderNavFrame>
  );
};

export default HeaderNavPayment;
