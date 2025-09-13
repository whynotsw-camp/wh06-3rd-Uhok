import React from 'react';
import HeaderNavFrame from './HeaderNavFrame';
import HeaderNavBackBtn from '../components/HeaderNavBackBtn';
import HeaderNavIconBell from '../components/HeaderNavIconBell';
import HeaderNavInput from '../components/HeaderNavInput';
import '../styles/header_nav_Schedule.css';

// 편성표 페이지 전용 Header Nav (틀은 HeaderNavFrame 사용)
// - 내부 구성: 좌측(뒤로가기 버튼), 중앙(검색창), 우측(알림 아이콘)
const HeaderNavSchedule = ({ onBackClick, onSearchClick, onNotificationClick }) => {
  return (
    <HeaderNavFrame>
      <div className="hn-schedule-left">
        <HeaderNavBackBtn onClick={onBackClick} />
      </div>
      
      <div className="hn-schedule-center">
        <HeaderNavInput 
          onSearch={onSearchClick}
          placeholder="홈쇼핑 검색"
          className="schedule-search"
          searchType="homeshopping"
        />
      </div>
      
      <div className="hn-schedule-right">
        <HeaderNavIconBell onClick={onNotificationClick} />
      </div>
    </HeaderNavFrame>
  );
};

export default HeaderNavSchedule;
