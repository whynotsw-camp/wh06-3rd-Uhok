import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import '../styles/header_nav_Main.css';

const HeaderNavMain = ({ onNotificationClick, onScheduleClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-main-left">
        <button className="schedule-btn" onClick={onScheduleClick}>
          편성표
        </button>
      </div>
      
      <div className="hn-main-center" aria-hidden="true" />
      
      <div className="hn-main-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavMain;
