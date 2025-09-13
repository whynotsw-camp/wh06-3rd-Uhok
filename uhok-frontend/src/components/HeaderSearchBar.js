import React, { useState } from 'react';
import '../styles/header_search_bar.css';

// 헤더 검색창 컴포넌트
// - 돋보기 아이콘과 검색 입력창을 포함
// - 상품 검색 placeholder 텍스트
const HeaderSearchBar = ({ onSearch, onClick, placeholder = '상품 검색', className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearch) {
      onSearch(searchTerm.trim());
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleWrapperClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <form className={`header-search-bar ${className}`.trim()} onSubmit={handleSubmit}>
      <div 
        className={`search-input-wrapper ${onClick ? 'clickable' : ''}`.trim()}
        onClick={handleWrapperClick}
      >
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
          onKeyPress={handleKeyPress}
          aria-label="상품 검색"
          readOnly={Boolean(onClick)}
        />
      </div>
    </form>
  );
};

export default HeaderSearchBar;
