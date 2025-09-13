import React from 'react';
import '../styles/loading.css';

// 귀여운 로딩 애니메이션 컴포넌트
const Loading = ({ message = "로딩 중...", containerStyle = {} }) => {
  return (
    <div className="loading-container" style={containerStyle}>
      <div className="cute-loading-animation">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
};

export default Loading;
