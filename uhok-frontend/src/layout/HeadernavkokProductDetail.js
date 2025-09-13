import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavFrame from './HeaderNavFrame';
import '../styles/header_nav_kokProductDetail.css';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';

// 상품 상세 페이지 전용 Header Nav (내용만 구성, 틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기), 중앙(빈 공간), 우측(알림, 장바구니)
const HeaderNavKokProductDetail = ({ onNotificationsClick, onBackClick, onCartClick }) => {
  const navigate = useNavigate();

  const handleBackClick = onBackClick || (() => navigate(-1));
  const handleNotificationsClick = onNotificationsClick || (() => navigate('/notifications'));
  const handleCartClick = onCartClick || (() => navigate('/cart'));

  return (
    <HeaderNavFrame>
      <div className="hn-product-left">
        <HeaderNavBackBtn onClick={handleBackClick} />
      </div>
      <div className="hn-product-center">
        {/* 중앙은 빈 공간으로 두어 균형 맞춤 */}
      </div>
      <div className="hn-product-right">
        <HeaderNavIconBell onClick={handleNotificationsClick} />
        <HeaderNavIconBucket onClick={handleCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavKokProductDetail;
