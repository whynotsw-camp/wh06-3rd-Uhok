import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { homeShoppingApi } from '../../api/homeShoppingApi';
import { useUser } from '../../contexts/UserContext';
import HeaderNavSchedule from '../../layout/HeaderNavSchedule';
import BottomNav from '../../layout/BottomNav';
import Loading from '../../components/Loading';
import UpBtn from '../../components/UpBtn';
import HomeshoppingKokRecommendation from '../../components/HomeshoppingKokRecommendation';
import LiveStreamPlayer from '../../components/player/LiveStreamPlayer';
import ModalManager, { showWishlistNotification, showWishlistUnlikedNotification, showNoRecipeNotification, showAlert, hideModal } from '../../components/LoadingModal';
import VideoPopUp from '../../components/VideoPopUp';
import emptyHeartIcon from '../../assets/heart_empty.png';
import filledHeartIcon from '../../assets/heart_filled.png';
import api from '../../pages/api';

// 홈쇼핑 로고 관련 컴포넌트
import { getLogoByHomeshoppingId, getChannelInfoByHomeshoppingId } from '../../components/homeshoppingLogo';

import '../../styles/homeshopping_product_detail.css';
import '../../styles/liveStream.css';

const HomeShoppingProductDetail = () => {
  const navigate = useNavigate();
  const { live_id } = useParams(); // live_id 또는 homeshopping_id로 사용
  const location = useLocation();
  const { user, isLoggedIn } = useUser();
  
  // 상태 관리
  const [productDetail, setProductDetail] = useState(null);
  const [detailInfos, setDetailInfos] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [kokRecommendations, setKokRecommendations] = useState([]);

  const [wishlistedProducts, setWishlistedProducts] = useState(new Set()); // 찜된 상품 ID들을 저장
  const [activeTab, setActiveTab] = useState('detail'); // 탭 상태 관리
  
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });
  
  // VideoPopUp 상태 관리
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [videoPopupData, setVideoPopupData] = useState({
    videoUrl: '',
    productName: '',
    homeshoppingName: '',
    kokProductId: ''
  });
  
  // 홈쇼핑 주문 모달 상태 관리
  const [showHomeshoppingOrderModal, setShowHomeshoppingOrderModal] = useState(false);

  // 커스텀 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };
  
  // 상품 상세 정보 가져오기
  useEffect(() => {
    // live_id가 유효하지 않으면 API 호출하지 않음
    if (!live_id || live_id === 'undefined' || live_id === 'null' || live_id === '') {
      console.log('❌ 유효하지 않은 live_id:', live_id, '타입:', typeof live_id);
      setError('상품 ID가 유효하지 않습니다.');
      setLoading(false);
      return;
    }
    
    console.log('🔍 홈쇼핑 상세 페이지 로드:', {
      live_id: live_id,
      type: typeof live_id,
      location_state: location.state
    });
    
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2; // 최대 2번만 재시도
    
    const fetchProductDetail = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        
        // 상품 상세 정보 가져오기 (live_id 사용)
        console.log('🔍 홈쇼핑 상품 상세 API 호출:', {
          live_id: live_id,
          api_url: `/api/homeshopping/product/${live_id}`
        });
        const detailResponse = await homeShoppingApi.getProductDetail(live_id);
        console.log('✅ 홈쇼핑 상품 상세 API 응답:', detailResponse);
        
        if (!isMounted) return;
        
        if (detailResponse && detailResponse.product) {
          setProductDetail(detailResponse.product);
          setIsLiked(detailResponse.product.is_liked || false);
          
          // 상세 정보와 이미지 설정 (새로운 API 스펙에 맞게)
          if (detailResponse.detail_infos) {
            console.log('🔍 상세 정보 설정:', detailResponse.detail_infos);
            setDetailInfos(detailResponse.detail_infos);
          }
          if (detailResponse.images) {
            console.log('🔍 이미지 데이터 설정:', detailResponse.images);
            // 이미지 데이터 상세 분석
            detailResponse.images.forEach((img, index) => {
              console.log(`🔍 이미지 ${index + 1}:`, {
                img_url: img.img_url,
                sort_order: img.sort_order,
                is_null: img.img_url === null,
                is_empty: img.img_url === '',
                is_undefined: img.img_url === undefined
              });
            });
            setProductImages(detailResponse.images);
          }
          
          // 상품 상세 정보 로딩 완료 후 찜 상태 초기화
          if (isMounted) {
            initializeWishlistStatus();
          }
        }
        
                 // 콕 상품 추천과 레시피 추천은 productDetail이 설정된 후에 호출
         // 이 부분은 useEffect의 의존성 배열에 productDetail을 추가하여 처리
        
        // 라이브 스트림 정보 가져오기 (상품 상세 정보에서 homeshopping_id 사용)
        try {
          // 상품 상세 정보에서 homeshopping_id 가져오기
          const homeshoppingId = detailResponse.product?.homeshopping_id;
          
          if (homeshoppingId) {
            const streamResponse = await homeShoppingApi.getLiveStreamUrl(homeshoppingId);
            
            if (isMounted) {
              setStreamData(streamResponse);
              
              // API 명세서에 맞게 HTML 템플릿을 렌더링하여 window.__LIVE_SRC__ 설정
              if (streamResponse?.html_template) {
                try {
                  // HTML 템플릿을 임시 div에 렌더링하여 스크립트 실행
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = streamResponse.html_template;
                  document.body.appendChild(tempDiv);
                  
                  // 스크립트 태그들을 찾아서 실행
                  const scripts = tempDiv.querySelectorAll('script');
                  scripts.forEach(script => {
                    if (script.textContent.includes('window.__LIVE_SRC__')) {
                      // window.__LIVE_SRC__ 설정 스크립트 실행
                      eval(script.textContent);
                    }
                  });
                  
                  // 임시 div 제거
                  document.body.removeChild(tempDiv);
                } catch (renderError) {
                  console.error('HTML 템플릿 렌더링 실패:', renderError);
                }
              }
            }
          } else {
            setStreamData(null);
          }
        } catch (streamError) {
          console.error('라이브 스트림 정보 가져오기 실패:', streamError);
          // 라이브 스트림 에러는 상품 표시에 영향을 주지 않도록 처리
        }
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('상품 상세 정보 가져오기 실패:', error);
        
        // 500 에러인 경우 재시도 로직
        if (error.response?.status === 500 && retryCount < maxRetries) {
          retryCount++;
          
          setTimeout(() => {
            if (isMounted) {
              fetchProductDetail();
            }
          }, 3000);
          
          return; // 재시도 중에는 에러 상태를 설정하지 않음
        }
        
        // 최대 재시도 횟수 초과 또는 다른 에러인 경우
        let errorMessage = '상품 정보를 가져올 수 없습니다.';
        
        if (error.response?.status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.response?.status === 404) {
          errorMessage = '상품을 찾을 수 없습니다.';
        } else if (error.response?.status === 401) {
          errorMessage = '로그인이 필요합니다.';
        }
        
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (live_id) {
      fetchProductDetail();
    }
    
         // 컴포넌트 언마운트 시 정리
     return () => {
       isMounted = false;
     };
   }, [live_id]);
   
   // productDetail이 설정된 후 콕 상품 추천과 레시피 추천 가져오기
   useEffect(() => {
     if (!productDetail?.product_id) return;
     
     let isMounted = true;
     
     const fetchRecommendations = async () => {
               try {
          // 콕 상품 추천 가져오기 (새로운 API 엔드포인트 사용)
          const kokResponse = await homeShoppingApi.getKokRecommendations(productDetail.product_id);
         
        if (isMounted) {
          const products = kokResponse?.products || [];
          setKokRecommendations(products);
        }
        
        // 상품이 식재료인지 확인 (별도 체크 API 사용 - product_id 사용)
        try {
          console.log('🔍 상품 타입 확인 - productDetail:', productDetail);
          console.log('🔍 상품 타입 확인 - product_id:', productDetail?.product_id);
          
          if (!productDetail?.product_id) {
            console.error('❌ product_id가 없어서 상품 타입 확인을 건너뜁니다:', productDetail);
            if (isMounted) {
              setProductDetail(prev => ({
                ...prev,
                is_ingredient: false
              }));
            }
            return;
          }
          
          const checkResponse = await homeShoppingApi.checkProductType(productDetail.product_id);
          
          // 체크 API 응답에서 is_ingredient 정보를 가져와서 productDetail에 저장
          if (isMounted && checkResponse) {
            setProductDetail(prev => ({
              ...prev,
              is_ingredient: checkResponse.is_ingredient || false
            }));
          }
        } catch (error) {
          console.error('❌ 상품 타입 확인 실패:', error);
          // API 호출 실패 시 기본값으로 설정
          if (isMounted) {
            setProductDetail(prev => ({
              ...prev,
              is_ingredient: false
            }));
          }
        }
         
       } catch (error) {
         console.error('❌ 추천 데이터 가져오기 실패:', error);
         if (isMounted) {
           setKokRecommendations([]);
         }
       }
     };
     
     fetchRecommendations();
     
     return () => {
       isMounted = false;
     };
   }, [productDetail?.product_id]);
   
   // 홈쇼핑 주문 모달 이벤트 리스너
   useEffect(() => {
     const handleShowHomeshoppingOrderModal = (event) => {
       console.log('🏠 홈쇼핑 주문 모달 이벤트 수신:', event.detail);
       setShowHomeshoppingOrderModal(true);
     };
     
     window.addEventListener('showHomeshoppingOrderModal', handleShowHomeshoppingOrderModal);
     
     return () => {
       window.removeEventListener('showHomeshoppingOrderModal', handleShowHomeshoppingOrderModal);
     };
   }, []);
  
  // 찜 상태 초기화 함수
  const initializeWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // 사용자의 찜한 홈쇼핑 상품 목록 가져오기 (live_id 기준)
      const response = await api.get('/api/homeshopping/likes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.liked_products) {
        const likedProductIds = new Set(response.data.liked_products.map(product => String(product.live_id)));
        console.log('🔍 찜 상태 초기화 - API 응답:', response.data.liked_products);
        console.log('🔍 찜 상태 초기화 - likedProductIds:', likedProductIds);
        console.log('🔍 찜 상태 초기화 - 현재 live_id:', live_id, typeof live_id);
        console.log('🔍 찜 상태 초기화 - live_id가 Set에 있는지:', likedProductIds.has(String(live_id)));
        setWishlistedProducts(likedProductIds);
      }
    } catch (error) {
      console.error('찜 상태 초기화 실패:', error);
    }
  };

  // 찜 토글 함수 (홈쇼핑 상품용) - Schedule.js와 동일한 방식
  const handleHeartToggle = async (liveId) => {
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
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

            // 찜 토글 성공 후 백엔드 응답에 따라 상태 업데이트
      if (response.data) {
        // 백엔드 응답의 liked 상태에 따라 찜 상태 업데이트
        const isLiked = response.data.liked;
        
        setWishlistedProducts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            // 백엔드에서 찜된 상태로 응답
            newSet.add(String(liveId));
          } else {
            // 백엔드에서 찜 해제된 상태로 응답
            newSet.delete(String(liveId));
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
  
  // 라이브 스트림 재생 (현재 창에서)
  const handleLiveStream = () => {
    const streamUrl = window.__LIVE_SRC__ || streamData?.stream_url;
    
    if (streamUrl) {
      // 현재 창에서 라이브 스트림 페이지로 이동
      navigate('/live-stream', {
        state: {
          streamUrl: streamUrl,
          productName: productDetail?.product_name || '홈쇼핑 라이브',
          homeshopping_id: productDetail?.homeshopping_id,
          homeshopping_name: productDetail?.homeshopping_name,
          product_name: productDetail?.product_name,
          // 방송 시간 정보 추가
          live_date: productDetail?.live_date,
          live_start_time: productDetail?.live_start_time,
          live_end_time: productDetail?.live_end_time
        }
      });
    } else {
      setModalState(showAlert('현재 스트림을 사용할 수 없습니다.'));
    }
  };
  
  // 콕 상품으로 이동
  const handleKokProductClick = (kokProductId) => {
    // 스트림 URL 검증 및 로깅
    const streamUrl = window.__LIVE_SRC__ || streamData?.stream_url || '';
    const isValidStreamUrl = streamUrl && 
      streamUrl.trim() !== '' && 
      streamUrl !== 'undefined' && 
      streamUrl !== 'null' &&
      (streamUrl.includes('http') || streamUrl.includes('m3u8') || streamUrl.includes('mp4'));
    
    // 방송 상태 확인
    const broadcastStatus = getBroadcastStatus();
    
    console.log('🚀 콕 상품으로 이동:', {
      kokProductId,
      streamUrl,
      isValidStreamUrl,
      windowLiveSrc: window.__LIVE_SRC__,
      streamDataUrl: streamData?.stream_url,
      productName: productDetail?.product_name,
      homeshoppingName: productDetail?.homeshopping_name,
      broadcastStatus,
      thumbnailUrl: productDetail?.thumb_img_url
    });
    
    // 홈쇼핑에서 콕 상품 페이지로 이동 (영상 데이터, 방송 상태, 썸네일 이미지 포함)
    navigate(`/kok/product/${kokProductId}`, {
      state: {
        fromHomeshopping: true,
        streamUrl: isValidStreamUrl ? streamUrl : '',
        productName: productDetail?.product_name || '상품명',
        homeshoppingName: productDetail?.homeshopping_name || '홈쇼핑',
        homeshoppingId: productDetail?.homeshopping_id || null,
        broadcastStatus: broadcastStatus,
        thumbnailUrl: productDetail?.thumb_img_url || null
      }
    });
  };

  // 레시피 가용성 확인 함수
  const checkRecipeAvailability = async () => {
    try {
      console.log('🔍 레시피 가용성 확인 - productDetail:', productDetail);
      console.log('🔍 레시피 가용성 확인 - product_id:', productDetail?.product_id);
      
      if (!productDetail?.product_id) {
        console.error('❌ product_id가 없습니다:', productDetail);
        setModalState(showNoRecipeNotification());
        return;
      }
      
      // 먼저 상품이 식재료인지 확인 (product_id 사용)
      const checkResponse = await homeShoppingApi.checkProductType(productDetail.product_id);
      
      if (checkResponse && checkResponse.is_ingredient) {
        // 식재료인 경우 레시피 추천 페이지로 이동
        navigate('/recipes/homeshopping-recommendation', {
          state: {
            product_id: productDetail.product_id, // product_id 사용
            product_name: productDetail.product_name
          }
        });
      } else {
        // 완제품인 경우 모달 표시
        setModalState(showNoRecipeNotification());
      }
    } catch (error) {
      console.error('레시피 가용성 확인 실패:', error);
      // 에러 발생 시에도 모달 표시
      setModalState(showNoRecipeNotification());
    }
  };

  // 홈쇼핑 주문 모달 닫기 함수
  const closeHomeshoppingOrderModal = () => {
    setShowHomeshoppingOrderModal(false);
  };
  

  // 전화 주문 함수
  const handlePhoneOrder = async () => {
    try {
      console.log('📞 전화 주문 클릭');
      
      if (!productDetail || !productDetail.product_id) {
        throw new Error('상품 정보를 찾을 수 없습니다.');
      }
      
      // 홈쇼핑 주문 생성 API 호출
      const orderResponse = await homeShoppingApi.createOrder(
        productDetail.product_id, 
        1 // 수량은 1로 고정
      );
      
      console.log('✅ 전화 주문 생성 성공:', orderResponse);
      
      // 주문 성공 알림
      setModalState(showAlert(`전화 주문이 성공적으로 생성되었습니다!<br>주문번호: ${orderResponse.order_id}<br>상품: ${orderResponse.product_name}<br>금액: ₩${orderResponse.order_price?.toLocaleString()}`));
      
      closeHomeshoppingOrderModal();
      
    } catch (error) {
      console.error('❌ 전화 주문 실패:', error);
      setModalState(showAlert(`전화 주문 생성에 실패했습니다.<br>${error.message || '알 수 없는 오류가 발생했습니다.'}`));
    }
  };
  
  // 모바일 주문 함수
  const handleMobileOrder = async () => {
    try {
      console.log('📱 모바일 주문 클릭');
      
      if (!productDetail || !productDetail.product_id) {
        throw new Error('상품 정보를 찾을 수 없습니다.');
      }
      
      // 홈쇼핑 주문 생성 API 호출
      const orderResponse = await homeShoppingApi.createOrder(
        productDetail.product_id, 
        1 // 수량은 1로 고정
      );
      
      console.log('✅ 모바일 주문 생성 성공:', orderResponse);
      
      // 주문 성공 알림
      setModalState(showAlert(`모바일 주문이 성공적으로 생성되었습니다!<br>주문번호: ${orderResponse.order_id}<br>상품: ${orderResponse.product_name}<br>금액: ₩${orderResponse.order_price?.toLocaleString()}`));
      
      closeHomeshoppingOrderModal();
      
    } catch (error) {
      console.error('❌ 모바일 주문 실패:', error);
      setModalState(showAlert(`모바일 주문 생성에 실패했습니다.<br>${error.message || '알 수 없는 오류가 발생했습니다.'}`));
    }
  };
  
  // 방송 상태 확인
  const getBroadcastStatus = () => {
    if (!productDetail || !productDetail.live_date || !productDetail.live_start_time || !productDetail.live_end_time) {
      return null;
    }
    
    const now = new Date();
    
    // 원본 데이터 로깅
    console.log('📅 원본 방송 데이터:', {
      live_date: productDetail.live_date,
      live_start_time: productDetail.live_start_time,
      live_end_time: productDetail.live_end_time
    });
    
         // 현재 시간은 이미 한국 시간이므로 UTC 변환 불필요
     const koreaTime = now;
    
    // 방송 날짜와 시간을 파싱하여 한국 시간 기준으로 Date 객체 생성
    const [year, month, day] = productDetail.live_date.split('-').map(Number);
    const [startHour, startMinute] = productDetail.live_start_time.split(':').map(Number);
    const [endHour, endMinute] = productDetail.live_end_time.split(':').map(Number);
    
    // 한국 시간 기준으로 방송 시작/종료 시간 생성
    const liveStart = new Date(year, month - 1, day, startHour, startMinute);
    const liveEnd = new Date(year, month - 1, day, endHour, endMinute);
    
    // 현재 날짜가 방송 날짜와 같은지 확인 (한국 시간 기준)
    const currentDate = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    const broadcastDate = new Date(year, month - 1, day);
    const isSameDate = currentDate.getTime() === broadcastDate.getTime();
    
    // 디버깅을 위한 로그
    console.log('📅 방송 상태 확인:', {
      현재한국시간: koreaTime.toLocaleString('ko-KR'),
      방송날짜: productDetail.live_date,
      방송시작: liveStart.toLocaleString('ko-KR'),
      방송종료: liveEnd.toLocaleString('ko-KR'),
      날짜일치: isSameDate,
      현재시간: koreaTime.getTime(),
      방송시작시간: liveStart.getTime(),
      방송종료시간: liveEnd.getTime()
    });
    
    // 날짜가 다르면 방송 예정 또는 방송 종료로 표시
    if (!isSameDate) {
      if (koreaTime < liveStart) {
        return { status: 'upcoming', text: '방송 예정' };
      } else {
        return { status: 'ended', text: '방송 종료' };
      }
    }
    
    // 같은 날짜인 경우 시간 비교
    if (koreaTime < liveStart) {
      return { status: 'upcoming', text: '방송 예정' };
    } else if (koreaTime >= liveStart && koreaTime < liveEnd) {
      return { status: 'live', text: 'LIVE' };
    } else {
      return { status: 'ended', text: '방송 종료' };
    }
  };

  // 현재 시간이 라이브 방송 시간인지 확인하는 함수 (정확한 날짜와 시간 비교)
  const isCurrentlyLive = () => {
    if (!productDetail || !productDetail.live_date || !productDetail.live_start_time || !productDetail.live_end_time) {
      console.log('❌ 방송 정보가 부족합니다:', { 
        live_date: productDetail?.live_date, 
        live_start_time: productDetail?.live_start_time, 
        live_end_time: productDetail?.live_end_time 
      });
      return false;
    }
    
    // 현재 시간 사용 (브라우저의 로컬 시간대 기준)
    const koreaTime = new Date();
    
    // 방송 날짜와 시간을 파싱하여 한국 시간 기준으로 Date 객체 생성
    const [year, month, day] = productDetail.live_date.split('-').map(Number);
    const [startHour, startMinute] = productDetail.live_start_time.split(':').map(Number);
    const [endHour, endMinute] = productDetail.live_end_time.split(':').map(Number);
    
    // 한국 시간 기준으로 방송 시작/종료 시간 생성
    const liveStart = new Date(year, month - 1, day, startHour, startMinute);
    const liveEnd = new Date(year, month - 1, day, endHour, endMinute);
    
    // 현재 날짜가 방송 날짜와 같은지 확인 (한국 시간 기준)
    const currentDate = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    const broadcastDate = new Date(year, month - 1, day);
    
    // 날짜 비교 (년, 월, 일만 비교)
    const isSameDate = currentDate.getTime() === broadcastDate.getTime();
    
    // 현재 시간이 방송 시작 시간과 종료 시간 사이에 있는지 확인 (시작 시간 포함, 종료 시간 제외)
    const isWithinTimeRange = koreaTime >= liveStart && koreaTime < liveEnd;
    
    // 디버깅을 위한 로그 (더 자세한 정보)
    console.log('🔍 라이브 상태 확인:', {
      현재한국시간: koreaTime.toLocaleString('ko-KR'),
      방송날짜: productDetail.live_date,
      방송시작: liveStart.toLocaleString('ko-KR'),
      방송종료: liveEnd.toLocaleString('ko-KR'),
      날짜일치: isSameDate,
      시간범위내: isWithinTimeRange,
      최종결과: isSameDate && isWithinTimeRange,
      // 추가 디버깅 정보
      현재시간타임스탬프: koreaTime.getTime(),
      방송시작타임스탬프: liveStart.getTime(),
      방송종료타임스탬프: liveEnd.getTime(),
      시간차: {
        방송시작까지: liveStart.getTime() - koreaTime.getTime(),
        방송종료까지: liveEnd.getTime() - koreaTime.getTime()
      }
    });
    
    // 두 조건 모두 만족해야 라이브 상태
    // 1. 오늘 날짜와 방송 날짜가 같아야 함 (한국 시간 기준)
    // 2. 현재 시간이 방송 시작~종료 시간 사이에 있어야 함 (한국 시간 기준)
    return isSameDate && isWithinTimeRange;
  };


  
  // 로딩 상태
  if (loading) {
    return (
      <div className="homeshopping-product-detail-page">
        <HeaderNavSchedule 
          onBackClick={() => navigate(-1)}
          onSearchClick={(searchTerm) => navigate('/homeshopping/search?type=homeshopping')}
          onNotificationClick={() => navigate('/notifications')}
        />
        <div className="loading-container">
          <Loading message="상품 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (error) {
    return (
      <div className="homeshopping-product-detail-page">
        <HeaderNavSchedule 
          onBackClick={() => navigate(-1)}
          onSearchClick={(searchTerm) => navigate('/homeshopping/search?type=homeshopping')}
          onNotificationClick={() => navigate('/notifications')}
        />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">상품 정보를 불러올 수 없습니다</h2>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }
  
  // 상품 정보가 없는 경우
  if (!productDetail) {
    return (
      <div className="homeshopping-product-detail-page">
        <HeaderNavSchedule 
          onBackClick={() => navigate(-1)}
          onSearchClick={(searchTerm) => navigate('/homeshopping/search?type=homeshopping')}
          onNotificationClick={() => navigate('/notifications')}
        />
        <div className="no-product-container">
          <h2 className="no-product-title">상품을 찾을 수 없습니다</h2>
          <p className="no-product-message">요청하신 상품 정보가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }
  
  const broadcastStatus = getBroadcastStatus();
  
  return (
    <div className="homeshopping-product-detail-page">
      {/* 헤더 */}
      <HeaderNavSchedule 
        onBackClick={() => navigate(-1)}
        onSearchClick={(searchTerm) => navigate('/homeshopping/search?type=homeshopping')}
        onNotificationClick={() => navigate('/notifications')}
      />
      
             <div className="product-detail-container" id="homeshopping-product-detail-container">
                {/* 상품 이미지 섹션 */}
        <div className="product-image-section">
                              {/* 독립적인 방송 정보 섹션 */}
          <div className="hsproduct-broadcast-info-section">
            {/* 제품 정보 그룹 */}
            <div className="hsproduct-product-info-group">
                             {/* 브랜드 로고 */}
               <div className="hsproduct-brand-logo">
                 <img 
                   src={getLogoByHomeshoppingId(productDetail.homeshopping_id)?.logo || ''} 
                   alt={productDetail.homeshopping_name || '홈쇼핑'}
                   className="hsproduct-homeshopping-logo"
                 />
               </div>
               
               {/* 홈쇼핑 이름
               <div className="hsproduct-homeshopping-name">
                 {productDetail.homeshopping_name || getChannelInfoByHomeshoppingId(productDetail.homeshopping_id)?.name || '홈쇼핑'}
               </div> */}
               
               {/* 채널 번호 */}
               <div className="hsproduct-channel-number">
                 [채널 {getChannelInfoByHomeshoppingId(productDetail.homeshopping_id)?.channel || 'N/A'}]
               </div>
              
              {/* 방송 날짜 */}
              <div className="hsproduct-broadcast-date">
                {productDetail.live_date && (() => {
                  const date = new Date(productDetail.live_date);
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                  const weekday = weekdays[date.getDay()];
                  return `${month}/${day} ${weekday}`;
                })()}
              </div>
              
              {/* 방송 시간 */}
              <div className="hsproduct-broadcast-time">
                {productDetail.live_start_time && productDetail.live_end_time && 
                  `${productDetail.live_start_time.slice(0, 5)} ~ ${productDetail.live_end_time.slice(0, 5)}`
                }
              </div>
            </div>
            
                                                       {/* 찜 버튼 (별도 그룹) */}
              <div className="hsproduct-heart-button-group">
                <button 
                  className="hsproduct-heart-button"
                  data-product-id={live_id} // live_id 사용
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHeartToggle(live_id); // live_id 사용
                  }}
                >
                  <img 
                    src={(() => {
                      const isLiked = wishlistedProducts.has(String(live_id));
                      console.log('🔍 하트 아이콘 표시 - live_id:', live_id, typeof live_id);
                      console.log('🔍 하트 아이콘 표시 - wishlistedProducts:', wishlistedProducts);
                      console.log('🔍 하트 아이콘 표시 - isLiked:', isLiked);
                      console.log('🔍 하트 아이콘 표시 - filledHeartIcon:', filledHeartIcon);
                      console.log('🔍 하트 아이콘 표시 - emptyHeartIcon:', emptyHeartIcon);
                      return isLiked ? filledHeartIcon : emptyHeartIcon;
                    })()}
                    alt="찜 토글" 
                    className="hsproduct-heart-icon"
                  />
                </button>
              </div>
          </div>
          
                                                                                                                                   <div className="image-container">
               {(() => {
                 // 이미지 URL 검증 및 수정
                 let imageUrl = productDetail.thumb_img_url;
                 
                                   // 실제 문제가 되는 URL 패턴만 차단 (정상적인 외부 이미지는 허용)
                  if (imageUrl && (
                    // 실제 문제가 되는 패턴들만 차단
                    imageUrl.includes('product/1') ||
                    imageUrl.includes('/product/1') ||
                    imageUrl.includes('product/1/') ||
                    imageUrl.includes('product/1 ') ||
                    imageUrl.includes(' product/1') ||
                    
                    // homeshopping/product/1 관련 패턴
                    imageUrl.includes('homeshopping/product/1') ||
                    imageUrl.includes('/homeshopping/product/1') ||
                    imageUrl.includes('homeshopping/product/1/') ||
                    
                    // 실제 문제가 되는 도메인만 차단
                    imageUrl.includes('webapp.uhok.com:3001/homeshopping/product/1') ||
                    imageUrl.includes('webapp.uhok.com:3001/product/1') ||
                    imageUrl.includes('webapp.uhok.com:3001') ||
                    
                    // 잘못된 로컬 URL
                    imageUrl.includes('localhost:3001') ||
                    imageUrl.includes('127.0.0.1:3001')
                  )) {
                    imageUrl = null; // 문제가 되는 URL만 무시
                  }
                 
                 // 최종 검증: imageUrl이 유효한지 확인
                 if (imageUrl && (imageUrl.trim() === '' || imageUrl === 'null' || imageUrl === 'undefined')) {
                   imageUrl = null;
                 }
                 
                                   return imageUrl ? (
                   <div className="product-image-wrapper">
                     {isCurrentlyLive() ? (
                       // 방송 중일 때: 라이브 스트림 플레이어 표시
                       <LiveStreamPlayer
                         src={window.__LIVE_SRC__ || streamData?.stream_url}
                         autoPlay={true}
                         muted={true}
                         controls={true}
                         width="100%"
                         height="100%"
                         style={{
                           width: '100%',
                           height: '100%',
                           objectFit: 'cover'
                         }}
                         onError={(error) => {
                           // 에러 시 썸네일로 폴백
                           const videoContainer = document.querySelector('.product-image-wrapper');
                           if (videoContainer) {
                             videoContainer.innerHTML = `
                               <div style="
                                 width: 100%;
                                 height: 100%;
                                 background: rgba(0,0,0,0.7);
                                 display: flex;
                                 align-items: center;
                                 justify-content: center;
                                 color: white;
                                 font-size: 14px;
                               ">
                                 <div>라이브 스트림을 불러올 수 없습니다</div>
                               </div>
                             `;
                           }
                         }}
                       />
                     ) : (
                       // 방송 예정/종료일 때: 상품 이미지와 방송 상태 표시
                       <>
                         <img 
                           src={imageUrl} 
                           alt={productDetail.product_name}
                           className="hsproduct-product-image"
                           onError={(e) => {
                             e.target.style.display = 'none'; // 이미지 숨기기
                             // 이미지 로드 실패 시 placeholder 표시
                             const placeholder = e.target.parentNode.querySelector('.image-error-placeholder');
                             if (placeholder) {
                               placeholder.style.display = 'block';
                             }
                           }}
                         />
                         {/* 이미지 로드 실패 시 표시할 placeholder */}
                         <div className="image-error-placeholder" style={{ display: 'none' }}>
                           <span>이미지 로드 실패</span>
                         </div>
                         {/* 방송 상태 텍스트 오버레이 */}
                         {broadcastStatus && (
                           <div className="center-broadcast-status">
                             <span className="center-status-text">{broadcastStatus.text}</span>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                ) : (
                  <div className="no-image-placeholder">
                    <span>이미지 없음</span>
                  </div>
                );
              })()}
            </div>
          
                     {/* 방송 상태에 따른 UI 분기 */}
           {/* {broadcastStatus?.status === 'live' ? (
             // 방송 중일 때: 라이브 영상 표시
             <div className="live-stream-section">
               <h3 className="live-stream-title">🔴 라이브 방송</h3>
               {(streamData?.stream_url || window.__LIVE_SRC__) ? (
                 <div className="video-player-container">
                   <LiveStreamPlayer
                     src={window.__LIVE_SRC__ || streamData?.stream_url}
                     autoPlay={true}
                     muted={true}
                     controls={true}
                     width="100%"
                     height="300"
                     style={{
                       borderRadius: '12px',
                       backgroundColor: '#000'
                     }}
                     onError={(error) => {
                       console.error('스트림 로드 실패:', error);
                     }}
                     onLoadStart={() => {
                       console.log('라이브 스트림 로딩 시작');
                     }}
                     onLoadedData={() => {
                       console.log('라이브 스트림 로딩 완료');
                     }}
                   />
                 </div>
               ) : (
                 <div className="no-stream-container" style={{ 
                   backgroundColor: '#f8f9fa', 
                   border: '2px dashed #dee2e6',
                   borderRadius: '12px',
                   padding: '40px',
                   textAlign: 'center',
                   color: '#6c757d'
                 }}>
                   <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
                   <div style={{ fontSize: '18px', marginBottom: '8px' }}>스트림을 불러올 수 없습니다</div>
                   <div style={{ fontSize: '14px' }}>스트림 URL이 설정되지 않았습니다</div>
                 </div>
               )}
             </div>
           ) : (
             // 방송 예정/종료일 때: 상태 메시지만 표시
             broadcastStatus && (
               <div className="live-stream-section">
                 <h3 className="live-stream-title">📺 방송 정보</h3>
                 <div className="broadcast-status-container" style={{ 
                   backgroundColor: '#f8f9fa', 
                   border: '2px dashed #dee2e6',
                   borderRadius: '12px',
                   padding: '40px',
                   textAlign: 'center',
                   color: '#6c757d'
                 }}>
                   <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                     {broadcastStatus.status === 'upcoming' ? '⏰' : '📺'}
                   </div>
                   <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                     {broadcastStatus.status === 'upcoming' ? '방송 예정' : '방송 종료'}
                   </div>
                   <div style={{ fontSize: '14px' }}>
                     {broadcastStatus.status === 'upcoming' 
                       ? '방송 시작 시간을 기다려주세요' 
                       : '방송이 종료되었습니다'
                     }
                   </div>
                 </div>
               </div>
             )
           )} */}
        </div>
        
                  {/* 상품 기본 정보 */}
         <div className="product-basic-info">
                       <div className="product-header">
              <span className="hsproduct-store-name">[{productDetail.homeshopping_name}]</span>
              <h1 className="hsproduct-product-name">{productDetail.product_name}</h1>
            </div>
          
                     {/* 가격 정보 */}
           <div className="hsproduct-price-section">
             {(() => {
               const dcRate = Number(productDetail.dc_rate);
               const salePrice = Number(productDetail.sale_price);
               const dcPrice = Number(productDetail.dc_price);
               
               // 할인율이 0이거나 null이거나, 할인가와 정가가 같으면 할인 없음으로 표시
               if (dcRate > 0 && dcPrice > 0 && dcPrice !== salePrice) {
                 return (
                   <>
                     {/* 정가 (첫번째 줄) */}
                     <div className="hsproduct-original-price">
                       <span className="hsproduct-original-price-text">
                         {salePrice.toLocaleString()}원
                       </span>
                     </div>
                     {/* 할인율과 할인가격 (두번째 줄) */}
                     <div className="hsproduct-discount-info">
                       <span className="hsproduct-discount-rate">
                         {dcRate}%
                       </span>
                       <span className="hsproduct-discounted-price">
                         {dcPrice.toLocaleString()}원
                       </span>
                     </div>
                   </>
                 );
               } else {
                 return (
                   <>
                     {/* 할인 없는 경우 - 할인가격만 표시 */}
                     <div className="hsproduct-discount-info">
                       <span className="hsproduct-discounted-price">{salePrice.toLocaleString()}원</span>
                     </div>
                   </>
                 );
               }
             })()}
           </div>
                 </div>
         
         {/* 콕 상품 추천 섹션 - 가격 정보 바로 아래에 위치 */}
         <HomeshoppingKokRecommendation 
           kokRecommendations={kokRecommendations}
           onKokProductClick={handleKokProductClick}
         />
         
                                       {/* 레시피 추천 섹션 - 콕 상품 추천 아래에 위치 */}
           {productDetail?.is_ingredient && (
             <div 
               className="hs-recom-recipe-recommendation-section"
               onClick={checkRecipeAvailability}
               style={{ cursor: 'pointer' }}
             >
               <div className="hs-recom-recipe-section-content">
                 <div className="hs-recom-recipe-kokrecom-toggle-section">
                   <div className="hs-recom-recipe-section-text">
                     
                     <span>보고 있는 상품으로 만들 수 있는 <b style={{ color: '#FA5F8C' }}>레시피</b>를 추천드려요!</span>
                   </div>
                   <div className="hs-recom-recipe-section-arrow">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M9 18L15 12L9 6" stroke="#838383" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                   </div>
                 </div>
                 
               </div>
             </div>
           )}
         
                                   {/* 탭 네비게이션 */}
         <div className="tab-navigation">
           <button
             className={`tab-button ${activeTab === 'detail' ? 'active' : ''}`}
             onClick={() => setActiveTab('detail')}
           >
             상품정보
           </button>
           <button
             className={`tab-button ${activeTab === 'seller' ? 'active' : ''}`}
             onClick={() => setActiveTab('seller')}
           >
             상세정보
           </button>
         </div>
          
          {/* 탭 콘텐츠 */}
          <div className="tab-content">
                        {/* 상품 상세 탭 */}
             {activeTab === 'detail' && (
               <div className="detail-tab">
                 {/* 상품 상세 이미지들 */}
                 {productImages && productImages.length > 0 && productImages.some(img => img.img_url) && (
                   <div className="product-detail-images-section">
                     <h3 className="section-title">상품 상세 이미지</h3>
                     <div className="detail-images-container">
                       {productImages
                         .filter(image => image.img_url && image.img_url !== null && image.img_url.trim() !== '')
                         .map((image, index) => (
                         <div key={index} className="detail-image-item">
                           <img 
                             src={image.img_url} 
                             alt={`상품 상세 이미지 ${index + 1}`}
                             className="detail-image"
                             onClick={() => window.open(image.img_url, '_blank')}
                             onError={(e) => {
                               e.target.alt = '이미지 로드 실패';
                               console.log('❌ 이미지 로드 실패:', image.img_url);
                             }}
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                                                    {/* 상세 정보나 이미지가 없는 경우 */}
                   {(!detailInfos || detailInfos.length === 0) && 
                    (!productImages || productImages.length === 0 || !productImages.some(img => img.img_url)) && (
                     <div className="no-detail-content">
                       <div className="no-detail-icon">📋</div>
                       <p className="no-detail-text">상품 상세 정보가 없습니다</p>
                     </div>
                   )}
                   
                   {/* 스크롤을 위한 여백 추가 */}
                   <div style={{ height: '150px' }}></div>
                </div>
             )}
            
                        {/* 상세정보 탭 */}
             {activeTab === 'seller' && (
               <div className="seller-tab">
                 {/* 상품 상세 정보 */}
                 {detailInfos && detailInfos.length > 0 && (
                   <div className="product-detail-info-section">
                     <h3 className="section-title">상품 상세 정보</h3>
                     <div className="detail-info-container">
                       {detailInfos.map((info, index) => (
                         <div key={index} className="detail-info-row">
                           <span className="detail-info-label">{info.detail_col}</span>
                           <span className="detail-info-value">{info.detail_val}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 

               </div>
             )}
                    </div>
        </div>
       
              <BottomNav />
       
       {/* 맨 위로 가기 버튼 */}
       <div style={{ position: 'relative' }}>
         <UpBtn />
       </div>
       
               {/* 모달 관리자 */}
        <ModalManager
          {...modalState}
          onClose={closeModal}
        />
        
        {/* VideoPopUp */}
        <VideoPopUp
          videoUrl={videoPopupData.videoUrl}
          productName={videoPopupData.productName}
          homeshoppingName={videoPopupData.homeshoppingName}
          kokProductId={videoPopupData.kokProductId}
          isVisible={showVideoPopup}
          onClose={() => setShowVideoPopup(false)}
        />
        
        {/* 홈쇼핑 주문 모달 */}
        {showHomeshoppingOrderModal && (
          <div className="homeshopping-order-modal-overlay" onClick={closeHomeshoppingOrderModal}>
            <div className="homeshopping-order-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* 전화 주문 옵션 */}
              <div className="order-option" onClick={handlePhoneOrder}>
                <div className="order-option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59531 1.99522 8.06679 2.16708 8.43376 2.48353C8.80073 2.79999 9.04207 3.23945 9.11999 3.72C9.23662 4.68007 9.47144 5.62273 9.81999 6.53C9.94454 6.88792 9.97366 7.27691 9.90401 7.65088C9.83436 8.02485 9.66818 8.36811 9.42499 8.64L8.08999 9.97C9.51355 12.4584 11.5416 14.4864 14.03 15.91L15.36 14.58C15.6319 14.3368 15.9751 14.1706 16.3491 14.101C16.7231 14.0313 17.1121 14.0604 17.47 14.185C18.3773 14.5336 19.3199 14.7684 20.28 14.885C20.7658 14.9636 21.2094 15.2071 21.5265 15.5775C21.8437 15.9479 22.0122 16.4206 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="order-option-text">전화 주문</div>
                <div className="order-option-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {/* 모바일 주문 옵션 */}
              <div className="order-option" onClick={handleMobileOrder}>
                <div className="order-option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="order-option-text">모바일 주문</div>
                <div className="order-option-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {/* 닫기 버튼 */}
              <button className="order-modal-close-btn" onClick={closeHomeshoppingOrderModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* 커스텀 모달 관리자 */}
        <ModalManager
          {...modalState}
          onClose={closeModal}
        />
    </div>
  );
};

export default HomeShoppingProductDetail;
