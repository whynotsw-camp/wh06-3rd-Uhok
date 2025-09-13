import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';
import '../styles/header_nav_ProductList.css';

// 상품 리스트 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼 + 타이틀), 중앙(비움), 우측(알림 아이콘)
const HeaderNavProductList = ({ title = '상품 리스트', onBackClick, onNotificationsClick, onCartClick }) => {
  const navigate = useNavigate();

  const handleBackClick = onBackClick || (() => navigate(-1));
  const handleNotificationsClick = onNotificationsClick || (() => navigate('/notifications'));
  const handleCartClick = onCartClick || (() => navigate('/cart'));

  return (
    <HeaderNavFrame>
      <div className="hn-pl-left">
        <HeaderNavBackBtn onClick={handleBackClick} />
      </div>
      <div className="hn-pl-center" aria-hidden="true" />
      <div className="hn-pl-right">
        <HeaderNavIconBell onClick={handleNotificationsClick} />
        <HeaderNavIconBucket onClick={handleCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavProductList;


