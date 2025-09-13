import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavFrame from './HeaderNavFrame';
import '../styles/header_nav_KokMain.css';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBucket from '../components/HeaderNavIconBucket';
import HeaderNavInput from '../components/HeaderNavInput';

// 메인 페이지 전용 Header Nav (내용만 구성, 틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기), 중앙(검색창), 우측(알림, 장바구니)
const HeaderNavKokMain = ({ onNotificationsClick, onBackClick, onCartClick, onSearch }) => {
  const navigate = useNavigate();

  const handleBackClick = onBackClick || (() => navigate(-1));
  const handleNotificationsClick = onNotificationsClick || (() => navigate('/notifications'));
  const handleCartClick = onCartClick || (() => navigate('/cart'));
  
  const handleSearch = (searchTerm) => {
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      // 콕 쇼핑몰 타입으로 검색 페이지로 이동
      if (searchTerm && searchTerm.trim()) {
        // 검색어를 sessionStorage에 임시 저장 (중복 요청 방지)
        const searchStateKey = `kok_search_${searchTerm.trim()}`;
        const existingState = sessionStorage.getItem(searchStateKey);
        
        if (!existingState) {
          // 아직 저장된 상태가 없으면 임시로 빈 결과 저장
          sessionStorage.setItem(searchStateKey, JSON.stringify({
            results: [],
            timestamp: Date.now(),
            pending: true // 검색 중임을 표시
          }));
        }
        
        const searchUrl = `/kok/search?q=${encodeURIComponent(searchTerm.trim())}`;
        navigate(searchUrl);
      } else {
        navigate('/kok/search');
      }
    }
  };

  return (
    <HeaderNavFrame>
      <div className="hn-main-left">
        <HeaderNavBackBtn onClick={handleBackClick} />
      </div>
      <div className="hn-main-center">
        <HeaderNavInput 
          onSearch={handleSearch} 
          placeholder="상품 검색"
          className="kok-main-search"
        />
      </div>
      <div className="hn-main-right">
        <HeaderNavIconBell onClick={handleNotificationsClick} />
        <HeaderNavIconBucket onClick={handleCartClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavKokMain;
