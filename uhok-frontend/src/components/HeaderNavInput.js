import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header_nav_Input.css';

// 헤더 검색 입력창 컴포넌트
// - 검색 아이콘과 입력창을 포함
// - 클릭 시 바로 검색 페이지로 이동
const HeaderNavInput = ({ 
  onSearch, 
  placeholder = '검색어를 입력하세요', 
  className = '',
  defaultValue = '',
  searchType = 'kok' // 'kok', 'homeshopping', 'wishlist'
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('=== HeaderNavInput 클릭됨 ===');
    console.log('searchType:', searchType);
    console.log('onSearch 존재:', !!onSearch);
    
    if (onSearch) {
      // 커스텀 검색 핸들러가 있으면 사용
      onSearch();
    } else {
      // 기본 검색 페이지 이동 로직
      switch (searchType) {
        case 'homeshopping':
          navigate('/homeshopping/search?type=homeshopping');
          break;
        case 'wishlist':
          navigate('/search?type=wishlist');
          break;
        case 'kok':
        default:
          navigate('/kok/search');
          break;
      }
    }
  };

  const handleInputChange = (e) => {
    console.log('입력값 변경:', e.target.value); // 디버깅용
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`header-nav-input ${className}`.trim()} onClick={handleClick}>
      <div className="input-wrapper">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          aria-label="검색"
          readOnly
        />
      </div>
    </div>
  );
};

export default HeaderNavInput;
