import React from 'react';
import '../styles/header_nav_back_btn.css';

// 공용 헤더 네비게이션 Back(꺾세) 버튼
// - 기본: 좌측 꺾세, 선형 SVG (검은 선)
// - props: onClick, size(기본 24), strokeWidth(기본 2), ariaLabel, className, style
const HeaderNavBackBtn = ({
  onClick,
  size = 24,
  strokeWidth = 2,
  ariaLabel = 'back',
  className = '',
  style = {},
}) => {
  return (
    <button
      type="button"
      className={`hn-back-btn ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
    >
      <svg
        className="hn-back-svg"
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
        {/* 좌측 꺾세(chevron-left) */}
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
};

export default HeaderNavBackBtn;


