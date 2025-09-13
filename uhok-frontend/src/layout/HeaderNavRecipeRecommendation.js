import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavFrame from './HeaderNavFrame';
import '../styles/header_nav_RecipeRecommendation.css';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';

// 레시피 추천 페이지 전용 Header Nav (내용만 구성, 틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 + 타이틀), 중앙(빈 공간), 우측(비움)
const HeaderNavRecipeRecommendation = ({ onBackClick }) => {
  const navigate = useNavigate();

  const handleBackClick = onBackClick || (() => navigate(-1));

  return (
    <HeaderNavFrame>
      <div className="hn-recipe-left">
        <HeaderNavBackBtn onClick={handleBackClick} />
        <span className="hn-recipe-title">레시피 추천</span>
      </div>
      <div className="hn-recipe-center">
        {/* 중앙은 빈 공간으로 두어 균형 맞춤 */}
      </div>
      <div className="hn-recipe-right">
        {/* 우측은 비워둠 */}
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavRecipeRecommendation;
