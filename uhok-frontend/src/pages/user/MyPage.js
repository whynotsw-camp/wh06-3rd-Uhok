// React와 필요한 훅들을 가져옵니다
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// 상단 네비게이션 컴포넌트를 가져옵니다
import HeaderNavMypage from '../../layout/HeaderNavMypage';
// 하단 네비게이션 컴포넌트를 가져옵니다
import BottomNav from '../../layout/BottomNav';
// 로딩 컴포넌트를 가져옵니다
import Loading from '../../components/Loading';
// 마이페이지 스타일을 가져옵니다
import '../../styles/mypage.css';
import '../../styles/logout.css';
import '../../styles/mypage-logged-out.css';
// userApi import
import { userApi } from '../../api/userApi';
// orderApi import
import { orderApi } from '../../api/orderApi';
// kokApi import
import { kokApi } from '../../api/kokApi';
// homeShoppingApi import
import { homeShoppingApi } from '../../api/homeShoppingApi';
// cartApi import (레시피 추천용)
import { cartApi } from '../../api/cartApi';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';
// LoadingModal import
import ModalManager, { showLogoutCompleteNotification, showAlert, hideModal } from '../../components/LoadingModal';
// 기본 사용자 아이콘 이미지를 가져옵니다
import userIcon from '../../assets/user_icon.png';
// 상품 없음 이미지를 가져옵니다
import noItemsIcon from '../../assets/no_items.png';

// 테스트용 상품 이미지들을 가져옵니다



// 마이페이지 메인 컴포넌트를 정의합니다
const MyPage = () => {
  // 페이지 이동을 위한 navigate 훅
  const navigate = useNavigate();
  // 사용자 정보 가져오기
  const { user, isLoggedIn, isLoading: userContextLoading, logout, login } = useUser();
  const hasInitialized = useRef(false); // 중복 호출 방지용 ref
  
  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ isVisible: false });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    // 로그아웃 완료 모달인 경우에만 홈페이지로 이동
    if (modalState.modalType === 'alert' && modalState.alertMessage === '로그아웃이 완료되었습니다.') {
      navigate('/');
    }
  };
  
  // 유저 정보를 저장할 상태를 초기화합니다 (API에서 받아옴)
  const [userData, setUserData] = useState({
    user_id: null, // 유저 ID (API에서 받아옴)
    username: '', // 유저 이름 (API에서 받아옴)
    email: '', // 유저 이메일 (API에서 받아옴)
    created_at: '', // 계정 생성일 (API에서 받아옴)
    orderCount: 0, // 주문 내역 개수 (API에서 받아옴)
    recentOrders: [] // 최근 주문 목록 (API에서 받아옴)
  });

  // 레시피 추천 데이터를 저장할 상태를 초기화합니다 (API에서 받아옴)
  const [recipeData, setRecipeData] = useState({
    purchasedRecipe: null, // 구매한 레시피 정보 (API에서 받아옴)
    similarRecipes: [] // 유사한 레시피 목록 (API에서 받아옴)
  });

  // 데이터 로딩 상태를 관리합니다 (true: 로딩 중, false: 로딩 완료)
  const [loading, setLoading] = useState(true);
  // 에러 상태를 관리합니다 (null: 에러 없음, string: 에러 메시지)
  const [error, setError] = useState(null);

  // 가격을 원화 형식으로 포맷팅하는 함수를 정의합니다
  const formatPrice = (price) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  // 상품 정보를 가져오는 함수 (현재 사용하지 않음)
  const fetchProductInfo = async (productId, type) => {
    try {
      if (type === 'kok') {
        const productInfo = await kokApi.getProductInfo(productId);
        return {
          product_name: productInfo.kok_product_name || `콕 상품 ${productId}`,
          product_description: productInfo.kok_product_description || '콕 상품입니다',
          product_image: productInfo.kok_thumbnail || '',
          brand_name: productInfo.kok_store_name || '콕 스토어'
        };
      } else if (type === 'homeshopping') {
        const productInfo = await homeShoppingApi.getProductDetail(productId);
        return {
          product_name: productInfo.product_name || `홈쇼핑 상품 ${productId}`,
          product_description: productInfo.product_description || '홈쇼핑 상품입니다',
          product_image: productInfo.product_image || '',
          brand_name: productInfo.brand_name || '홈쇼핑'
        };
      }
    } catch (error) {
      // 에러 시 기본값 반환
      return {
        product_name: type === 'kok' ? `콕 상품 ${productId}` : `홈쇼핑 상품 ${productId}`,
        product_description: type === 'kok' ? '콕 상품입니다' : '홈쇼핑 상품입니다',
        product_image: '',
        brand_name: type === 'kok' ? '콕 스토어' : '홈쇼핑'
      };
    }
  };

  // 임시 데이터를 설정하는 함수
  const setMockData = () => {
    setUserData({
      user_id: 101,
      username: '홍길동',
      email: 'user@example.com',
      created_at: '2025-08-01T02:24:19.206Z',
      orderCount: 3,
      recentOrders: [
        {
          order_id: 20230701,
          brand_name: "산지명인",
          product_name: "구운계란 30구+핑크솔트 증정",
          product_description: "반숙란 훈제 맥반석 삶은 구운란",
          product_price: 11900,
          product_quantity: 1,
          product_image: '',
          order_date: "2025-07-25"
        },
        {
          order_id: 20230701,
          brand_name: "오리온",
          product_name: "초코파이 12개입",
          product_description: "부드러운 초콜릿과 마시멜로우가 듬뿍",
          product_price: 8500,
          product_quantity: 1,
          product_image: '',
          order_date: "2025-07-25"
        },
        {
          order_id: 20230702,
          brand_name: "농심",
          product_name: "새우깡",
          product_description: "새우깡",
          product_price: 1500,
          product_quantity: 2,
          product_image: '',
          order_date: "2025-07-24"
        }
      ]
    });

    setRecipeData({
      purchasedRecipe: null,
      similarRecipes: []
    });
  };

  // 로그인 상태 확인 - 로그인하지 않은 경우에도 페이지 접근 허용
  useEffect(() => {
    // 로그인하지 않은 경우에도 페이지에 머무름 (이전 화면으로 돌아가지 않음)
  }, []); // 빈 의존성 배열로 변경하여 한 번만 실행



  // 백엔드 API에서 마이페이지 데이터를 가져오는 useEffect를 정의합니다
  useEffect(() => {
    // UserContext 초기화가 완료될 때까지 기다림
    if (userContextLoading) {
      return;
    }
    
    console.log('MyPage - 현재 상태:', { 
      isLoggedIn, 
      userContextLoading, 
      userData: userData.username,
      user: user 
    });
    
    // 로그인되지 않은 경우 로그인하지 않은 상태 UI 표시
    if (!isLoggedIn) {
      console.log('MyPage - 로그인하지 않은 상태, 로그인하지 않은 UI 표시');
      setLoading(false);
      // 로그인하지 않은 상태에서도 기본 데이터 설정
      setUserData({
        user_id: null,
        username: '',
        email: '',
        created_at: '',
        orderCount: 0,
        recentOrders: []
      });
      setRecipeData({
        purchasedRecipe: null,
        similarRecipes: []
      });
      return;
    }
    
    // 이미 초기화되었으면 리턴
    if (hasInitialized.current) {
      return;
    }
    
    // 초기화 플래그 설정
    hasInitialized.current = true;

    // 비동기 함수로 마이페이지 데이터를 가져옵니다
    const fetchMyPageData = async () => {
      try {
        // 로딩 상태를 true로 설정합니다
        setLoading(true);
        setError(null); // 에러 상태 초기화
        
        // 토큰 확인 및 검증
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // 토큰 유효성 검증 (JWT 형식 확인)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
          setLoading(false);
          return;
        }
        
        // 모든 API 호출을 개별적으로 처리하여 하나가 실패해도 다른 것은 계속 진행
        let userData = null;
        let ordersData = { orders: [] };
        let orderCount = 0;
        let recipeData = { purchasedRecipe: null, similarRecipes: [] };
        
        // 사용자 정보 조회 (API 명세서에 맞춘 처리)
        try {
          console.log('🔍 MyPage - 사용자 정보 조회 시작');
          const userResponse = await userApi.getProfile();
          console.log('✅ MyPage - 사용자 정보 조회 성공:', userResponse);
          userData = userResponse;
        } catch (err) {
          console.error('❌ MyPage - 사용자 정보 조회 실패:', err);
          // 401 에러인 경우 로그아웃 처리
          if (err.response?.status === 401) {
            console.warn('사용자 정보 조회 401 에러 발생, 로그아웃 처리합니다.');
            logout();
            navigate('/login');
            return; // 함수 종료
          } else {
            // 다른 에러인 경우 임시 데이터 사용
            userData = {
              user_id: 101,
              username: '테스트 사용자',
              email: 'test@example.com',
              created_at: '2025-01-01T00:00:00.000Z'
            };
          }
        }
        
        // 최근 주문 조회 (실제 API 호출)
        try {
          const recentOrdersResponse = await orderApi.getRecentOrders(7);
          ordersData = recentOrdersResponse;
          
          // 날짜 필터링 로직 추가
          if (ordersData && ordersData.orders && ordersData.orders.length > 0) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            // 시간을 00:00:00으로 설정하여 날짜만 비교
            sevenDaysAgo.setHours(0, 0, 0, 0);
            
            const filteredOrders = ordersData.orders.filter(order => {
              if (order.order_date) {
                const orderDate = new Date(order.order_date);
                // 주문 날짜도 시간을 00:00:00으로 설정
                orderDate.setHours(0, 0, 0, 0);
                return orderDate >= sevenDaysAgo;
              }
              return false;
            });
            
            // 최신 날짜와 시간 순으로 정렬 (내림차순)
            const sortedOrders = filteredOrders.sort((a, b) => {
              const dateA = new Date(a.order_date);
              const dateB = new Date(b.order_date);
              return dateB - dateA; // 최신 날짜와 시간이 먼저 오도록
            });
            
            ordersData.orders = sortedOrders;
          }
        } catch (err) {
          if (err.response?.status === 401) {
            console.warn('최근 주문 조회 401 에러 발생, 로그아웃 처리합니다.');
            logout();
            navigate('/login');
            return; // 함수 종료
          } else {
            ordersData = { orders: [] };
          }
        }
        
        // 주문 개수 조회 (실제 API 호출)
        try {
          const orderCountResponse = await orderApi.getOrderCount();
          orderCount = orderCountResponse.order_count || 0;
        } catch (err) {
          if (err.response?.status === 401) {
            console.warn('주문 개수 조회 401 에러 발생, 로그아웃 처리합니다.');
            logout();
            navigate('/login');
            return; // 함수 종료
          } else if (err.response?.status === 404) {
            // 404 에러 - 주문 개수 API 엔드포인트가 존재하지 않습니다.
            orderCount = 0;
          } else {
            orderCount = 0;
          }
        }
        
        // 레시피 정보 조회 (현재는 임시 데이터 사용)
        try {
          // TODO: 레시피 API 구현 시 실제 API 호출로 교체
          recipeData = { purchasedRecipe: null, similarRecipes: [] };
        } catch (err) {
          // 422 에러나 다른 에러가 발생해도 기본값으로 설정
          recipeData = { purchasedRecipe: null, similarRecipes: [] };
        }
        
        // 파싱된 데이터를 상태에 저장합니다
        setUserData({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          created_at: userData.created_at,
          orderCount: orderCount,
          recentOrders: ordersData.orders || [] // orders 배열만 저장
        });
        
        setRecipeData(recipeData);
        
        // API 호출이 성공했으므로 UserContext에서 로그인 상태로 설정
        login({
          token: localStorage.getItem('access_token'),
          tokenType: localStorage.getItem('token_type'),
          user_id: userData.user_id,
          email: userData.email,
          username: userData.username
        });
        
      } catch (err) {
        // 예상치 못한 에러가 발생한 경우
        setError('마이페이지 데이터를 불러오는데 실패했습니다.');
      } finally {
        // try-catch 블록이 끝나면 항상 로딩 상태를 false로 설정합니다
        setLoading(false);
      }
    };

    // 컴포넌트가 마운트될 때 데이터를 가져오는 함수를 실행합니다
    fetchMyPageData();
  }, [userContextLoading, isLoggedIn, user, logout, navigate, login]); // UserContext 상태 변화 감지

  // 주문 내역 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleOrderHistoryClick = async () => {
    try {
      // 로그인 상태 확인
      if (!isLoggedIn) {
        // 로그인하지 않은 경우 로그인 페이지로 이동
        navigate('/login');
        return;
      }
      
      // 토큰 유효성 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('토큰이 없습니다. 로그인 페이지로 이동합니다.');
        navigate('/login');
        return;
      }
      
      // 토큰 형식 확인 (JWT 형식)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.warn('토큰 형식이 올바르지 않습니다. 로그인 페이지로 이동합니다.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
        return;
      }
      
      // 주문 내역 페이지로 이동합니다 (React Router 사용)
      navigate('/orderlist');
    } catch (error) {
      // 에러 처리
      console.error('주문 내역 페이지 이동 중 오류:', error);
      setModalState(showAlert('주문 내역 페이지로 이동하는 중 오류가 발생했습니다.'));
    }
  };

  // 레시피 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleRecipeClick = async (recipeId) => {
    try {
      // TODO: 레시피 상세 정보 조회 API 구현 시 실제 API 호출로 교체
      // 레시피 상세 페이지로 이동하는 기능을 구현할 예정입니다
      // window.location.href = `/recipe-detail/${recipeId}`;
    } catch (error) {
      // 에러 처리
    }
  };

  // 레시피 추천 버튼 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleRecipeRecommendationClick = async (selectedOrders) => {
    try {
      // 선택된 주문이 있는지 확인
      if (!selectedOrders || selectedOrders.length === 0) {
        setModalState(showAlert('선택된 주문 상품이 없어서 레시피를 추천받을 수 없습니다.'));
        return;
      }

      console.log('🔍 레시피 추천 버튼 클릭 - 선택된 주문들:', selectedOrders);
      console.log('🔍 선택된 주문들의 상세 정보:');
      selectedOrders.forEach((order, index) => {
        console.log(`주문 ${index + 1}:`, {
          전체_데이터: order,
          사용가능한_키: Object.keys(order),
          product_id: order.product_id,
          kok_product_id: order.kok_product_id,
          id: order.id,
          productId: order.productId,
          item_id: order.item_id,
          kok_item_id: order.kok_item_id,
          product_name: order.product_name,
          order_id: order.order_id
        });
      });

      // 로딩 상태 시작
      setLoading(true);

      // 선택된 주문의 상품들로 레시피 추천 API 호출
      const recipeRecommendations = await cartApi.getMyPageRecipeRecommendations(
        selectedOrders,
        1, // page
        5  // size
      );

      console.log('🔍 마이페이지에서 CartRecipeResult로 전달할 데이터:', {
        recipes: recipeRecommendations.recipes || [],
        keyword_extraction: recipeRecommendations.keyword_extraction || [],
        total: recipeRecommendations.total_count || 0,
        page: recipeRecommendations.page || 1,
        searchType: 'mypage'
      });
      
      // CartRecipeResult 페이지로 이동
      navigate('/recipes/cart-result', {
        state: {
          recipes: recipeRecommendations.recipes || [],
          ingredients: recipeRecommendations.keyword_extraction || [],
          total: recipeRecommendations.total_count || 0,
          page: recipeRecommendations.page || 1,
          searchType: 'mypage' // 마이페이지에서 온 것임을 표시
        }
      });

    } catch (error) {
      console.error('레시피 추천 처리 중 오류:', error);
      setModalState(showAlert('레시피 추천을 불러오는데 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  };

  // 알림 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  // 장바구니 클릭 시 실행되는 핸들러 함수를 정의합니다
  const handleCartClick = () => {
    navigate('/cart');
  };

  // 로그인 핸들러 함수를 정의합니다
  const handleLogin = () => {
    navigate('/login');
  };

  // 로그아웃 핸들러 함수를 정의합니다
  const handleLogout = async () => {
    try {
      // 현재 access token 가져오기
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        navigate('/');
        return;
      }

      // 백엔드 로그아웃 API 호출 (API 명세서에 맞춘 처리)
      const response = await userApi.logout();
      
      // 로컬 스토리지에서 토큰 제거 (userApi에서 이미 처리됨)
      
      // 로그아웃 완료 모달 표시
      setModalState(showLogoutCompleteNotification());
      
    } catch (error) {
      // API 호출 실패 시에도 로컬 토큰은 제거
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // 에러 메시지 표시
      setModalState(showAlert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.'));
      
      // 홈페이지로 이동
      navigate('/');
    }
  };

     // 로딩 중일 때 표시할 UI를 렌더링합니다
   if (loading) {
     return (
       <div className={`mypage-page ${isLoggedIn && userData.username && userData.username.trim() !== '' ? 'logged-in' : 'logged-out'}`}>
        {/* 마이페이지 헤더 네비게이션 */}
        <HeaderNavMypage 
          onBackClick={() => window.history.back()}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
        {/* 메인 콘텐츠 영역 */}
        <div className="mypage-content">
          <Loading message="마이페이지를 불러오는 중 ..." />
        </div>
        {/* 하단 네비게이션을 렌더링합니다 */}
        <BottomNav modalState={modalState} setModalState={setModalState} />
      </div>
    );
  }

     // 정상적인 마이페이지를 렌더링합니다
   return (
     <div className={`mypage-page ${isLoggedIn && userData.username && userData.username.trim() !== '' ? 'logged-in' : 'logged-out'}`}>
              {/* 마이페이지 헤더 네비게이션 */}
        <HeaderNavMypage 
          onBackClick={() => window.history.back()}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
      {/* 메인 콘텐츠 */}
      <div className="mypage-content">
        {/* 유저 정보 카드 */}
        <div className="user-info-card">
          {/* 사용자 정보 컨텐츠 */}
          <div className="user-info-content">
            {/* 프로필 이미지 - 기본 사용자 아이콘 사용 */}
            <div className="profile-image">
              <img src={userIcon} alt="프로필" />
            </div>
            
                         {/* 유저 정보 */}
             <div className="user-details">
               {isLoggedIn && userData.username && userData.username.trim() !== '' ? (
                 <>
                   {/* 유저 이름을 표시합니다 (API에서 받아옴) */}
                   <div className="user-name">{userData.username} 님</div>
                   {/* 유저 이메일을 표시합니다 (API에서 받아옴) */}
                   <div className="user-email">{userData.email}</div>
                 </>
               ) : (
                 <>
                   {/* 로그인하지 않은 경우 기본 메시지 */}
                   <div className="user-name">로그인이 필요합니다</div>
                   <div className="user-email">로그인하여 개인화된 서비스를 이용하세요</div>
                 </>
               )}
             </div>
            
                         {/* 로그인/로그아웃 버튼 */}
             <div className="logout-container">
               {isLoggedIn && userData.username && userData.username.trim() !== '' ? (
                 <button className="logout-button" onClick={handleLogout}>
                   로그아웃
                 </button>
               ) : (
                 <button className="login-button" onClick={handleLogin}>
                   로그인
                 </button>
               )}
             </div>
          </div>
          
                     {/* 주문 내역 링크 */}
           <div className="order-history-link" onClick={handleOrderHistoryClick}>
             <span className="order-history-text">주문 내역</span>
                                     <span className="order-count">
                          {isLoggedIn && userData.username && userData.username.trim() !== '' ? (
                            <>
                              {userData.orderCount}
                              <svg className="order-count-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </>
                          ) : (
                            <>
                              로그인 필요
                              <svg className="order-count-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </>
                          )}
                        </span>
           </div>
        </div>

                 {/* 최근 주문 섹션 - 로그인한 상태에서만 표시 */}
         {isLoggedIn && userData.username && userData.username.trim() !== '' && (
          <div className="recent-orders-section">
            {/* 섹션 제목 */}
            <h3 className="section-title">최근 7일 동안 주문한 상품</h3>
            
            {/* 주문이 있을 때와 없을 때를 구분하여 렌더링합니다 */}
            {userData.recentOrders && userData.recentOrders.length > 0 ? (
              // 주문번호별로 그룹화하여 렌더링합니다
              (() => {
                // 주문번호별로 상품들을 그룹화합니다
                const groupedOrders = userData.recentOrders.reduce((groups, order) => {
                  if (!groups[order.order_id]) {
                    groups[order.order_id] = [];
                  }
                  groups[order.order_id].push(order);
                  return groups;
                }, {});
                
                // 그룹화된 주문들을 주문번호 순으로 정렬 (최신 주문번호가 먼저)
                const sortedGroupedOrders = Object.entries(groupedOrders).sort(([orderIdA, ordersA], [orderIdB, ordersB]) => {
                  const numA = parseInt(orderIdA);
                  const numB = parseInt(orderIdB);
                  return numB - numA; // 최신 주문번호가 먼저 오도록
                });
                
                // 정렬된 그룹화된 주문들을 렌더링합니다
                return sortedGroupedOrders.map(([orderId, orders]) => {
                  const firstOrder = orders[0]; // 첫 번째 상품의 정보를 사용
                  
                  return (
                    <div key={orderId} className="mypage-order-item">
                      {/* 주문 정보 헤더 */}
                      <div className="mypage-order-header">
                        {/* 주문 날짜와 주문번호를 한 줄로 표시합니다 */}
                        <div className="order-info-container">
                          <span className="mypage-order-date">{firstOrder.order_date}</span>
                          <span className="mypage-order-number">주문번호 {orderId}</span>
                        </div>
                      </div>
                      
                      {/* 배송 상태 카드 */}
                      <div className="delivery-status-card">
                        {/* 배송 상태를 표시합니다 (API에서 받아옴) */}
                        <div className="delivery-status">
                          <span className="delivery-status-text">{firstOrder.delivery_status || '배송완료'}</span>
                          <span className="delivery-date">{firstOrder.delivery_date || `${firstOrder.order_date} 도착`}</span>
                        </div>
                        
                        {/* 상품 정보들 - 실제 데이터 구조에 맞게 표시 */}
                        {orders.map((order, index) => (
                          <div key={`${orderId}-${index}`} className="mypage-product-info">
                            {/* 상품 이미지를 표시합니다 */}
                            <div className="mypage-product-image">
                              <img src={order.product_image || ''} alt={order.product_name} />
                            </div>
                            
                            {/* 상품 상세 정보 */}
                            <div className="mypage-product-details">
                              {/* 상품명을 표시합니다 */}
                              <div className="mypage-product-name" title={order.product_name}>
                                {(() => {
                                  const productName = order.product_name || '상품명 없음';
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
                              {/* 가격과 수량을 표시합니다 */}
                              <div className="mypage-product-price">
                                {formatPrice(order.price || 0)} · {order.quantity || 1}개
                              </div>
                              {/* 레시피 관련 정보가 있으면 표시 */}
                              {order.recipe_related && order.recipe_title && (
                                <div className="recipe-info">
                                  <div className="recipe-title">{order.recipe_title}</div>
                                  <div className="recipe-rating">★{order.recipe_rating || 0} 스크랩 {order.recipe_scrap_count || 0}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* 레시피 관련 버튼들 */}
                        <div className="recipe-buttons">
                          {/* 레시피 추천 버튼 - 해당 주문의 상품들만 사용 */}
                          <div 
                            className="recipe-recommend-btn" 
                            onClick={() => handleRecipeRecommendationClick(orders)}
                          >
                            구매한 식재료로 만들 수 있는 레시피 추천받기
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              // 주문이 없을 때의 UI - no_items 이미지 사용
              <div className="no-orders-state">
                {/* 주문 없음 일러스트레이션 */}
                <div className="no-orders-illustration">
                  <img src={noItemsIcon} alt="상품 없음" className="no-items-image" />
                </div>
                {/* 주문 없음 메시지 */}
                <div className="no-orders-message">최근 주문한 상품이 없어요</div>
              </div>
            )}
          </div>
        )}

        {/* 구매한 레시피 섹션 - 주문이 있을 때만 표시 */}
        {recipeData.purchasedRecipe && (
          <div className="purchased-recipe-section">
            {/* 섹션 제목 */}
            <h3 className="section-title">이 레시피를 보고 상품을 구매하셨어요!</h3>
            
            {/* 구매한 레시피 카드 */}
            <div className="recipe-card" onClick={() => handleRecipeClick(recipeData.purchasedRecipe.id)}>
              {/* 레시피 이미지를 표시합니다 (API에서 받아옴) */}
              <div className="recipe-image">
                <img src={recipeData.purchasedRecipe.image} alt={recipeData.purchasedRecipe.name} />
              </div>
              
              {/* 레시피 정보 */}
              <div className="recipe-info">
                {/* 레시피명을 표시합니다 (API에서 받아옴) */}
                <div className="recipe-name">{recipeData.purchasedRecipe.name}</div>
                
                {/* 평점과 스크랩 정보를 표시합니다 (API에서 받아옴) */}
                <div className="recipe-stats">
                  ★{recipeData.purchasedRecipe.rating} ({recipeData.purchasedRecipe.reviewCount}) 스크랩 {recipeData.purchasedRecipe.scrapCount}
                </div>
                
                {/* 레시피 설명을 표시합니다 (API에서 받아옴) */}
                <div className="recipe-description">{recipeData.purchasedRecipe.description}</div>
                
                {/* 재료 정보를 표시합니다 (API에서 받아옴) */}
                <div className="ingredient-info">
                  {recipeData.purchasedRecipe.ownedIngredients}개 재료 보유 | 재료 총 {recipeData.purchasedRecipe.totalIngredients}개
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 유사한 레시피 섹션 - 주문이 있을 때만 표시 */}
        {recipeData.similarRecipes.length > 0 && (
          <div className="similar-recipes-section">
            {/* 섹션 제목 */}
            <h3 className="section-title">유사한 레시피를 추천드려요!</h3>
            
            {/* 유사한 레시피 목록을 map으로 순회하며 렌더링합니다 (API에서 받아옴) */}
            {recipeData.similarRecipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card" onClick={() => handleRecipeClick(recipe.id)}>
                {/* 레시피 이미지를 표시합니다 (API에서 받아옴) */}
                <div className="recipe-image">
                  <img src={recipe.image} alt={recipe.name} />
                </div>
                
                {/* 레시피 정보 */}
                <div className="recipe-info">
                  {/* 레시피명을 표시합니다 (API에서 받아옴) */}
                  <div className="recipe-name">{recipe.name}</div>
                  
                  {/* 평점과 스크랩 정보를 표시합니다 (API에서 받아옴) */}
                  <div className="recipe-stats">
                    ★{recipe.rating} ({recipe.reviewCount}) 스크랩 {recipe.scrapCount}
                  </div>
                  
                  {/* 레시피 설명을 표시합니다 (API에서 받아옴) */}
                  <div className="recipe-description">{recipe.description}</div>
                  
                  {/* 재료 정보를 표시합니다 (API에서 받아옴) */}
                  <div className="ingredient-info">
                    {recipe.ownedIngredients}개 재료 보유 | 재료 총 {recipe.totalIngredients}개
                  </div>
                </div>
              </div>
            ))}
            
            {/* 더보기 표시 */}
            <div className="more-indicator">...</div>
          </div>
        )}

        {/* 법적 고지사항 */}
        <div className="legal-disclaimer">
          <p>
            LG U+는 통신판매중개자로서 통신판매의 당사자가 아니며, U+콕 사이트의 상품, 거래정보 및 거래에 대하여 책임을 지지 않습니다. 
            서비스 운영은 (주)지니웍스가 대행하고 있습니다.
          </p>
        </div>


      </div>

      {/* 하단 네비게이션 */}
      <BottomNav modalState={modalState} setModalState={setModalState} />
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

// MyPage 컴포넌트를 기본 내보내기로 설정합니다
export default MyPage; 