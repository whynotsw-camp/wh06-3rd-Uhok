import React, { useState, useEffect, useRef } from 'react';
import { cartApi } from '../api/cartApi';
import '../styles/header_nav_Icon_bucket.css';

// 공용 헤더 네비게이션 장바구니(쇼핑백) 아이콘 버튼
// - stroke-only(검은 선) SVG
// - 기본 크기 24, 두께 2
// - 위치/간격 등 레이아웃은 사용하는 곳에서 조정
// - 오른쪽 상단에 핑크색 원과 장바구니 상품 수 표시
const HeaderNavIconBucket = ({
  onClick,
  ariaLabel = 'cart',
  size = 30,
  strokeWidth = 1.5,
  className = '',
  style = {},
}) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const hasInitialized = useRef(false); // 중복 호출 방지용 ref

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  };

  useEffect(() => {
    // 이미 초기화되었으면 리턴
    if (hasInitialized.current) {
      return;
    }
    
    // 초기화 플래그 설정
    hasInitialized.current = true;

    const loadCartCount = async () => {
      // 로그인하지 않은 상태면 API 호출 건너뛰기
      if (!checkLoginStatus()) {
        console.log('로그인하지 않은 상태: 장바구니 상품 수 API 호출 건너뜀');
        setCartItemCount(0);
        return;
      }

      try {
        const response = await cartApi.getCartItems();
        const items = response.cart_items || [];
        setCartItemCount(items.length);
      } catch (error) {
        console.error('장바구니 상품 수 로딩 실패:', error);
        
        // 401 에러인 경우 토큰이 만료되었거나 유효하지 않음
        if (error.response?.status === 401) {
          console.log('401 에러 - 토큰이 만료되었거나 유효하지 않음');
          // 토큰 제거
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        setCartItemCount(0);
      }
    };

    loadCartCount();
  }, []); // 빈 의존성 배열로 변경

  return (
    <div className="hn-bucket-container" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`hn-bucket-btn ${className}`.trim()}
        onClick={onClick}
        aria-label={ariaLabel}
        style={style}
      >
        <svg
          className="hn-bucket-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* 쇼핑백: 바퀴 없는 형태 */}
          <rect x="6" y="7" width="12" height="12" rx="2" ry="2" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      </button>
      
      {/* 장바구니 상품 수 배지 */}
      {cartItemCount > 0 && (
        <div className="hn-bucket-badge">
          <span className="hn-bucket-badge-text">{cartItemCount}</span>
        </div>
      )}
    </div>
  );
};

export default HeaderNavIconBucket;


