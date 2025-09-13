import React from 'react';
import '../styles/header_nav_frame.css';

// 공용 Header Navigation 프레임 (틀)
// - 내부 요소는 정의하지 않고, 마진/패딩/가로/높이만 지정
const HeaderNavFrame = ({ children, className = '', style = {} }) => {
  return (
    <div className={`header-nav-frame ${className}`} style={style}>
      {children}
    </div>
  );
};

export default HeaderNavFrame;


