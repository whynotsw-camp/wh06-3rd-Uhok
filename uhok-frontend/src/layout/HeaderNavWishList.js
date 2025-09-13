import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';
import HeaderNavInput from '../components/HeaderNavInput';
import '../styles/header_nav_WishList.css';

// 위시리스트 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼), 중앙(검색창), 우측(알림, 장바구니)
const HeaderNavWishList = ({ onBackClick, onSearchClick, onNotificationClick, onCartClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-wishlist-left">
        <HeaderNavBackBtn onClick={onBackClick} />
      </div>
      
      <div className="hn-wishlist-center">
        <HeaderNavInput 
          onSearch={onSearchClick}
          placeholder="상품 검색"
          className="wishlist-search"
          searchType="kok"
        />
      </div>
      
      <div className="hn-wishlist-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
        <HeaderNavIconBucket onClick={onCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavWishList;
