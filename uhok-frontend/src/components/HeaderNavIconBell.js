import React from 'react';
import '../styles/header_nav_Icon_bell.css';

// 공용 헤더 네비게이션 벨 아이콘 버튼
// - stroke-only(검은 선) SVG
// - 기본 크기 24, 두께 2
// - onClick 콜백 전달
const HeaderNavIconBell = ({
  onClick,
  ariaLabel = 'notifications',
  size = 30,
  strokeWidth = 1.8,
  className = '',
  style = {},
}) => {
  return (
    <button
      type="button"
      className={`hn-bell-btn ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
    >
      {/* <svg
        className="hn-bell-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        aria-hidden="true"
      > */}
        {/* 상단 실루엣은 둥글게, 하단도 곡선으로 마감 */}
      <svg className="hn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.964 8.964 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.964 8.964 0 0 1-2.311 6.022c1.766.68 3.6 1.2 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
      </svg>
    </button>
  );
};

export default HeaderNavIconBell;


