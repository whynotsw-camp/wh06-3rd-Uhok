import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';
import '../styles/header_nav_RecipeDetail.css';

// 레시피 상세 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼, 레시피 상세 텍스트), 중앙(빈 공간), 우측(알림, 장바구니)
const HeaderNavRecipeDetail = ({ onBackClick, onNotificationClick, onCartClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-recipe-left">
        <HeaderNavBackBtn onClick={onBackClick} />
        <span className="recipe-title">레시피 상세</span>
      </div>
      
      <div className="hn-recipe-center" aria-hidden="true" />
      
      <div className="hn-recipe-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
        <HeaderNavIconBucket onClick={onCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavRecipeDetail;
