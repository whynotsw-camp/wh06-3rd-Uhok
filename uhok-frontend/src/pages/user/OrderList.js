// React와 필요한 훅들을 가져옵니다
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// 상단 네비게이션 컴포넌트를 가져옵니다
import HeaderNavOrder from '../../layout/HeaderNavOrder';
// 하단 네비게이션 컴포넌트를 가져옵니다
import BottomNav from '../../layout/BottomNav';
// 로딩 컴포넌트를 가져옵니다
import Loading from '../../components/Loading';
// 주문 내역 스타일을 가져옵니다
import '../../styles/orderlist.css';
// 상품 없음 이미지를 가져옵니다
import noItemsIcon from '../../assets/no_items.png';
// LoadingModal import
import ModalManager, { 
  showLoginRequiredNotification, 
  hideModal 
} from '../../components/LoadingModal';

// orderApi import
import { orderApi } from '../../api/orderApi';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';
// 토큰 테스트 유틸리티 import (개발 환경에서만)
import { tokenTestUtils } from '../../utils/tokenTestUtils';


// 주문 내역 페이지 메인 컴포넌트를 정의합니다
const OrderList = () => {
  // 페이지 이동을 위한 navigate 훅
  const navigate = useNavigate();
  // 사용자 정보 가져오기
  const { user, isLoggedIn, refreshToken, logout, isLoading: userContextLoading } = useUser();
  
  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ 
    isVisible: false,
    modalType: null,
    alertMessage: '',
    alertButtonText: '확인',
    alertButtonStyle: 'primary'
  });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    
    // 인증 관련 모달인 경우 로그인 페이지로 이동
    if (modalState.modalType === 'alert' && 
        (modalState.alertMessage?.includes('세션이 만료되었습니다') || 
         modalState.alertMessage?.includes('인증이 만료되었습니다') ||
         modalState.alertMessage?.includes('로그인이 만료되었습니다'))) {
      logout(); // UserContext 상태 정리
      navigate('/login'); // 로그인 페이지로 이동
    } else {
      // 일반 모달인 경우 이전 페이지로 돌아가기
      window.history.back();
    }
  };
  
  // 주문 내역 데이터를 저장할 상태를 초기화합니다 (API에서 받아옴)
  const [orderData, setOrderData] = useState({
    orders: [], // 주문 목록 (API에서 받아옴)
    total_count: 0, // 전체 주문 개수
    page: 1, // 현재 페이지
    size: 10 // 페이지당 주문 개수
  });



  // 데이터 로딩 상태를 관리합니다 (true: 로딩 중, false: 로딩 완료)
  const [loading, setLoading] = useState(true);
  // 에러 상태를 관리합니다 (null: 에러 없음, string: 에러 메시지)
  const [error, setError] = useState(null);
  // 토큰 갱신 상태를 관리합니다
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // 가격을 원화 형식으로 포맷팅하는 함수를 정의합니다
  const formatPrice = (price) => {
    return price.toLocaleString('ko-KR') + '원';
  };



  // 날짜를 YYYY-MM-DD 형식으로 포맷팅하는 함수를 정의합니다
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // 토큰 상태 디버깅 함수
  const debugTokenStatus = () => {
    if (process.env.NODE_ENV === 'development') {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      // console.log('🔍 토큰 상태 디버깅:', {
      //   hasAccessToken: !!token,
      //   accessTokenLength: token?.length || 0,
      //   hasRefreshToken: !!refreshToken,
      //   refreshTokenLength: refreshToken?.length || 0,
      //   userContextLoading,
      //   isLoggedIn,
      //   hasUser: !!user,
      //   currentPath: window.location.pathname
      // });
      
      if (token) {
        tokenTestUtils.logTokenInfo(token);
      }
    }
  };

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    // console.log('🔍 로그인 상태 확인:', { 
    //   userContextLoading,
    //   isLoggedIn,
    //   hasUser: !!user,
    //   userToken: !!user?.token,
    //   localStorageToken: !!token,
    //   localStorageRefreshToken: !!refreshToken,
    //   tokenLength: token?.length,
    //   refreshTokenLength: refreshToken?.length
    // });
    
    // UserContext가 로딩 중이면 false 반환
    if (userContextLoading) {
      console.log('⏳ UserContext 로딩 중 - 로그인 상태 확인 대기');
      return false;
    }
    
    // UserContext 로딩이 완료되었으면 isLoggedIn 상태를 그대로 사용
    console.log('✅ UserContext 로딩 완료, isLoggedIn:', isLoggedIn);
    return isLoggedIn;
  };

  // 주문 내역 데이터를 가져오는 함수
  const loadOrderData = useCallback(async () => {
    // UserContext가 로딩 중인 경우 대기
    if (userContextLoading) {
      console.log('UserContext 로딩 중 - loadOrderData 중단');
      return;
    }
    
    // 로그인하지 않은 경우 모달 표시 후 로그인 페이지로 이동
    if (!checkLoginStatus()) {
      console.log('❌ 로그인하지 않은 상태 - 로그인 모달 표시');
      setModalState({
        isVisible: true,
        modalType: 'alert',
        alertMessage: '로그인이 필요한 서비스입니다.',
        alertButtonText: '로그인',
        alertButtonStyle: 'primary'
      });
      setLoading(false);
      return;
    }

    // 개발 환경에서 토큰 정보 로깅
    if (process.env.NODE_ENV === 'development') {
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔍 주문내역 로드 시 토큰 정보:');
        tokenTestUtils.logTokenInfo(token);
      }
    }

    try {
      setLoading(true);
      setError(null);

      // 토큰 상태 확인 (디버깅용)
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('🔍 OrderList.js - API 호출 전 토큰 상태:', {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
        currentPath: window.location.pathname
      });

      // orderApi를 활용하여 주문 내역 목록을 비동기로 조회합니다
      let ordersData;
      
      try {
        console.log('🚀 API 호출 시작 - getUserOrders(30)');
        // 새로운 API 구조: 사용자의 모든 주문 목록 조회
        const ordersResponse = await orderApi.getUserOrders(30);
        ordersData = ordersResponse;
        // console.log('사용자 주문 목록 API 응답:', ordersData);
        // console.log('🔍 OrderList.js - API 응답 상세:', {
        //   responseType: typeof ordersData,
        //   responseKeys: ordersData ? Object.keys(ordersData) : 'response is null/undefined',
        //   hasOrderGroups: ordersData?.order_groups ? true : false,
        //   orderGroupsLength: ordersData?.order_groups?.length || 0,
        //   totalCount: ordersData?.total_count,
        //   limit: ordersData?.limit
        // });
      } catch (error) {
        console.error('주문 내역 API 호출 실패:', error);
        console.log('에러 상세 정보:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code
        });
        
        // 401 에러인 경우 토큰 갱신 시도
        if (error.response?.status === 401) {
          console.log('401 에러 발생 - 서버에서 토큰을 유효하지 않다고 판단. 토큰 갱신 시도');
          
          // 토큰 갱신 시도
          setIsRefreshingToken(true);
          try {
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              console.log('✅ 토큰 갱신 성공. 주문 내역 다시 로드 시도');
                          // 토큰 갱신 성공 시 다시 API 호출
            try {
              const ordersResponse = await orderApi.getUserOrders(30);
              ordersData = ordersResponse;
              console.log('✅ 토큰 갱신 후 주문 내역 로드 성공');
              } catch (retryError) {
                console.error('토큰 갱신 후 재시도 실패:', retryError);
                // 재시도 실패 시 로그인 모달 표시
                setModalState({
                  isVisible: true,
                  modalType: 'alert',
                  alertMessage: '인증이 필요합니다. 다시 로그인해주세요.',
                  alertButtonText: '로그인',
                  alertButtonStyle: 'primary'
                });
                setLoading(false);
                return;
              }
            } else {
              console.log('❌ 토큰 갱신 실패. UserContext 상태 업데이트');
              
              // UserContext의 logout 함수를 호출하여 상태를 정리
              logout();
              
              // 로그인 모달 표시
              setModalState({
                isVisible: true,
                modalType: 'alert',
                alertMessage: '인증이 필요합니다. 다시 로그인해주세요.',
                alertButtonText: '로그인',
                alertButtonStyle: 'primary'
              });
              setLoading(false);
              return;
            }
          } finally {
            setIsRefreshingToken(false);
          }
        }
        
        // API 실패 시 빈 데이터로 설정
        if (!ordersData) {
          ordersData = {
            limit: 10,
            total_count: 0,
            order_groups: []
          };
        }
      }
      
      // API 응답 구조 확인
      // console.log('🔍 API 응답 구조 확인:', {
      //   hasOrdersData: !!ordersData,
      //   hasOrderGroups: !!ordersData?.order_groups,
      //   orderGroupsType: typeof ordersData?.order_groups,
      //   orderGroupsLength: ordersData?.order_groups?.length,
      //   totalCount: ordersData?.total_count,
      //   limit: ordersData?.limit
      // });
      
      if (!ordersData || !ordersData.order_groups || !Array.isArray(ordersData.order_groups) || ordersData.order_groups.length === 0) {
        // 주문이 없는 경우 빈 배열로 설정
        console.log('📭 주문 데이터가 없음 - 빈 상태로 설정');
        setOrderData({
          orders: [],
          total_count: 0,
          page: 1,
          size: 10
        });
        setLoading(false);
        return;
      }
      
      // 새로운 API 응답 구조를 프론트엔드 형식으로 안전하게 변환
      const transformedOrders = ordersData.order_groups.map((orderGroup) => {
        // orderGroup이 유효한지 확인
        if (!orderGroup || typeof orderGroup !== 'object') {
          console.warn('유효하지 않은 orderGroup:', orderGroup);
          return null;
        }
        
        // items가 유효한지 확인
        const items = Array.isArray(orderGroup.items) ? orderGroup.items : [];
        
        return {
          order_id: orderGroup.order_id || `unknown_${Date.now()}`,
          order_number: orderGroup.order_number || '주문번호 없음',
          order_date: orderGroup.order_date || new Date().toISOString(),
          status: 'delivered',
          total_amount: orderGroup.total_amount || 0,
          item_count: orderGroup.item_count || items.length,
          items: items.map((item, index) => {
            if (!item || typeof item !== 'object') {
              console.warn('유효하지 않은 item:', item);
              return null;
            }
            
            return {
              product_name: item.product_name || '상품명 없음',
              product_image: item.product_image || '',
              price: item.price || 0,
              quantity: item.quantity || 1,
              delivery_status: item.delivery_status || '배송완료',
              delivery_date: item.delivery_date || ''
            };
          }).filter(Boolean) // null 값 제거
        };
      }).filter(Boolean); // null 값 제거
      
      // 변환된 주문이 없는 경우 처리
      if (transformedOrders.length === 0) {
        console.log('변환된 주문이 없습니다.');
        setOrderData({
          orders: [],
          total_count: 0,
          page: 1,
          size: 10
        });
        setLoading(false);
        return;
      }
      
      // 파싱된 데이터를 상태에 저장합니다
      setOrderData({
        orders: transformedOrders,
        total_count: ordersData.total_count || 0,
        page: 1,
        size: 10
      });
      
      // 로딩 상태를 false로 설정합니다
      setLoading(false);
      
    } catch (error) {
      // 에러 발생 시 에러 상태를 설정하고 로딩 상태를 false로 설정합니다
      console.error('주문 내역 데이터 가져오기 실패:', error);
      
      // 401 에러 특별 처리 (인증 필요)
      if (error.response?.status === 401) {
        console.log('401 에러 발생 - 토큰이 유효하지 않거나 만료되었습니다. 토큰 갱신 시도');
        
        // 토큰 갱신 시도
        setIsRefreshingToken(true);
        try {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            console.log('✅ 토큰 갱신 성공. 주문 내역 다시 로드 시도');
            // 토큰 갱신 성공 시 다시 loadOrderData 호출
            loadOrderData();
            return;
          } else {
            console.log('❌ 토큰 갱신 실패. 빈 데이터로 설정');
            // 401 에러 시 빈 데이터로 설정 (로그인 모달 표시하지 않음)
            setError(null); // 에러 상태 초기화
            setOrderData({
              orders: [],
              total_count: 0,
              page: 1,
              size: 10
            });
            setLoading(false);
            return;
          }
        } finally {
          setIsRefreshingToken(false);
        }
      }
      
      // 422 에러 특별 처리
      else if (error.response?.status === 422) {
        console.log('422 에러 발생 - API 엔드포인트나 파라미터 문제일 수 있습니다.');
        setError(null);
      }
      // 네트워크 에러인 경우 빈 데이터 사용, 그 외에는 에러 메시지 표시
      else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || 
          (error.name === 'TypeError' && error.message.includes('Failed to fetch')) ||
          error.message.includes('Network Error')) {
        console.log('백엔드 서버 연결 실패 - 빈 데이터로 설정합니다.');
        setError(null);
      } else {
        setError(error.message);
      }
      
      setLoading(false);
      
      // API 연결 실패 시 빈 데이터로 설정 (토큰은 유지)
      console.log('API 연결 실패 - 빈 데이터로 설정합니다.');
      setOrderData({
        orders: [],
        total_count: 0,
        page: 1,
        size: 10
      });
    }
  }, [userContextLoading, refreshToken, navigate, setModalState, setLoading, setError, setOrderData, logout]);

  // useEffect 추가
  useEffect(() => {
    console.log('OrderList useEffect 실행:', { userContextLoading, isLoggedIn });
    
    // 토큰 상태 디버깅
    debugTokenStatus();
    
    // UserContext 로딩이 완료될 때까지 대기
    if (userContextLoading) {
      console.log('UserContext 로딩 중 - 대기');
      return;
    }
    
    // 로그인 상태 확인 후 조건부로 API 호출
    const loginStatus = checkLoginStatus();
    console.log('로그인 상태 확인 결과:', loginStatus);
    
    if (loginStatus) {
      console.log('로그인 상태 확인됨 - 주문 내역 로드 시작');
      loadOrderData();
    } else {
      // 로그인하지 않은 경우 로딩 상태만 해제
      console.log('로그인하지 않은 상태: 주문 내역 API 호출 건너뜀');
      setLoading(false);
    }
  }, [userContextLoading, isLoggedIn]); // loadOrderData 의존성 제거하여 중복 호출 방지

  // 뒤로가기 핸들러를 정의합니다
  const handleBack = () => {
    window.history.back();
  };



  // 주문 상세 보기 핸들러를 정의합니다 (kok_order_id 사용)
  const handleOrderDetailClick = async (orderId, kokOrderId = null) => {
    try {
      console.log('주문 상세 보기:', { orderId, kokOrderId });
      
      // kok_order_id가 있는 경우 해당 ID로 상세 조회, 없으면 order_id 사용
      const targetId = kokOrderId || orderId;
      console.log('사용할 ID:', targetId);
      
      // orderApi를 활용하여 주문 상세 정보를 비동기로 가져옵니다
      const orderDetail = await orderApi.getOrderDetail(targetId);
      console.log('주문 상세 정보:', orderDetail);
      // 주문 상세 페이지로 이동하는 기능을 구현할 예정입니다
      // window.location.href = `/order-detail/${targetId}`;
    } catch (error) {
      // 네트워크 에러인 경우 조용히 처리
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || 
          (error.name === 'TypeError' && error.message.includes('Failed to fetch')) ||
          error.message.includes('Network Error')) {
        console.log('주문 상세 API 연결 실패 - 기능 미구현');
      } else {
        console.error('주문 상세 보기 에러:', error);
      }
    }
  };

  // 로딩 중일 때 표시할 컴포넌트를 정의합니다
  if (loading) {
    const loadingMessage = isRefreshingToken 
      ? "인증을 갱신하는 중 ..." 
      : "주문 내역을 불러오는 중 ...";
    
    return (
      <div className="order-list-container">
        {/* 주문 내역 헤더 네비게이션 */}
        <HeaderNavOrder 
          onBackClick={handleBack}
        />
        <Loading message={loadingMessage} />
        <BottomNav />
      </div>
    );
  }

  // 에러가 발생했을 때 표시할 컴포넌트를 정의합니다
  if (error) {
    return (
      <div className="order-list-container">
        {/* 주문 내역 헤더 네비게이션 */}
        <HeaderNavOrder 
          onBackClick={handleBack}
        />
        <div className="error-container">
          <p className="error-message">주문 내역을 불러오는데 실패했습니다.</p>
          <p className="error-details">{error}</p>
          <button 
            className="retry-button" 
            onClick={() => {
              setError(null);
              setLoading(true);
              loadOrderData();
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 주문 내역 페이지 JSX 반환
  return (
    <div className="order-list-page order-list-container">
      {/* 주문 내역 헤더 네비게이션 */}
      <HeaderNavOrder 
        onBackClick={handleBack}
      />
      
      {/* 주문 내역 메인 콘텐츠 */}
      <main className="order-list-main">
        {/* 디버깅용 로그 */}
        {console.log('OrderList 렌더링 - orderData 상태:', orderData)}
        {/* 주문 내역 목록 */}
        <div className="order-list-content">
          {!orderData.orders || orderData.orders.length === 0 ? (
            // 주문 내역이 없을 때 표시할 컴포넌트
            <div className="no-orders-container">
              <img src={noItemsIcon} alt="주문한 상품 없음" className="no-orders-icon" />
              <p className="no-orders-text">주문한 상품이 없습니다.</p>
              <p className="no-orders-subtext">첫 주문을 시작해보세요!</p>
            </div>
          ) : (
            // 주문번호별로 그룹화하여 렌더링합니다
            (orderData.orders || [])
              .filter(order => order && order.items && Array.isArray(order.items) && order.items.length > 0) // 유효한 주문만 필터링
              .sort((a, b) => {
                // 전체 주문 그룹을 날짜순으로 정렬 (최근 날짜순)
                const dateA = new Date(a.order_date);
                const dateB = new Date(b.order_date);
                
                // 날짜가 같다면 주문번호로 정렬 (최근 주문번호가 먼저)
                if (dateA.getTime() === dateB.getTime()) {
                  return b.order_id - a.order_id;
                }
                
                return dateB - dateA; // 최근 날짜가 먼저 오도록 내림차순 정렬
              })
              .map((order) => {
                return (
                  <div key={order.order_id || `unknown_${Date.now()}`} className="orderlist-order-item">
                    {/* 주문 정보 헤더 */}
                    <div className="orderlist-order-header">
                      {/* 주문 날짜와 주문번호를 한 줄로 표시합니다 */}
                      <div className="orderlist-order-info-container">
                        <span className="orderlist-order-date">{formatDate(order.order_date)}</span>
                        <span className="orderlist-order-number">주문번호 {order.order_number || '주문번호 없음'}</span>
                      </div>
                    </div>
                    
                    {/* 배송 상태 카드 */}
                    <div className="orderlist-delivery-status-card">
                      {/* 배송 상태를 표시합니다 */}
                      <div className="orderlist-delivery-status">
                        {(() => {
                          const firstItem = order.items && order.items[0];
                          const deliveryStatus = firstItem?.delivery_status || '배송완료';
                          const deliveryDate = firstItem?.delivery_date || `${formatDate(order.order_date)} 도착`;
                          
                          // 디버깅: 렌더링 시 delivery_status 확인
                          console.log('🔍 OrderList - 렌더링 시 delivery_status:', {
                            order_id: order.order_id,
                            order_number: order.order_number,
                            firstItem: firstItem,
                            deliveryStatus: deliveryStatus,
                            deliveryDate: deliveryDate
                          });
                          
                          return (
                            <>
                              <span className="orderlist-delivery-status-text">{deliveryStatus}</span>
                              <span className="orderlist-delivery-date">{deliveryDate}</span>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* 상품 정보들 - 같은 주문번호의 모든 상품을 표시합니다 */}
                      {(order.items || [])
                        .filter(item => item && item.product_name) // 유효한 상품만 필터링
                        .map((item, index) => (
                        <div 
                          key={`${order.order_id || 'unknown'}-${index}`} 
                          className="orderlist-product-info"
                          onClick={() => handleOrderDetailClick(order.order_id || 'unknown')}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* 상품 이미지를 표시합니다 */}
                          <div className="orderlist-product-image">
                            <img src={item.product_image || ''} alt={item.product_name || '상품 이미지'} />
                          </div>
                          
                          {/* 상품 상세 정보 */}
                          <div className="orderlist-product-details">
                            {/* 상품명을 표시합니다 */}
                            <div className="orderlist-product-name" title={item.product_name || '상품명 없음'}>
                              {(() => {
                                const productName = item.product_name || '상품명 없음';
                                const displayName = productName.length > 50 
                                  ? `${productName.substring(0, 50)}...`
                                  : productName;
                                
                                // 대괄호 안의 텍스트를 찾아서 볼드 처리
                                const parts = displayName.split(/(\[[^\]]+\])/);
                                
                                return parts.map((part, index) => {
                                  if (part.startsWith('[') && part.endsWith(']')) {
                                    return <span key={index} className="bracket-bold">{part}</span>;
                                  }
                                  return part;
                                });
                              })()}
                            </div>
                            
                            {/* 가격과 수량 정보 */}
                            <div className="orderlist-product-price">
                              {item.price ? `${(item.price || 0).toLocaleString()}원` : '가격 정보 없음'} · {item.quantity || 1}개
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </main>

      {/* 하단 네비게이션 컴포넌트 */}
      <BottomNav />
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
      
      {/* 디버깅용 모달 상태 로그 */}
      {console.log('OrderList - 모달 상태:', modalState)}
    </div>
  );
};

// 주문 내역 페이지 컴포넌트를 내보냅니다
export default OrderList;
