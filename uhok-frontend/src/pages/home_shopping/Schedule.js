import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../layout/BottomNav';
import HeaderNavSchedule from '../../layout/HeaderNavSchedule';
import { useUser } from '../../contexts/UserContext';
import { homeShoppingApi } from '../../api/homeShoppingApi';
import api from '../../pages/api';
import Loading from '../../components/Loading';
import UpBtn from '../../components/UpBtn';
import ModalManager, { showWishlistNotification, showWishlistUnlikedNotification, showAlert, hideModal } from '../../components/LoadingModal';
import emptyHeartIcon from '../../assets/heart_empty.png';
import filledHeartIcon from '../../assets/heart_filled.png';

// 홈쇼핑 로고 관련 컴포넌트
import { homeshoppingChannels, getLogoByHomeshoppingId, getChannelInfoByHomeshoppingId } from '../../components/homeshoppingLogo';

import '../../styles/schedule.css';

// 홈쇼핑 로고 관련 컴포넌트에서 가져온 데이터 사용

const Schedule = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  
  // 편성표 관련 상태
  const [selectedDate, setSelectedDate] = useState(null); // 현재 선택된 날짜
  const [searchQuery, setSearchQuery] = useState('');
  
  // 현재 날짜를 기준으로 일주일 날짜 데이터 생성
  const [weekDates, setWeekDates] = useState([]);
  
  // API 관련 상태
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wishlistedProducts, setWishlistedProducts] = useState(new Set()); // 찜된 상품 ID들을 저장
  
  // 라이브 스트림 관련 상태
  const [liveStreamData, setLiveStreamData] = useState({});
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  
  // 상품 상세 정보 로딩 상태
  const [isProductDetailLoading, setIsProductDetailLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState(null);
  
  // 전체 페이지 로딩 상태 (상품 상세 페이지로 이동할 때)
  const [isNavigatingToProduct, setIsNavigatingToProduct] = useState(false);
  
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });

  // 커스텀 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };
  

  
  // 무한 스크롤 관련 상태
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // 한 번에 가져올 상품 개수
  
  // ref 선언
  const timeSlotsRef = useRef(null);
  const scheduleContentRef = useRef(null);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (!scheduleContentRef.current || isLoadingMore || !hasMoreData) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scheduleContentRef.current;
    
    // 스크롤이 하단에 가까워지면 더 많은 데이터 로딩
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreData();
    }
  }, [isLoadingMore, hasMoreData]);
  
  // 더 많은 데이터 로딩
  const loadMoreData = async () => {
    if (isLoadingMore || !hasMoreData) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      // 선택된 날짜가 있으면 해당 날짜로, 없으면 오늘 날짜로 데이터를 가져옴
      let targetDate = null;
      if (selectedDate) {
        const selectedDateObj = new Date(selectedDate);
        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
      }
      
      console.log(`📺 추가 데이터 로딩 - 페이지 ${nextPage}:`, { targetDate, pageSize });
      
      // 페이지네이션 파라미터를 포함하여 API 호출
      const params = {
        page: nextPage,
        size: pageSize
      };
      
      if (targetDate) {
        params.live_date = targetDate;
      }
      
      const response = await api.get('/api/homeshopping/schedule', { params });
      
      if (response && response.data && response.data.schedules) {
        const newSchedules = response.data.schedules;
        console.log(`✅ 추가 데이터 로딩 완료 - 페이지 ${nextPage}:`, newSchedules.length, '개');
        
        if (newSchedules.length > 0) {
          // API 명세에 따른 데이터 구조 검증
          const validatedNewSchedules = newSchedules.map(item => {
            // 필수 필드 검증 및 기본값 설정
            const validatedItem = {
              live_id: item.live_id || 0,
              homeshopping_id: item.homeshopping_id || 0,
              homeshopping_name: item.homeshopping_name || '홈쇼핑',
              homeshopping_channel: item.homeshopping_channel || 1,
              live_date: item.live_date || targetDate || new Date().toISOString().split('T')[0],
              live_start_time: item.live_start_time || '00:00:00',
              live_end_time: item.live_end_time || '01:00:00',
              promotion_type: item.promotion_type || '일반',
              product_id: item.product_id || 0,
              product_name: item.product_name || '상품명 없음',
              thumb_img_url: item.thumb_img_url || '',
              sale_price: item.sale_price || 0,
              dc_price: item.dc_price || item.sale_price || 0,
              dc_rate: item.dc_rate || 0
            };
            
            // 할인율이 0이면 할인가격을 정가와 동일하게 설정
            if (validatedItem.dc_rate === 0) {
              validatedItem.dc_rate = 0;
              validatedItem.dc_price = validatedItem.sale_price;
            }
            
                         // 방송 상태 계산
             const now = new Date();
             const today = new Date();
             today.setHours(0, 0, 0, 0);
             
             // 방송 날짜 파싱 (YYYY-MM-DD 형식)
             const liveDate = new Date(validatedItem.live_date);
             liveDate.setHours(0, 0, 0, 0);
             
             // 오늘 날짜와 방송 날짜 비교
             const isToday = liveDate.getTime() === today.getTime();
             const isPast = liveDate.getTime() < today.getTime();
             const isFuture = liveDate.getTime() > today.getTime();
             
             let status = 'LIVE 예정';
             
             if (isPast) {
               // 과거 날짜면 종료
               status = '종료';
             } else if (isFuture) {
               // 미래 날짜면 예정
               status = 'LIVE 예정';
             } else if (isToday) {
               // 오늘 날짜면 시간 비교
               const liveStart = new Date(today);
               const [startHour, startMinute] = validatedItem.live_start_time.split(':').map(Number);
               liveStart.setHours(startHour, startMinute, 0, 0);
               
               const liveEnd = new Date(today);
               const [endHour, endMinute] = validatedItem.live_end_time.split(':').map(Number);
               liveEnd.setHours(endHour, endMinute, 0, 0);
               
               const currentTime = new Date(today);
               currentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
               
               if (currentTime >= liveStart && currentTime <= liveEnd) {
                 status = 'LIVE';
               } else if (currentTime > liveEnd) {
                 status = '종료';
               } else {
                 status = 'LIVE 예정';
               }
             }
            
            return {
              ...validatedItem,
              status
            };
          });
          
          console.log(`✅ 검증된 추가 데이터:`, validatedNewSchedules.length, '개');
          
          // 새로운 데이터를 기존 데이터에 추가
          setScheduleData(prev => {
            const combinedData = [...prev, ...validatedNewSchedules];
            console.log(`📊 전체 데이터 개수: ${combinedData.length}개`);
            return combinedData;
          });
          
          setCurrentPage(nextPage);
          
          // 더 이상 데이터가 없으면 hasMoreData를 false로 설정
          if (validatedNewSchedules.length < pageSize) {
            setHasMoreData(false);
            console.log('📋 더 이상 로딩할 데이터가 없습니다.');
          }
        } else {
          setHasMoreData(false);
          console.log('📋 더 이상 로딩할 데이터가 없습니다.');
        }
      } else {
        setHasMoreData(false);
        console.log('📋 API 응답에 데이터가 없습니다.');
      }
      
    } catch (error) {
      console.error('❌ 추가 데이터 로딩 실패:', error);
      
      // 에러 타입에 따른 구체적인 메시지 제공
      let errorMessage = '추가 데이터를 가져올 수 없습니다.';
      
      if (error.response?.status === 500) {
        errorMessage = '서버 내부 오류가 발생했습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '더 이상 데이터가 없습니다.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다.';
      }
      
      console.error('에러 상세:', errorMessage);
      
      // 에러가 발생해도 무한 스크롤을 계속 시도할 수 있도록 hasMoreData는 유지
      // 하지만 너무 많은 에러가 발생하면 hasMoreData를 false로 설정
      if (error.response?.status === 404) {
        setHasMoreData(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };
  


  // 선택된 시간 상태
  const [selectedTime, setSelectedTime] = useState(null);
  // 선택된 홈쇼핑 상태
  const [selectedHomeshopping, setSelectedHomeshopping] = useState(null);
  
  // 시간 클릭 핸들러
  const handleTimeClick = (time) => {
    if (selectedTime === time) {
      setSelectedTime(null); // 같은 시간을 다시 클릭하면 선택 해제
    } else {
      setSelectedTime(time); // 새로운 시간 선택
    }
  };
  
  // 시간대 데이터 - 00:00부터 23:00까지 24시간 생성
  const getTimeSlots = () => {
    const timeSlots = [];
    
    // 00:00부터 23:00까지 24시간 생성
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      timeSlots.push(`${hour}:00`);
    }
    
    return timeSlots;
  };

  const timeSlots = getTimeSlots();
  
  // 날짜와 시간에 따른 스케줄 필터링 함수
  const getFilteredScheduleData = () => {
    if (!scheduleData || scheduleData.length === 0) return [];
    
    let filteredData = [...scheduleData];
    
    // 날짜 필터링 제거 - API에서 이미 선택된 날짜의 데이터를 반환하므로
    
    // 홈쇼핑 필터링 - 선택된 홈쇼핑의 상품만 표시
    if (selectedHomeshopping) {
      filteredData = filteredData.filter(item => {
        return item.homeshopping_id === selectedHomeshopping.id;
      });
    }
    
    // 시간 필터링 - 선택된 시간에 해당하는 방송만 표시
    if (selectedTime) {
      const [selectedHour] = selectedTime.split(':').map(Number);
      filteredData = filteredData.filter(item => {
        const [itemStartHour] = item.live_start_time.split(':').map(Number);
        const [itemEndHour] = item.live_end_time.split(':').map(Number);
        
        // 선택된 시간이 방송 시간 범위에 포함되는지 확인
        // 시작 시간 <= 선택된 시간 <= 종료 시간 (종료 시간도 포함)
        return selectedHour >= itemStartHour && selectedHour <= itemEndHour;
      });
    }
    
    return filteredData;
  };
  
  // 날짜 데이터 초기화
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    // 월요일을 시작으로 하는 주의 시작일 계산
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      
      weekData.push({
        date: date.getDate(),
        day: ['월', '화', '수', '목', '금', '토', '일'][i],
        fullDate: date,
        isToday: isToday,
        dateKey: date.toDateString() // 날짜 비교를 위한 고유 키
      });
      
      // 오늘 날짜라면 selectedDate 설정
      if (isToday) {
        setSelectedDate(date.toDateString());
      }
    }
    
    setWeekDates(weekData);
  }, []);
  
  // 찜 상태 초기화 함수
  const initializeWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // 사용자의 찜한 홈쇼핑 상품 목록 가져오기
      const response = await api.get('/api/homeshopping/likes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.liked_products) {
        const likedProductIds = new Set(response.data.liked_products.map(product => product.live_id));
        setWishlistedProducts(likedProductIds);
        console.log('찜 상태 초기화 완료:', likedProductIds.size, '개 상품 (live_id 기준)');
      }
    } catch (error) {
      console.error('찜 상태 초기화 실패:', error);
    }
  };

  // 스케줄 데이터 가져오기
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 무한 스크롤 상태 초기화
        setCurrentPage(1);
        setHasMoreData(true);
        
        // 선택된 날짜가 있으면 해당 날짜로, 없으면 오늘 날짜로 데이터를 가져옴
        let targetDate = null;
        if (selectedDate) {
          // selectedDate는 "Wed Jan 23 2025" 형식이므로 직접 파싱
          const selectedDateObj = new Date(selectedDate);
          // 로컬 시간대 기준으로 날짜 생성 (시간대 문제 방지)
          const year = selectedDateObj.getFullYear();
          const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDateObj.getDate()).padStart(2, '0');
          targetDate = `${year}-${month}-${day}`; // yyyy-mm-dd 형식
          
          console.log('📅 날짜 변환 정보:', {
            selectedDate,
            selectedDateObj,
            targetDate,
            year,
            month,
            day
          });
        }
        
        console.log('🔍 API 호출 전 정보:', {
          selectedDate,
          targetDate,
          selectedDateObj: selectedDate ? new Date(selectedDate) : null,
          currentTime: new Date().toISOString(),
          requestUrl: `/api/homeshopping/schedule${targetDate ? `?live_date=${targetDate}` : ''}`,
          retryCount,
          page: 1,
          size: pageSize
        });
        
        // 첫 번째 페이지 데이터 가져오기 (페이지네이션 파라미터 포함)
        const params = {
          page: 1,
          size: pageSize
        };
        
        if (targetDate) {
          params.live_date = targetDate;
        }
        
        const response = await api.get('/api/homeshopping/schedule', { params });
        
        // 컴포넌트가 마운트된 상태에서만 상태 업데이트
        if (isMounted) {
          console.log('📺 API 응답 전체:', response);
          console.log('📺 API 응답 데이터:', response.data);
          console.log('📺 API 응답 데이터 타입:', typeof response.data);
          console.log('📺 API 응답 데이터 키들:', response.data ? Object.keys(response.data) : '데이터 없음');
          console.log('📺 API 응답 schedules:', response.data?.schedules);
          console.log('📺 API 응답 schedules 타입:', typeof response.data?.schedules);
          console.log('📺 API 응답 schedules 길이:', response.data?.schedules?.length);
          
          if (response && response.data && response.data.schedules) {
            console.log('✅ schedules 배열 길이:', response.data.schedules.length);
            // console.log('✅ 첫 번째 schedule:', response.data.schedules[0]);
            
            // API 명세에 따른 데이터 구조 검증
            const schedules = response.data.schedules;
            const validatedSchedules = schedules.map(item => {
              // 필수 필드 검증 및 기본값 설정
              const validatedItem = {
                live_id: item.live_id || 0,
                homeshopping_id: item.homeshopping_id || 0,
                homeshopping_name: item.homeshopping_name || '홈쇼핑',
                homeshopping_channel: item.homeshopping_channel || 1,
                live_date: item.live_date || targetDate || new Date().toISOString().split('T')[0],
                live_start_time: item.live_start_time || '00:00:00',
                live_end_time: item.live_end_time || '01:00:00',
                promotion_type: item.promotion_type || '일반',
                product_id: item.product_id || 0,
                product_name: item.product_name || '상품명 없음',
                썸네일: item.thumb_img_url || '',
                sale_price: item.sale_price || 0,
                dc_price: item.dc_price || item.sale_price || 0,
                dc_rate: item.dc_rate || 0
              };
              
              // 할인율이 0이면 할인가격을 정가와 동일하게 설정
              if (validatedItem.dc_rate === 0) {
                validatedItem.dc_price = validatedItem.sale_price;
              }
              
              return validatedItem;
            });
            
            // console.log('✅ 검증된 schedules 데이터:', validatedSchedules.length, '개');
            // console.log('✅ 첫 번째 검증된 아이템:', validatedSchedules[0]);
            
            // 가격 데이터 상세 로그 (안전하게 처리)
            if (validatedSchedules.length > 0) {
              const firstItem = validatedSchedules[0];
              // console.log('💰 가격 데이터 상세:');
              // console.log('  - sale_price:', firstItem.sale_price, typeof firstItem.sale_price);
              // console.log('  - dc_price:', firstItem.dc_price, typeof firstItem.dc_price);
              // console.log('  - dc_rate:', firstItem.dc_rate, typeof firstItem.dc_rate);
              
              // 첫 번째 아이템의 모든 필드 확인
              // console.log('🔍 첫 번째 아이템 전체 필드:');
              // console.log(Object.keys(firstItem));
              // console.log('📋 첫 번째 아이템 전체 데이터:', JSON.stringify(firstItem, null, 2));
            } else {
              console.log('📋 schedules 배열이 비어있음');
            }
            
                         // API 응답에 status 필드가 없으므로 계산해서 추가
             // 실제 방송 날짜와 오늘 날짜를 비교하여 방송 상태 판단
             const schedulesWithStatus = validatedSchedules.map(item => {
               const now = new Date();
               const today = new Date();
               today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 (00:00:00)
               
               // 방송 날짜 파싱 (YYYY-MM-DD 형식)
               const liveDate = new Date(item.live_date);
               liveDate.setHours(0, 0, 0, 0);
               
               // 오늘 날짜와 방송 날짜 비교
               const isToday = liveDate.getTime() === today.getTime();
               const isPast = liveDate.getTime() < today.getTime();
               const isFuture = liveDate.getTime() > today.getTime();
               
               let status = 'LIVE 예정';
               
               if (isPast) {
                 // 과거 날짜면 종료
                 status = '종료';
               } else if (isFuture) {
                 // 미래 날짜면 예정
                 status = 'LIVE 예정';
               } else if (isToday) {
                 // 오늘 날짜면 시간 비교
                 const liveStart = new Date(today);
                 const [startHour, startMinute] = item.live_start_time.split(':').map(Number);
                 liveStart.setHours(startHour, startMinute, 0, 0);
                 
                 const liveEnd = new Date(today);
                 const [endHour, endMinute] = item.live_end_time.split(':').map(Number);
                 liveEnd.setHours(endHour, endMinute, 0, 0);
                 
                 const currentTime = new Date(today);
                 currentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                 
                 if (currentTime >= liveStart && currentTime <= liveEnd) {
                   status = 'LIVE';
                 } else if (currentTime > liveEnd) {
                   status = '종료';
                 } else {
                   status = 'LIVE 예정';
                 }
               }
               
               return {
                 ...item,
                 status
               };
             });
            
                         setScheduleData(schedulesWithStatus);
             
             // 더 많은 데이터가 있는지 확인
             if (validatedSchedules.length < pageSize) {
               setHasMoreData(false);
               console.log('📋 첫 페이지에서 모든 데이터를 가져왔습니다.');
             } else {
               setHasMoreData(true);
               console.log('📋 더 많은 데이터가 있을 수 있습니다. 스크롤하여 확인하세요.');
             }
             
             // 스케줄 데이터 로딩 완료 후 찜 상태 초기화
             initializeWishlistStatus();
             
             retryCount = 0; // 성공 시 재시도 카운트 리셋
          } else {
            console.log('❌ API 응답에 schedules가 없음');
            console.log('❌ response:', response);
            console.log('❌ response.data:', response?.data);
            console.log('❌ response.data.schedules:', response?.data?.schedules);
            setScheduleData([]);
            setHasMoreData(false);
          }
        }
        
      } catch (error) {
        if (isMounted) {
          console.error('스케줄 데이터 가져오기 실패:', error);
          
          // 에러 타입에 따른 구체적인 메시지 제공
          let errorMessage = '스케줄 데이터를 가져올 수 없습니다.';
          
          if (error.response?.status === 500) {
            if (error.response.data?.includes('Proxy error') || error.response.data?.includes('ECONNRESET')) {
              errorMessage = '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
            } else {
              errorMessage = '서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.';
            }
          } else if (error.response?.status === 404) {
            errorMessage = '편성표 정보를 찾을 수 없습니다.';
          } else if (error.response?.status === 401) {
            errorMessage = '로그인이 필요합니다.';
          } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            errorMessage = '요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
          }
          
          // 재시도 로직
          if (retryCount < maxRetries && (error.response?.status === 500 || error.code === 'ECONNABORTED')) {
            retryCount++;
            console.log(`🔄 편성표 API 재시도 ${retryCount}/${maxRetries}`);
            
            // 3초 후 재시도
            setTimeout(() => {
              if (isMounted) {
                fetchData();
              }
            }, 3000);
            
            errorMessage = `서버 연결 문제로 재시도 중입니다... (${retryCount}/${maxRetries})`;
          }
          
          setError(errorMessage);
          setHasMoreData(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    // 컴포넌트 언마운트 시 정리 함수
    return () => {
      isMounted = false;
    };
  }, [selectedDate, pageSize]); // selectedDate와 pageSize가 변경될 때마다 API 재호출
  
  // 스크롤 이벤트 리스너 추가/제거
  useEffect(() => {
    const scheduleContent = scheduleContentRef.current;
    if (scheduleContent) {
      scheduleContent.addEventListener('scroll', handleScroll);
      
      return () => {
        scheduleContent.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);


  // 현재 시간 가져오기
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:00`;
  };

  // 현재 시간인지 확인
  const isCurrentTime = (time) => {
    return time === getCurrentTime();
  };



  // 상품 클릭 핸들러 - 상품 상세 페이지로 이동 (live_id 사용)
  const handleProductClick = async (liveId) => {
    try {
      console.log('상품 클릭 (live_id):', liveId);
      
      // 전체 페이지 로딩 상태 시작
      setIsNavigatingToProduct(true);
      
      // 로딩 상태 시작
      setIsProductDetailLoading(true);
      setLoadingProductId(liveId);
      
      // 상품 분류 확인 (식재료/완제품) - live_id 사용
      const classificationResponse = await homeShoppingApi.checkProductClassification(liveId);
      console.log('상품 분류:', classificationResponse);
      
      // 상품 상세 정보 가져오기 - live_id 사용
      const productDetail = await homeShoppingApi.getProductDetail(liveId);
      console.log('상품 상세:', productDetail);
      
      // 상품 상세 페이지로 이동 (live_id 사용)
      navigate(`/homeshopping/product/${liveId}`, {
        state: {
          productDetail,
          isIngredient: classificationResponse.is_ingredient,
          fromSchedule: true
        }
      });
      
    } catch (error) {
      console.error('상품 상세 정보 가져오기 실패:', error);
      // 에러가 발생해도 상품 상세 페이지로 이동 (기본 정보만으로)
      navigate(`/homeshopping/product/${liveId}`, {
        state: {
          fromSchedule: true
        }
      });
    } finally {
      // 로딩 상태 종료
      setIsProductDetailLoading(false);
      setLoadingProductId(null);
      setIsNavigatingToProduct(false);
    }
  };

  // 라이브 스트림 URL 가져오기 (live_id 사용)
  const getLiveStreamUrl = async (liveId) => {
    try {
      setIsStreamLoading(true);
      const streamData = await homeShoppingApi.getLiveStreamUrl(liveId);
      setLiveStreamData(prev => ({
        ...prev,
        [liveId]: streamData
      }));
      return streamData;
    } catch (error) {
      console.error('라이브 스트림 URL 가져오기 실패:', error);
      return null;
    } finally {
      setIsStreamLoading(false);
    }
  };

  // 라이브 스트림 재생 (live_id 사용)
  const handleLiveStream = async (liveId) => {
    try {
      const streamData = await getLiveStreamUrl(liveId);
      if (streamData && streamData.stream_url) {
        // 새 창에서 라이브 스트림 열기
        window.open(streamData.stream_url, '_blank', 'width=800,height=600');
      } else {
        setModalState(showAlert('현재 라이브 스트림을 사용할 수 없습니다.'));
      }
    } catch (error) {
      console.error('라이브 스트림 재생 실패:', error);
      setModalState(showAlert('라이브 스트림을 재생할 수 없습니다.'));
    }
  };

  // 위시리스트 토글
  const toggleWishlist = async (itemId) => {
    try {
      // TODO: 실제 API 호출로 대체
      // await wishlistApi.toggleWishlist(itemId);
      
      console.log(`위시리스트 토글: ${itemId}`);
      
      // 애니메이션 효과 추가
      const wishlistBtn = document.querySelector(`[data-item-id="${itemId}"]`);
      if (wishlistBtn) {
        const currentItem = scheduleData.find(item => item.live_id === itemId);
        if (currentItem?.wishlist) {
          // 찜 해제 애니메이션
          wishlistBtn.classList.add('unliked');
          setTimeout(() => wishlistBtn.classList.remove('unliked'), 400);
        } else {
          // 찜 추가 애니메이션
          wishlistBtn.classList.add('liked');
          setTimeout(() => wishlistBtn.classList.remove('liked'), 600);
        }
      }
      
    } catch (err) {
      console.error('위시리스트 토글 실패:', err);
      setModalState(showAlert('위시리스트 처리에 실패했습니다. 다시 시도해주세요.'));
    }
  };

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  };

  // 찜 토글 함수 (홈쇼핑 상품용) - live_id 사용
  const handleHeartToggle = async (liveId) => {
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('토큰이 없어서 로그인 필요 팝업 표시');
        // 다른 파일들과 동일하게 alert만 표시하고 제자리에 유지
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        return;
      }

      // 찜 토글 API 호출 (live_id 사용 - 새로운 API 명세)
      const requestPayload = { 
        live_id: liveId
      };
      
      // console.log('🔍 찜 토글 API 요청 페이로드:', requestPayload);
      
      const response = await api.post('/api/homeshopping/likes/toggle', requestPayload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('찜 토글 응답:', response.data);

             // 찜 토글 성공 후 백엔드 응답에 따라 상태 업데이트
       if (response.data) {
         console.log('찜 토글 성공! 백엔드 응답에 따라 상태를 업데이트합니다.');
         
         // 백엔드 응답의 liked 상태에 따라 찜 상태 업데이트
         const isLiked = response.data.liked;
         const productId = liveId;
         
         setWishlistedProducts(prev => {
           const newSet = new Set(prev);
           if (isLiked) {
             // 백엔드에서 찜된 상태로 응답
             newSet.add(productId);
             console.log('✅ 찜이 추가되었습니다. 채워진 하트로 변경됩니다.');
           } else {
             // 백엔드에서 찜 해제된 상태로 응답
             newSet.delete(productId);
             console.log('❌ 찜이 해제되었습니다. 빈 하트로 변경됩니다.');
           }
           return newSet;
         });
        
        // 애니메이션 효과 추가
        const heartButton = document.querySelector(`[data-product-id="${liveId}"]`);
        if (heartButton) {
          heartButton.style.transform = 'scale(1.2)';
          setTimeout(() => {
            heartButton.style.transform = 'scale(1)';
          }, 150);
        }
        
        // 찜 상태에 따른 알림 모달 표시
        if (isLiked) {
          // 찜 추가 시 알림
          setModalState(showWishlistNotification());
        } else {
          // 찜 해제 시 알림
          setModalState(showWishlistUnlikedNotification());
        }
        
        // 위시리스트 데이터는 즉시 동기화하지 않음
        // 페이지 벗어나거나 새로고침할 때 동기화됨
      }
    } catch (err) {
      console.error('찜 토글 실패:', err);
      
      // 401 에러 (인증 실패) 시 제자리에 유지
      if (err.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        return;
      }
      
      // 다른 에러의 경우 사용자에게 알림
      setModalState(showAlert('찜 상태 변경에 실패했습니다. 다시 시도해주세요.'));
    }
  };

  // 알림 핸들러
  const handleNotification = () => {
    navigate('/notifications');
  };

  // 방송 상태 표시 함수
  const renderStatusBadge = (status, promotionType) => {
    let statusText = '';
    let statusClass = '';
    
    switch (status) {
      case 'LIVE':
        statusText = 'LIVE';
        statusClass = 'status-live';
        break;
      case 'LIVE 예정':
        statusText = 'LIVE 예정';
        statusClass = 'status-upcoming';
        break;
      case '종료':
        statusText = 'LIVE 종료';
        statusClass = 'status-ended';
        break;
      default:
        // 기본값도 방영예정으로 설정
        statusText = '방영예정';
        statusClass = 'status-upcoming';
    }
    
    return (
      <div className="status-badges-container">
        <div className={`status-badge ${statusClass}`}>
          {statusText}
        </div>
        {promotionType && (
          <div className={`promotion-type-badge ${promotionType === 'main' ? 'main-product' : 'sub-product'}`}>
            {promotionType === 'main' ? '메인상품' : '서브상품'}
          </div>
        )}
      </div>
    );
  };

  // 라이브 스트림 버튼 렌더링
  const renderLiveStreamButton = (item) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 (00:00:00)
    
    // 방송 날짜를 오늘 날짜로 설정하여 시간만 비교
    const liveStart = new Date(today);
    const [startHour, startMinute] = item.live_start_time.split(':').map(Number);
    liveStart.setHours(startHour, startMinute, 0, 0);
    
    const liveEnd = new Date(today);
    const [endHour, endMinute] = item.live_end_time.split(':').map(Number);
    liveEnd.setHours(endHour, endMinute, 0, 0);
    
    // 현재 시간을 오늘 날짜 기준으로 설정
    const currentTime = new Date(today);
    currentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    // 현재 방송 중인지 확인
    const isCurrentlyLive = currentTime >= liveStart && currentTime <= liveEnd;
    
    if (isCurrentlyLive) {
      return (
                 <button 
           className="live-stream-btn"
           onClick={(e) => {
             e.stopPropagation();
             handleLiveStream(item.live_id);
           }}
           disabled={isStreamLoading}
         >
          {isStreamLoading ? (
            <Loading message="로딩 중..." containerStyle={{ padding: '0', margin: '0' }} />
          ) : (
            '라이브 시청'
          )}
        </button>
      );
    }
    
    return null;
  };

  // 왼쪽 탭 렌더링
  const renderLeftSidebar = () => {
    const handleChannelClick = (channel) => {
      console.log('채널 클릭:', {
        id: channel.id,
        name: channel.name,
        channel: channel.channel
      });
      
      // 같은 홈쇼핑을 다시 클릭하면 선택 해제, 다르면 선택
      if (selectedHomeshopping && selectedHomeshopping.id === channel.id) {
        setSelectedHomeshopping(null);
        console.log('홈쇼핑 선택 해제:', channel.name);
      } else {
        setSelectedHomeshopping(channel);
        console.log('홈쇼핑 선택:', channel.name);
      }
    };

    return (
      <div className="left-sidebar">
        <div className="channel-list">
          {/* 전체 채널 옵션 */}
          <div className="channel-item">
            <div 
              className={`schedule-channel-logo ${!selectedHomeshopping ? 'selected-channel' : ''}`}
              onClick={() => {
                setSelectedHomeshopping(null);
                console.log('전체 채널 선택');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="all-channels-text">전체 채널</div>
            </div>
          </div>
          
          {homeshoppingChannels.map((channel) => (
            <div key={channel.id} className="channel-item">
              <div 
                className={`schedule-channel-logo ${selectedHomeshopping && selectedHomeshopping.id === channel.id ? 'selected-channel' : ''}`}
                onClick={() => handleChannelClick(channel)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={channel.logo} 
                  alt={channel.name} 
                  // style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                />
                {/* {selectedHomeshopping && selectedHomeshopping.id === channel.id && (
                  <div className="channel-selection-indicator">✓</div>
                )} */}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 에러 메시지 렌더링
  const renderErrorMessage = () => {
    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
        </div>
      );
    }
    return null;
  };

  // 로딩 상태 렌더링
  const renderLoading = () => {
    if (isLoading) {
      return (
        <div className="schedule-loading-container">
          <Loading message="편성표를 불러오는 중..." />
        </div>
      );
    }
    return null;
  };

    // 편성표 목록 렌더링
  const renderScheduleList = () => {
    const filteredData = getFilteredScheduleData();
    
    if (!filteredData || filteredData.length === 0) {
      let subtitle = '';
      
      if (selectedHomeshopping) {
        subtitle = `${selectedHomeshopping.name}의 방송 일정이 없습니다`;
      } else if (selectedDate || selectedTime) {
        subtitle = '선택한 날짜/시간에 방송 예정인 프로그램이 없습니다';
      } else {
        subtitle = '오늘은 방송 예정인 프로그램이 없습니다';
      }
      
      return (
        <div className="no-schedule-container">
          <div className="no-schedule-content">
            <div className="no-schedule-title">방송 일정이 없습니다</div>
            <div className="no-schedule-subtitle">{subtitle}</div>
          </div>
        </div>
      );
    }

    // 전체 방송 시간 범위 계산
    const startTime = filteredData[0]?.live_start_time?.substring(0, 5) || '';
    const endTime = filteredData[filteredData.length - 1]?.live_end_time?.substring(0, 5) || '';

    return (
      <div className="schedule-timeline" ref={scheduleContentRef}>
        {filteredData.map((item) => {
          // console.log('스케줄 아이템 product_id:', item.product_id, typeof item.product_id);
          
          // 각 아이템의 방송 시간 계산
          const itemStartTime = item.live_start_time?.substring(0, 5) || '';
          const itemEndTime = item.live_end_time?.substring(0, 5) || '';
          
          // 할인율이 0인 경우 할인가격을 정가와 동일하게 표시
          const displayDcPrice = item.dc_rate > 0 ? item.dc_price : item.sale_price;
          const displayDcRate = item.dc_rate > 0 ? item.dc_rate : 0;
          
          // homeshopping_id에 해당하는 로고와 채널 정보 가져오기
          const channelLogo = getLogoByHomeshoppingId(item.homeshopping_id);
          const channelInfo = getChannelInfoByHomeshoppingId(item.homeshopping_id);
          
          // 로고 정보 디버깅 (개발 환경에서만)
          // if (process.env.NODE_ENV === 'development') {
          //   console.log('로고 정보:', {
          //     homeshopping_id: item.homeshopping_id,
          //     channelLogo: channelLogo,
          //     channelInfo: channelInfo
          //   });
          // }
          
          return (
            <div key={item.live_id} className="schedule-item-wrapper">
              {/* 각 홈쇼핑마다 시간 범위를 흰색 박스 밖에 표시 */}
              <div className="schedule-time-header">
                <span className="time-range">
                  {itemStartTime} ~ {itemEndTime}
                </span>
                                 {/* 홈쇼핑 채널 정보 추가 */}
                 <span className="channel-info-display">
                   [CH {item.homeshopping_channel}]
                 </span>
              </div>
              
              <div className="schedule-item" onClick={() => handleProductClick(item.live_id)}>
                <div className="schedule-content">
                <div className="schedule-image">
                  {isProductDetailLoading && loadingProductId === item.live_id ? (
                    <div className="product-loading-overlay">
                      <Loading message="로딩 중..." containerStyle={{ padding: '10px', margin: '0' }} />
                    </div>
                  ) : (
                                         <img 
                       src={item.썸네일} 
                       alt={item.product_name || '상품 이미지'}
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
                  )}
                  {renderStatusBadge(item.status, item.promotion_type)}
                </div>
                <div className="schedule-info">
                  <div className="channel-info">
                    {/* 홈쇼핑 로고와 채널 번호 표시 */}
                    <div className="schedule-channel-logo-small">
                      {channelLogo && channelLogo.logo ? (
                        <img 
                          src={channelLogo.logo} 
                          alt={channelLogo.name || '홈쇼핑 로고'} 
                        />
                      ) : (
                        <div className="default-logo-placeholder">
                          {item.homeshopping_name?.charAt(0) || '홈'}
                        </div>
                      )}
                    </div>
                    {/* 채널 번호 표시 */}
                    <div className="schedule-channel-number">
                      [CH {item.homeshopping_channel}]
                    </div>
                  </div>
                  <div className="schedule-product-meta">
                    <div className="schedule-product-name">{item.product_name}</div>

                  </div>
                  <div className="schedule-price-info">
                    {displayDcRate > 0 ? (
                      <>
                        <div className="schedule-original-price">
                          {item.sale_price?.toLocaleString() || '0'}원
                        </div>
                        <div className="schedule-price-row">
                          <div className="schedule-discount-display">
                            <span className="schedule-discount-rate">{displayDcRate}%</span>
                            <span className="schedule-discount-price schedule-discount-price-normal">{displayDcPrice?.toLocaleString() || '0'}원</span>
                          </div>
                          <div className="schedule-wishlist-btn">
                            <button 
                              className="heart-button"
                              data-product-id={item.live_id}
                              onClick={(e) => {
                                e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                handleHeartToggle(item.live_id);
                              }}
                            >
                              <img 
                                src={wishlistedProducts.has(item.live_id) ? filledHeartIcon : emptyHeartIcon} 
                                alt="찜 토글" 
                                className="heart-icon"
                              />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="schedule-price-row">
                        <div className="schedule-discount-display">
                          <span className="schedule-discount-price schedule-discount-price-normal">{displayDcPrice?.toLocaleString() || '0'}원</span>
                        </div>
                        <div className="schedule-wishlist-btn">
                          <button 
                            className="heart-button"
                            data-product-id={item.live_id}
                            onClick={(e) => {
                              e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                              handleHeartToggle(item.live_id);
                            }}
                          >
                            <img 
                              src={wishlistedProducts.has(item.live_id) ? filledHeartIcon : emptyHeartIcon} 
                              alt="찜 토글" 
                              className="heart-icon"
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
       
       {/* 추가 데이터 로딩 상태 표시 */}
       {isLoadingMore && (
         <div className="loading-more-container">
           <Loading message="더 많은 상품을 불러오는 중..." />
         </div>
       )}
       
       {/* 더 이상 데이터가 없음을 표시 */}
       {!hasMoreData && scheduleData.length > 0 && (
         <div className="no-more-data-container">
           <p>모든 상품을 불러왔습니다.</p>
         </div>
       )}
       
       {/* 편성표 목록 아래 여백 추가 */}
       <div style={{ height: '20px' }}></div>
     </div>
    );
  };

  return (
    <div className="schedule-page">
      {/* 편성표 헤더 네비게이션 */}
      <HeaderNavSchedule 
        onBackClick={() => navigate(-1)}
        onSearchClick={(searchTerm) => navigate('/homeshopping/search?type=homeshopping')}
        onNotificationClick={handleNotification}
      />
      
      {/* 전체 페이지 로딩 오버레이 */}
      {isNavigatingToProduct && (
        <div 
          style={{
            position: 'fixed',
            top: '80px',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
          >
            <Loading message="상품 정보를 불러오는 중..." />
          </div>
        </div>
      )}

      <div className="schedule-main-container">
        {/* 메인 콘텐츠 */}
        <div className="schedule-content">
          {/* 날짜 선택 캘린더 */}
          <div className="date-calendar">
            <div className="calendar-header">
              <div className="calendar-dates">
                {weekDates.map((item, index) => (
                  <div 
                    key={index}
                    className={`calendar-date ${item.isToday ? 'today' : ''} ${selectedDate === item.dateKey ? 'selected' : ''}`}
                    onClick={() => {
                      if (item.isToday) {
                        // 오늘 날짜 클릭 시
                        if (selectedDate === item.dateKey) {
                          // 이미 선택된 상태라면 선택 해제
                          setSelectedDate(null);
                          console.log('오늘 날짜 선택 해제');
                        } else {
                          // 선택되지 않은 상태라면 선택
                          setSelectedDate(item.dateKey);
                          console.log('오늘 날짜 선택:', item.dateKey);
                        }
                      } else {
                        // 다른 날짜 클릭 시 해당 날짜 선택 (API 재호출)
                        setSelectedDate(item.dateKey);
                        console.log('날짜 선택 (API 호출):', item.dateKey);
                      }
                    }}
                  >
                    <div className="date-number">{item.date}</div>
                    <div className="date-day">{item.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 시간대와 편성표 영역 */}
          <div className="schedule-main-area">
            {/* 시간대 표시 */}
            <div className="time-slots-container">
              <div className="time-slots" ref={timeSlotsRef}>
                {timeSlots.map((time, index) => (
                  <div 
                    key={index} 
                    className={`time-slot ${isCurrentTime(time) ? 'current-time' : ''} ${selectedTime === time ? 'selected-time' : ''}`}
                    style={isCurrentTime(time) ? { backgroundColor: 'rgba(233, 30, 99, 0.1)' } : {}}
                    onClick={() => handleTimeClick(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* 편성표 메인 영역 */}
            <div className="schedule-main-content">
              {/* 왼쪽 사이드바 */}
              {renderLeftSidebar()}
              {/* 편성표 콘텐츠 */}
              <div className="schedule-content-main">
                
                
                {/* 에러 메시지 */}
                {renderErrorMessage()}
                
                {/* 로딩 상태 */}
                {renderLoading()}
                
                {/* 편성표 목록 - 로딩 중이 아닐 때만 표시 */}
                {!isLoading && renderScheduleList()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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

export default Schedule;