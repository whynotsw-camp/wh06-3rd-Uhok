// React와 필요한 훅들을 가져옵니다
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 메인 헤더 네비게이션 컴포넌트를 가져옵니다
import HeaderNavMain from '../../layout/HeaderNavMain';
// 하단 네비게이션 컴포넌트를 가져옵니다
import BottomNav from '../../layout/BottomNav';
// 로딩 컴포넌트를 가져옵니다
import Loading from '../../components/Loading';
import UpBtn from '../../components/UpBtn';
// 모달 관리자 import
import ModalManager, { showWishlistNotification, showWishlistUnlikedNotification, showAlert, hideModal } from '../../components/LoadingModal';
// 메인 페이지 스타일을 가져옵니다
import '../../styles/main.css';
// API 설정을 가져옵니다
import api from '../api';
// 홈쇼핑 API를 가져옵니다
import { homeShoppingApi } from '../../api/homeShoppingApi';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';

// 홈쇼핑 로고 이미지들을 가져옵니다
import { homeshoppingChannels, getLogoByHomeshoppingId } from '../../components/homeshoppingLogo';

// 하트 아이콘 이미지들을 가져옵니다
import heartEmpty from '../../assets/heart_empty.png';
import heartFilled from '../../assets/heart_filled.png';

// 메인 컴포넌트를 정의합니다
const Main = () => {
  // 페이지 이동을 위한 navigate 훅
  const navigate = useNavigate();
  // 사용자 정보 가져오기
  const { user, isLoggedIn, isLoading: userLoading } = useUser();
  
  // 편성표 데이터를 저장할 상태를 초기화합니다 (API 명세서에 맞춰 수정)
  const [scheduleData, setScheduleData] = useState({
    date: '', // 날짜 정보 (API에서 받아옴)
    time: '', // 시간 정보 (API에서 받아옴)
    channel_id: null, // 채널 아이디 (API에서 받아옴)
    schedule: [] // 스케줄 목록 (API에서 받아옴)
  });
  // 데이터 로딩 상태를 관리합니다 (true: 로딩 중, false: 로딩 완료)
  const [loading, setLoading] = useState(true);
  // 에러 상태를 관리합니다 (null: 에러 없음, string: 에러 메시지)
  const [error, setError] = useState(null);
  // 찜한 상품 목록을 관리합니다
  const [likedProducts, setLikedProducts] = useState(new Set());
  
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });

  // 커스텀 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };



  // 사용자 정보가 변경될 때마다 콘솔에 출력 (디버깅용)
  useEffect(() => {
    console.log('Main - 사용자 정보 상태:', {
      user: user,
      isLoggedIn: isLoggedIn,
      hasUser: !!user,
      userEmail: user?.email,
      hasToken: !!user?.token,
      userLoading: userLoading
    });
  }, [user, isLoggedIn, userLoading]);

  // 백엔드 API에서 편성표 데이터를 가져오는 useEffect를 정의합니다 (비동기 처리 개선)
  useEffect(() => {
    // 사용자 정보 로딩이 완료될 때까지 기다림
    if (userLoading) {
      console.log('Main - 사용자 정보 로딩 중, 대기...');
      return;
    }
    
    // 로그인된 사용자의 찜한 상품 목록을 가져오는 함수
    const loadLikedProducts = async () => {
      if (!isLoggedIn) {
        console.log('로그인하지 않은 상태: 찜 상품 API 호출 건너뜀');
        return;
      }

      try {
        const response = await api.get('/api/homeshopping/likes', {
          params: {
            limit: 20
          }
        });
        
        if (response.data && response.data.liked_products) {
          const likedIds = new Set(response.data.liked_products.map(product => product.live_id || product.product_id || product.id));
          setLikedProducts(likedIds);
          console.log('찜한 상품 목록 로드 완료:', likedIds);
        }
      } catch (error) {
        console.error('찜한 상품 목록 로딩 실패:', error);
      }
    };
    
    // 비동기 함수로 편성표 데이터를 가져옵니다
    const fetchScheduleData = async () => {
      try {
        console.log('Main - 편성표 데이터 로딩 시작');
        
        // 로딩 상태를 true로 설정합니다
        setLoading(true);
        setError(null); // 에러 상태 초기화
        
        // API 명세서에 맞춰 쿼리 파라미터를 설정합니다
        const today = new Date();
        // 한국 시간 기준으로 날짜와 시간 계산 (UTC+9 조정 제거)
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`; // YYYY-MM-DD 형식 (한국 시간 기준)
        const hour = today.getHours(); // 현재 시간 (한국 시간)
        
        // 홈쇼핑 편성표 API 호출 (오늘 날짜 데이터만)
        // 오늘 날짜를 파라미터로 전달하여 서버에서 필터링하도록 수정
        const response = await homeShoppingApi.getSchedule(todayString);
        
        console.log('홈쇼핑 편성표 API 응답:', response.data);
        
        if (response && response.data && response.data.schedules && response.data.schedules.length > 0) {
          // 서버에서 이미 오늘 날짜로 필터링된 데이터를 받음
          const todaySchedules = response.data.schedules;
          
          console.log('오늘 날짜 편성표:', todaySchedules);
          
          // 첫 번째 아이템의 구조를 자세히 로그로 출력 (디버깅용)
          // if (todaySchedules.length > 0) {
            // console.log('첫 번째 아이템 상세 구조:', {
            //   item: todaySchedules[0],
            //   live_id: todaySchedules[0].live_id,
            //   product_id: todaySchedules[0].product_id,
            //   id: todaySchedules[0].id,
            //   keys: Object.keys(todaySchedules[0])
            // });
          // }
          
          // 오늘 날짜 데이터가 있는 경우에만 API 데이터 사용
          if (todaySchedules.length > 0) {
                         // API 응답 데이터를 UI 형식으로 변환
             const apiSchedule = todaySchedules.map(item => {
               // live_end_time이 없는 경우 시작 시간 + 1시간 30분으로 계산
               let endTime = '00:00';
               if (item.live_end_time) {
                 endTime = item.live_end_time.substring(0, 5);
               } else if (item.live_start_time) {
                 // 시작 시간이 있는 경우 기본 방송 시간(1시간 30분) 추가
                //  const startTime = item.live_start_time.substring(0, 5);
                //  const [hours, minutes] = startTime.split(':').map(Number);
                //  const endHours = hours + 1;
                //  const endMinutes = minutes + 30;
                //  if (endMinutes >= 60) {
                //    endTime = `${endHours + 1}:${String(endMinutes - 60).padStart(2, '0')}`;
                //  } else {
                //    endTime = `${endHours}:${String(endMinutes).padStart(2, '0')}`;
                //  }
               }
               
               return {
                 상품_아이디: item.product_id || item.id, // 각 상품의 고유 ID
                 라이브_아이디: item.live_id, // 라이브 방송 ID (상품 상세 페이지 이동용) - fallback 제거
                 홈쇼핑_아이디: item.homeshopping_id, // 홈쇼핑 채널 ID - fallback 제거
                 홈쇼핑명: item.homeshopping_name || item.store_name || '홈쇼핑',
                 채널명: item.homeshopping_name || item.store_name || '홈쇼핑',
                 채널로고: item.channel_logo || (() => {
                   const channel = getLogoByHomeshoppingId(item.homeshopping_id);
                   return channel ? channel.logo : null;
                 })(),
                 채널번호: item.homeshopping_channel || item.channel_number || item.channel || '채널',
                 원가: item.sale_price ? `${item.sale_price.toLocaleString()}원` : '0원',
                 할인율: item.dc_rate ? `${item.dc_rate}%` : '0%',
                 할인된가격: item.dc_price ? `${item.dc_price.toLocaleString()}원` : '0원',
                 시작시간: item.live_start_time ? item.live_start_time.substring(0, 5) : '00:00',
                 종료시간: endTime, // 계산된 종료 시간 사용
                 썸네일: item.thumb_img_url || item.thumbnail || item.product_image || null,
                 알림여부: item.notification_enabled || false,
                 상품명: item.product_name || item.title || '상품명 없음'
               };
             });
            
            // 매핑된 데이터도 로그로 출력 (디버깅용)
            // console.log('매핑된 데이터 샘플:', apiSchedule[0]);
            
                         setScheduleData({
               date: todayString,
               time: `${hour}:${String(today.getMinutes()).padStart(2, '0')}`,
               channel_id: null,
               schedule: apiSchedule
             });
          } else {
            // 오늘 날짜 데이터가 없는 경우 빈 배열로 설정
            console.log('오늘 날짜 편성표 데이터가 없습니다.');
            setScheduleData({
              date: todayString,
              time: `${hour}:${String(today.getMinutes()).padStart(2, '0')}`,
              channel_id: null,
              schedule: []
            });
          }
        } else {
          // API 데이터가 없을 때 빈 배열로 설정
          console.log('API 데이터가 없습니다.');
          setScheduleData({
            date: todayString,
            time: `${hour}:${String(today.getMinutes()).padStart(2, '0')}`,
            channel_id: null,
            schedule: []
          });
        }
        
      } catch (err) {
        // 에러가 발생하면 콘솔에 에러를 출력하고 에러 상태를 설정합니다
        console.error('편성표 데이터 로딩 실패:', err);
        setError('편성표 데이터를 불러오는데 실패했습니다.');
        
        // 에러 시 빈 데이터로 설정 (한국 시간 기준)
        const errorToday = new Date();
        const errorYear = errorToday.getFullYear();
        const errorMonth = String(errorToday.getMonth() + 1).padStart(2, '0');
        const errorDay = String(errorToday.getDate()).padStart(2, '0');
        const errorDate = `${errorYear}-${errorMonth}-${errorDay}`;
        const errorTime = `${errorToday.getHours()}:${String(errorToday.getMinutes()).padStart(2, '0')}`;
        
        setScheduleData({
          date: errorDate,
          time: errorTime,
          channel_id: null,
          schedule: []
        });
      } finally {
        // try-catch 블록이 끝나면 항상 로딩 상태를 false로 설정합니다
        setLoading(false);
      }
    };

    // 컴포넌트가 마운트될 때 데이터를 가져오는 함수를 실행합니다
    fetchScheduleData();
    
    // 로그인된 사용자의 찜한 상품 목록도 함께 로드
    loadLikedProducts();
  }, [userLoading, isLoggedIn]); // userLoading과 isLoggedIn이 변경될 때마다 실행

  // 편성표 버튼 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleScheduleClick = () => {
    // 콘솔에 클릭 로그를 출력합니다
    console.log('편성표 버튼 클릭');
    // 편성표 페이지로 이동합니다
    navigate('/schedule');
  };

  // 알림 버튼 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleNotificationClick = () => {
    // 콘솔에 클릭 로그를 출력합니다
    console.log('알림 버튼 클릭');
    navigate('/notifications');
  };

  // 상품 카드 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleProductClick = (liveId) => {
    // 콘솔에 클릭된 라이브 ID를 출력합니다
    console.log('상품 클릭 - 라이브 ID:', liveId, '타입:', typeof liveId);
    
    // live_id가 있는 경우에만 상품 상세 페이지로 이동
    if (liveId && liveId !== 'undefined' && liveId !== 'null') {
      console.log('상품 상세 페이지로 이동:', `/homeshopping/product/${liveId}`);
      navigate(`/homeshopping/product/${liveId}`);
    } else {
      console.warn('라이브 ID가 없어서 상품 상세 페이지로 이동할 수 없습니다. liveId:', liveId);
    }
  };

  // 하트 아이콘 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleHeartClick = async (liveId, event) => {
    event.stopPropagation(); // 상품 카드 클릭 이벤트 전파 방지
    
    // 로그인 상태 확인
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    
    try {
      // 찜하기 토글 API 호출
      const response = await api.post('/api/homeshopping/likes/toggle', {
        live_id: liveId
      });
      
      console.log('찜하기 토글 응답:', response.data);
      
      // API 성공 시에만 UI 상태 업데이트
      if (response.data) {
        // 백엔드 응답의 liked 상태에 따라 찜 상태 업데이트
        const isLiked = response.data.liked;
        
        setLikedProducts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            // 백엔드에서 찜된 상태로 응답
            newSet.add(liveId);
            console.log('찜 추가:', liveId);
          } else {
            // 백엔드에서 찜 해제된 상태로 응답
            newSet.delete(liveId);
            console.log('찜 해제:', liveId);
          }
          return newSet;
        });

        // 애니메이션 효과 추가
        const heartIcon = event.currentTarget;
        if (heartIcon) {
          heartIcon.classList.add('liked');
          setTimeout(() => heartIcon.classList.remove('liked'), 600);
        }
        
        // 찜 상태에 따른 알림 모달 표시
        if (isLiked) {
          // 찜 추가 시 알림
          setModalState(showWishlistNotification());
        } else {
          // 찜 해제 시 알림
          setModalState(showWishlistUnlikedNotification());
        }
      }
    } catch (error) {
      console.error('찜하기 토글 실패:', error);
      
      if (error.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
      } else {
        setModalState(showAlert('찜하기 처리 중 오류가 발생했습니다.'));
      }
    }
  };

  // 현재 시간과 비교하여 방송 상태를 구분하는 함수를 정의합니다
  const getBroadcastStatus = (startTime, endTime, currentTimeInMinutes) => {
    // 시작 시간과 종료 시간이 유효한지 확인
    if (!startTime || !endTime || startTime === '00:00' || endTime === '00:00') {
      // console.warn('유효하지 않은 시간:', { startTime, endTime });
      return '방송예정'; // 기본값으로 방송예정 반환
    }
    
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startTimeInMinutes = startHours * 60 + startMinutes; // 시작 시간을 분으로 변환
      
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const endTimeInMinutes = endHours * 60 + endMinutes; // 종료 시간을 분으로 변환
      
      // 디버깅용 로그 (실제로 로그를 확인하려면 주석 해제)
      // console.log(`시간 비교: 시작=${startTime}(${startTimeInMinutes}분), 종료=${endTime}(${endTimeInMinutes}분), 현재=${currentTimeInMinutes}분`);
      
      // 현재 시간이 시작 시간보다 이전이면 방송예정
      if (startTimeInMinutes > currentTimeInMinutes) {
        return '방송예정';
      } 
      // 현재 시간이 시작 시간과 종료 시간 사이면 방송중
      else if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
        return '방송중';
      } 
      // 현재 시간이 종료 시간을 지났으면 방송종료
      else {
        return '방송종료';
      }
    } catch (error) {
      console.error('시간 파싱 오류:', error, { startTime, endTime });
      return '방송예정'; // 오류 시 기본값으로 방송예정 반환
    }
  };

  // 방송 상태에 따른 스타일 클래스를 반환하는 함수를 정의합니다
  const getBroadcastStatusClass = (status) => {
    switch (status) {
      case '방송예정':
        return 'main-status-text scheduled';
      case '방송중':
        return 'main-status-text on-air';
      case '방송종료':
        return 'main-status-text ended';
      default:
        return 'main-status-text scheduled';
    }
  };

  // 현재 시간 계산 (한 번만 계산하여 일관성 유지)
  const now = new Date();
  const currentTimeString = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes(); // 현재 시간을 분으로 변환
  
  // console.log(`현재 시간: ${currentTimeString} (한국 시간), 분으로 변환: ${currentTimeInMinutes}분`);
  
  // 전체 스케줄을 시간 순으로 정렬한 후 방송 상태별로 분류합니다
  const sortedSchedule = scheduleData.schedule
    .filter(item => {
      const status = getBroadcastStatus(item.시작시간, item.종료시간, currentTimeInMinutes);
      // 방송 종료된 상품은 제외하고, 방송예정과 방송중인 상품만 표시
      const shouldShow = status !== '방송종료';
      
      // 디버깅용 로그 (실제로 로그를 확인하려면 주석 해제)
      // console.log(`상품: ${item.상품명}, 시작시간: ${item.시작시간}, 종료시간: ${item.종료시간}, 상태: ${status}, 표시여부: ${shouldShow}`);
      
      return shouldShow;
    })
    .sort((a, b) => a.시작시간.localeCompare(b.시작시간)); // 전체를 시간 순으로 정렬
  
  // 정렬된 스케줄을 방송 상태별로 분류합니다
  const scheduledItems = sortedSchedule.filter(item => getBroadcastStatus(item.시작시간, item.종료시간, currentTimeInMinutes) === '방송예정');
  const onAirItems = sortedSchedule.filter(item => getBroadcastStatus(item.시작시간, item.종료시간, currentTimeInMinutes) === '방송중');

  // 로딩 중일 때 표시할 UI를 렌더링합니다
  if (loading || userLoading) {
    return (
      <div className="main-page">
        {/* 메인 헤더 네비게이션 */}
        <HeaderNavMain 
          onNotificationClick={handleNotificationClick}
          onScheduleClick={handleScheduleClick}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="main-schedule-content">
          <Loading message="편성표를 불러오는 중 ..." />
        </div>
        {/* 하단 네비게이션을 렌더링합니다 */}
        <BottomNav />
      </div>
    );
  }

  // 에러가 발생했을 때 표시할 UI를 렌더링합니다
  if (error) {
    return (
      <div className="main-page">
        {/* 메인 헤더 네비게이션 */}
        <HeaderNavMain 
          onNotificationClick={handleNotificationClick}
          onScheduleClick={handleScheduleClick}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="main-schedule-content">
          {/* 에러 메시지를 표시합니다 */}
          <div className="error">오류: {error}</div>
        </div>
        {/* 하단 네비게이션을 렌더링합니다 */}
        <BottomNav />
      </div>
    );
  }

  // 정상적인 편성표 페이지를 렌더링합니다
  return (
    <div className="main-page">
      {/* 메인 헤더 네비게이션 */}
      <HeaderNavMain 
        onNotificationClick={handleNotificationClick}
        onScheduleClick={handleScheduleClick}
      />

      {/* 메인 콘텐츠 */}
      <div className="main-schedule-content">
        {/* 편성표가 없을 때 메시지 표시 */}
        {scheduleData.schedule.length === 0 ? (
          <div className="no-schedule-message">
            <div className="no-schedule-date">{scheduleData.date}</div>
            <div className="no-schedule-text">편성된 방송이 없습니다.</div>
          </div>
        ) : (
          <>
                         {/* 오늘의 홈쇼핑 제목 */}
             <div className="main-page-title">오늘의 홈쇼핑</div>
             
             {/* 전체 스케줄을 시간 순으로 표시 */}
             <div className="main-product-cards">
               {(() => {
                 // 전체 스케줄을 시간별로 그룹화
                 const groupedByTime = sortedSchedule.reduce((groups, item) => {
                   const time = item.시작시간;
                   if (!groups[time]) {
                     groups[time] = [];
                   }
                   groups[time].push(item);
                   return groups;
                 }, {});

                 return Object.entries(groupedByTime).map(([time, items]) => (
                   <div key={time}>
                     {/* 시간 표시 */}
                     <div className="main-time-display">
                       {time}
                     </div>
                     
                     {/* 같은 시간의 상품들 */}
                     {items.map((item, index) => (
                                               <div
                          key={`${getBroadcastStatus(item.시작시간)}-${item.상품_아이디}-${index}`}
                          className="main-product-card"
                          onClick={() => handleProductClick(item.라이브_아이디)}
                        >
                         {/* 카드 내부 레이아웃 컨테이너 */}
                         <div className="main-card-layout">
                           
                           {/* 왼쪽: 상품 이미지 */}
                           <div className="main-product-image-container">
                             {/* 상품 이미지 컨테이너 */}
                             <div className="main-product-image">
                               {/* 상품 이미지를 표시합니다 */}
                               <img 
                                 src={item.썸네일} 
                                 alt={item.상품명}
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                   const parent = e.target.parentElement;
                                   if (!parent.querySelector('.image-placeholder')) {
                                     const placeholder = document.createElement('div');
                                     placeholder.className = 'image-placeholder';
                                     placeholder.textContent = '이미지를 준비 중입니다.';
                                     parent.appendChild(placeholder);
                                   }
                                 }}
                               />
                             </div>
                           </div>
                           
                           {/* 오른쪽: 상품 정보 */}
                           <div className="main-product-info">
                             {/* 상품 상세 정보 컨테이너 */}
                             <div className="main-product-details">
                               {/* 브랜드 정보 컨테이너 */}
                               <div className="main-brand-info">
                                 {/* 브랜드 로고 컨테이너 */}
                                 <div className="main-brand-logo">
                                   {/* 브랜드 로고 이미지 */}
                                   <img
                                     src={item.채널로고}
                                     alt={item.홈쇼핑명}
                                     className="main-brand-image"
                                   />
                                 </div>
                                 {/* 채널 번호와 방송상태를 같은 라인에 표시 */}
                                 <div className="main-channel-status-container">
                                   <span className="main-channel">[CH {item.채널번호}]</span>
                                   <span className={`broadcast-status ${getBroadcastStatus(item.시작시간, item.종료시간, currentTimeInMinutes) === '방송중' ? 'on-air' : ''}`}>
                                     {getBroadcastStatus(item.시작시간, item.종료시간, currentTimeInMinutes)}
                                   </span>
                                 </div>
                               </div>
                               {/* 상품명을 표시합니다 */}
                               <div className="main-product-name">{item.상품명}</div>
                               {/* 가격 정보와 방송상태를 하나의 컨테이너로 묶습니다 */}
                               <div className="main-bottom-info">
                                 {/* 가격 정보 컨테이너 */}
                                 <div className="main-price-info">
                                   {/* 할인율이 0이거나 null이 아닐 때만 표시 */}
                                   {item.할인율 && item.할인율 !== '0%' && (
                                     <span className="main-discount">{item.할인율}</span>
                                   )}
                                   {/* 할인된 가격을 표시합니다 */}
                                   <span className="main-price">{item.할인된가격}</span>
                                 </div>
                                 {/* 오른쪽: 하트 아이콘만 */}
                                 <div className="wishlist-right-info">
                                   {/* 하트 아이콘 */}
                                   <button 
                                     className="shopping-heart-button"
                                     data-product-id={item.라이브_아이디}
                                     onClick={(e) => {
                                       e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                       handleHeartClick(item.라이브_아이디, e);
                                     }}>
                                     <img 
                                       src={likedProducts.has(item.라이브_아이디) ? heartFilled : heartEmpty} 
                                       alt="찜하기" 
                                       className="shopping-heart-icon"
                                     />
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 ));
               })()}
             </div>
          </>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
      <UpBtn />
      
      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={closeModal}
      />
    </div>
  );
};

// Main 컴포넌트를 기본 내보내기로 설정합니다
export default Main;
