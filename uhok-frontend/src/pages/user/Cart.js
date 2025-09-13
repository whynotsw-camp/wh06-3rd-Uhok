import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavCart from '../../layout/HeaderNavCart';
import BottomNav from '../../layout/BottomNav';
import { cartApi } from '../../api/cartApi';
import api from '../api';
import Loading from '../../components/Loading';
import '../../styles/cart.css';
import heartIcon from '../../assets/heart_empty.png';
import heartFilledIcon from '../../assets/heart_filled.png';
// LoadingModal import
import ModalManager, { showLoginRequiredNotification, showAlert, hideModal } from '../../components/LoadingModal';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showRecipeRecommendation, setShowRecipeRecommendation] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [likedProducts, setLikedProducts] = useState(new Set()); // 찜한 상품 ID들을 저장
  const navigate = useNavigate();
  
  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ isVisible: false });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    // 로그인 필요 모달인 경우에만 이전 페이지로 돌아가기
    if (modalState.modalType === 'alert' && modalState.alertMessage === '로그인이 필요한 서비스입니다.') {
      window.history.back();
    }
  };
  
  const [isRecipeLoading, setIsRecipeLoading] = useState(false); // 레시피 추천 로딩 상태
  const [recipeRecommendations, setRecipeRecommendations] = useState([]); // 레시피 추천 데이터
  const [recipeLoading, setRecipeLoading] = useState(false); // 레시피 API 로딩 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가
  const isInitialLoadRef = useRef(false); // 중복 호출 방지용 ref

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    const isLoggedInStatus = !!token;
    setIsLoggedIn(isLoggedInStatus);
    return isLoggedInStatus;
  };

  useEffect(() => {
    // 중복 호출 방지
    if (isInitialLoadRef.current) {
      return;
    }
    isInitialLoadRef.current = true;

    // 로그인 상태 확인 후 조건부로 API 호출
    const loginStatus = checkLoginStatus();
    if (loginStatus) {
      loadCartItems();
    } else {
      // 로그인하지 않은 경우 모달 표시
      setModalState(showLoginRequiredNotification());
      return;
    }
  }, []);

  // 찜한 상품 목록을 가져오는 함수
  const loadLikedProducts = async () => {
    // 로그인하지 않은 경우 API 호출 건너뜀
    if (!checkLoginStatus()) {
      console.log('로그인하지 않은 상태: 찜 상품 API 호출 건너뜀');
      return;
    }

    try {
      const response = await api.get('/api/kok/likes', {
        params: {
          limit: 20
        }
      });
      
      if (response.data && response.data.liked_products) {
        const likedIds = new Set(response.data.liked_products.map(product => product.kok_product_id));
        setLikedProducts(likedIds);
      }
    } catch (error) {
      console.error('찜한 상품 목록 로딩 실패:', error);
    }
  };

  // 찜 토글 함수
  const handleHeartToggle = async (productId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setModalState(showLoginRequiredNotification());
        return;
      }

      // 찜 토글 API 호출
      const response = await api.post('/api/kok/likes/toggle', {
        kok_product_id: productId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('찜 토글 응답:', response.data);

      // 찜 토글 성공 후 하트 아이콘만 즉시 변경
      if (response.data) {
        console.log('찜 토글 성공! 하트 아이콘 상태만 변경합니다.');
        
        // 애니메이션 효과 추가
        const heartButton = document.querySelector(`[data-product-id="${productId}"]`);
        if (heartButton) {
          // 기존 애니메이션 클래스 제거
          heartButton.classList.remove('liked', 'unliked');
          
          // 현재 찜 상태 확인
          const isCurrentlyLiked = likedProducts.has(productId);
          
          // 애니메이션 클래스 추가
          if (isCurrentlyLiked) {
            // 찜 해제 애니메이션
            heartButton.classList.add('unliked');
          } else {
            // 찜 추가 애니메이션
            heartButton.classList.add('liked');
          }
          
          // 애니메이션 완료 후 클래스 제거
          setTimeout(() => {
            heartButton.classList.remove('liked', 'unliked');
          }, isCurrentlyLiked ? 400 : 600);
        }
        
        // 하트 아이콘 상태만 토글 (즉시 피드백)
        setLikedProducts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(productId)) {
            // 찜 해제된 상태에서 찜 추가
            newSet.delete(productId);
            console.log('찜이 추가되었습니다. 채워진 하트로 변경됩니다.');
          } else {
            // 찜된 상태에서 찜 해제
            newSet.add(productId);
            console.log('찜이 해제되었습니다. 빈 하트로 변경됩니다.');
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('찜 토글 실패:', error);
      
      // 401 에러 (인증 실패) 시 제자리에 유지
      if (error.response?.status === 401) {
        setModalState(showLoginRequiredNotification());
        return;
      }
      
      // 다른 에러의 경우 사용자에게 알림
      setModalState(showAlert('찜 상태 변경에 실패했습니다. 다시 시도해주세요.'));
    }
  };

  const loadCartItems = async () => {
    // 로그인하지 않은 경우 API 호출 건너뜀
    if (!checkLoginStatus()) {
      console.log('로그인하지 않은 상태: 장바구니 API 호출 건너뜀');
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 실제 API 호출 (토큰 체크는 api.js 인터셉터에서 처리)
      const response = await cartApi.getCartItems();
      const items = response.cart_items || [];
      
      setCartItems(items);
      // 모든 아이템을 기본적으로 선택
      setSelectedItems(new Set(items.map(item => item.kok_cart_id)));
      
      // 장바구니 로딩 성공 후 찜한 상품 목록도 로딩
      await loadLikedProducts();
    } catch (error) {
      console.error('장바구니 데이터 로딩 실패:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleNotificationClick = () => {
    console.log('알림 버튼 클릭');
    navigate('/notifications');
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      // 모든 아이템이 선택된 경우, 모두 해제
      setSelectedItems(new Set());
    } else {
      // 모든 아이템 선택
      setSelectedItems(new Set(cartItems.map(item => item.kok_cart_id)));
    }
  };

  const handleSelectItem = (cartItemId) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(cartItemId)) {
      newSelectedItems.delete(cartItemId);
    } else {
      newSelectedItems.add(cartItemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    try {
      // API 호출
      await cartApi.updateCartItemQuantity(cartItemId, newQuantity);
      
      // 성공 시 로컬 상태 업데이트
      setCartItems(prev => 
        prev.map(item => 
          item.kok_cart_id === cartItemId 
            ? { ...item, kok_quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('수량 변경 실패:', error);
      // 에러 처리 (사용자에게 알림 등)
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      // API 호출
      await cartApi.removeFromCart(cartItemId);
      
      // 성공 시 로컬 상태 업데이트
      setCartItems(prev => prev.filter(item => item.kok_cart_id !== cartItemId));
      setSelectedItems(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(cartItemId);
        return newSelected;
      });
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      // 에러 처리 (사용자에게 알림 등)
    }
  };

  const handleRemoveSelected = async () => {
    const selectedIds = Array.from(selectedItems);
    
    try {
      // 새로운 일괄 삭제 API 사용
      const result = await cartApi.removeSelectedItems(selectedIds);
      
      if (result.success) {
        // 성공 시 로컬 상태 업데이트
        setCartItems(prev => prev.filter(item => !selectedIds.includes(item.kok_cart_id)));
        setSelectedItems(new Set());
        
        // 성공 메시지 표시
        setModalState(showAlert(result.message));
      }
    } catch (error) {
      console.error('선택된 상품 삭제 실패:', error);
      setModalState(showAlert('선택된 상품 삭제에 실패했습니다. 다시 시도해주세요.'));
    }
  };

  // 공통 함수: 결제 페이지로 이동하는 로직
  const navigateToPayment = async (orderType = 'ORDER') => {
    if (selectedItems.size === 0) {
      setModalState(showAlert('주문할 상품을 선택해주세요.'));
      return;
    }

    try {
      // 장바구니 상태 재확인 (주문 전 최종 검증)
      console.log('🔍 주문 전 장바구니 상태 재확인 중...');
      await loadCartItems();
      
      // 재확인 후 선택된 상품들이 여전히 유효한지 확인
      const currentSelectedItems = cartItems.filter(item => selectedItems.has(item.kok_cart_id));
      if (currentSelectedItems.length === 0) {
        setModalState(showAlert('선택한 상품이 장바구니에서 삭제되었거나 변경되었습니다. 장바구니를 다시 확인해주세요.'));
        return;
      }
      
      // 선택된 상품들의 정보 수집
      const selectedCartItems = currentSelectedItems;
      
      console.log(`🚀 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 선택된 상품들:`, selectedCartItems);
      console.log(`🚀 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - selectedItems.size:`, selectedItems.size);
      console.log(`🚀 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - cartItems.length:`, cartItems.length);
      
      // 결제 페이지로 전달할 데이터 구성
      const navigationState = { 
        fromCart: true,
        // 할인 정보 전달
        discountPrice: selectedCartItems.reduce((total, item) => total + (item.kok_discounted_price * item.kok_quantity), 0),
        originalPrice: selectedCartItems.reduce((total, item) => total + (item.kok_product_price * item.kok_quantity), 0),
        productName: selectedCartItems.length === 1 ? selectedCartItems[0].kok_product_name : `${selectedCartItems.length}개 상품`,
        productImage: selectedCartItems.length === 1 ? selectedCartItems[0].kok_thumbnail : null,
        cartItems: selectedCartItems,
        // 주문 ID는 임시로 생성
        orderId: `${orderType}-${Date.now()}`
      };
      
      console.log(`🚀 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 결제페이지로 이동 - 전달할 state:`, navigationState);
      console.log(`📍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - navigate 함수 호출 직전`);
      console.log(`📍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - navigationState.fromCart:`, navigationState.fromCart);
      console.log(`📍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - navigationState.cartItems.length:`, navigationState.cartItems.length);
      
      // 결제 페이지로 이동
      const navigateResult = navigate('/kok/payment', { 
        state: navigationState,
        replace: false // 히스토리에 기록 남김
      });
      
      console.log(`✅ ${orderType === 'ORDER' ? '주문하기' : '테스트'} - navigate 함수 호출 완료`);
      console.log(`✅ ${orderType === 'ORDER' ? '주문하기' : '테스트'} - navigate 결과:`, navigateResult);
      
      // 추가 확인: 실제로 페이지가 이동되었는지 확인
      setTimeout(() => {
        console.log(`🔍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 페이지 이동 후 확인`);
        console.log(`🔍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 현재 URL:`, window.location.href);
        console.log(`🔍 ${orderType === 'ORDER' ? '주문하기' : '테스트'} - history.state:`, window.history.state);
      }, 100);
      
    } catch (error) {
      console.error(`❌ ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 처리 실패:`, error);
      console.error(`❌ ${orderType === 'ORDER' ? '주문하기' : '테스트'} - 에러 상세:`, error.message, error.stack);
      setModalState(showAlert(`${orderType === 'ORDER' ? '주문' : '테스트'} 처리에 실패했습니다. 다시 시도해주세요.`));
    }
  };

  const handleOrder = async () => {
    await navigateToPayment('ORDER');
  };

  const handleBuyNow = (cartItemId) => {
    console.log('구매하기 클릭:', cartItemId);
    navigate('/kok/payment');
  };

  const toggleRecipeRecommendation = async () => {
    try {
      // 선택된 상품이 있는지 확인
      if (selectedItems.size === 0) {
        setModalState(showAlert('레시피 추천을 받으려면 상품을 선택해주세요.'));
        return;
      }

      setIsRecipeLoading(true);
      
      // 선택된 상품들의 cart_id 배열
      const selectedCartIds = Array.from(selectedItems);
      
      // 통일된 레시피 추천 API 호출
      const recipeRecommendations = await cartApi.getRecipeRecommendations(
        selectedCartIds,
        1, // page
        5  // size
      );

      setIsRecipeLoading(false);
      
      // CartRecipeResult 페이지로 이동하면서 필요한 데이터 전달
      navigate('/recipes/cart-result', {
        state: {
          recipes: recipeRecommendations.recipes || [],
          ingredients: recipeRecommendations.keyword_extraction || [],
          total: recipeRecommendations.total_count || 0,
          page: recipeRecommendations.page || 1,
          searchType: 'cart' // 장바구니에서 온 것임을 표시
        }
      });
      
    } catch (error) {
      setIsRecipeLoading(false);
      console.error('레시피 추천 처리 중 오류:', error);
      setModalState(showAlert('레시피 추천을 불러오는데 실패했습니다. 다시 시도해주세요.'));
    }
  };



  const handleQuantityClick = (cartItemId) => {
    setSelectedCartItemId(cartItemId);
    setShowQuantityModal(true);
  };

  const handleQuantitySelect = (quantity) => {
    if (selectedCartItemId) {
      handleQuantityChange(selectedCartItemId, quantity);
    }
    setShowQuantityModal(false);
    setSelectedCartItemId(null);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedCartItemId(null);
  };

  // 선택된 상품들의 총 금액 계산
  const selectedItemsData = cartItems.filter(item => selectedItems.has(item.kok_cart_id));
  const totalProductPrice = selectedItemsData.reduce((sum, item) => sum + (item.kok_product_price * item.kok_quantity), 0);
  const totalDiscountedPrice = selectedItemsData.reduce((sum, item) => sum + (item.kok_discounted_price * item.kok_quantity), 0);
  const totalDiscount = totalProductPrice - totalDiscountedPrice;

  if (loading) {
    return (
      <div className="cart-page">
        {/* 장바구니 헤더 네비게이션 */}
        <HeaderNavCart 
          onBackClick={handleBack}
          onNotificationClick={handleNotificationClick}
        />
        <div className="cart-content">
          <div className="loading">장바구니를 불러오는 중...</div>
        </div>
        <BottomNav selectedItemsCount={selectedItems.size} cartItems={cartItems} selectedItems={selectedItems} modalState={modalState} setModalState={setModalState} />
      </div>
    );
  }

  // 레시피 추천 로딩 중일 때 전체 화면 로딩 표시
  if (isRecipeLoading) {
    return (
      <div className="cart-page">
        <HeaderNavCart 
          onBackClick={handleBack}
          onNotificationClick={handleNotificationClick}
        />
        <div className="cart-content">
          <Loading 
            message="레시피를 추천하고 있어요..." 
            containerStyle={{ 
              height: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </div>
        <BottomNav modalState={modalState} setModalState={setModalState} />
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* 장바구니 헤더 네비게이션 */}
      <HeaderNavCart 
        onBackClick={handleBack}
        onNotificationClick={handleNotificationClick}
      />
      
      <div className="cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>장바구니가 비어있어요</h2>
            <p>상품을 담아보세요!</p>
            <button 
              className="go-shopping-btn"
              onClick={() => navigate('/kok')}
            >
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <>
            {/* 선택 및 액션 바 */}
            <div className="cart-action-bar">
              <div className="select-all-section">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span className="checkmark"></span>
                  전체 선택
                </label>
                <span className="selection-count">
                  {selectedItems.size} / {cartItems.length}
                </span>
              </div>
              <button 
                className="delete-selected-btn"
                onClick={handleRemoveSelected}
                disabled={selectedItems.size === 0}
              >
                삭제
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.kok_cart_id} className="cart-item">
                  <div className="item-header">
                    <button 
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(item.kok_cart_id)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="item-content">
                    <div className="item-top-section">
                      <label className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.kok_cart_id)}
                          onChange={() => handleSelectItem(item.kok_cart_id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      
                      <div className="item-name">{item.kok_product_name}</div>
                    </div>
                    
                    <div className="item-main-section">
                      <div className="item-image">
                        <img src={item.kok_thumbnail || ''} alt={item.kok_product_name} />
                      </div>
                      
                      <div className="item-details">
                        <div className="item-option">
                          <div className="free-shipping-text">무료배송</div>
                          <div className="option-text">
                            {item.recipe_id ? `레시피 ID: ${item.recipe_id}` : '옵션 없음'}
                          </div>
                        </div>
                        <div className="item-price">
                          <span className="original-price">{item.kok_product_price.toLocaleString()}원</span>
                          <span className="discounted-price">{item.kok_discounted_price.toLocaleString()}원</span>
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="item-divider"></div>
                    
                    <div className="item-bottom-actions">
                      <div className="quantity-section">
                        <div className="quantity-control">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.kok_cart_id, item.kok_quantity - 1)}
                            disabled={item.kok_quantity <= 1}
                          >
                            ▼
                          </button>
                          <span className="quantity">
                            {item.kok_quantity}
                          </span>
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.kok_cart_id, item.kok_quantity + 1)}
                            disabled={item.kok_quantity >= 10}
                          >
                            ▲
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        className="wishlist-btn"
                        onClick={() => handleHeartToggle(item.kok_product_id)}
                        data-product-id={item.kok_product_id}
                      >
                        <img 
                          src={likedProducts.has(item.kok_product_id) ? heartFilledIcon : heartIcon} 
                          alt="찜하기" 
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 레시피 추천 바 */}
            {cartItems.length >= 1 && (
              <div className="recipe-recommendation-section">
                <button 
                  className="recipe-recommendation-btn"
                  onClick={toggleRecipeRecommendation}
                >
                  <span>{selectedItems.size}개의 상품을 선택하셨네요! 레시피를 추천드려요</span>
                </button>
                
                <div className={`recipe-recommendation-content ${showRecipeRecommendation ? 'show' : ''}`}>
                  {recipeLoading ? (
                    <div className="recipe-loading">레시피를 추천받는 중...</div>
                  ) : recipeRecommendations.length > 0 ? (
                    <>
                      {recipeRecommendations.map((recipe, index) => (
                        <div key={index} className="recipe-item">
                          <img 
                            src={recipe.recipe_thumbnail || ''} 
                            alt={recipe.recipe_title} 
                            className="recipe-thumbnail" 
                          />
                          <div className="recipe-info">
                            <h4>{recipe.recipe_title}</h4>
                            <p>조리시간: {recipe.cooking_time} | 난이도: {recipe.difficulty}</p>
                            <div className="recipe-meta">
                              <span className="recipe-tag">스크랩 {recipe.scrap_count}</span>
                              <span className="recipe-ingredients">재료 {recipe.matched_ingredient_count}개</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="recipe-more">
                        <button 
                          className="recipe-more-btn"
                          onClick={() => navigate('/recipes/recommendation')}
                        >
                          더 많은 레시피 보기
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="recipe-empty">
                      선택한 상품으로 만들 수 있는 레시피가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 가격 요약 */}
            <div className="price-summary">
              <div className="summary-item">
                <span>상품 금액</span>
                <span>{totalProductPrice.toLocaleString()}원</span>
              </div>
              <div className="summary-item discount">
                <span>상품 할인 금액</span>
                <span>-{totalDiscount.toLocaleString()}원</span>
              </div>
              <div className="summary-item shipping">
                <span>배송비</span>
                <span>0원</span>
              </div>
              <div className="summary-item total">
                <span>총 결제예정금액 (총 {selectedItems.size}건)</span>
                <span>{totalDiscountedPrice.toLocaleString()}원</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 주문하기 버튼 */}
      {cartItems.length > 0 && (
        <div className="order-section">
          <button 
            className="order-btn"
            onClick={handleOrder}
            disabled={selectedItems.size === 0}
          >
            주문하기
          </button>
        </div>
      )}

              <BottomNav selectedItemsCount={selectedItems.size} cartItems={cartItems} selectedItems={selectedItems} modalState={modalState} setModalState={setModalState} />

      {/* 수량 선택 모달 */}
      {showQuantityModal && (
        <div className="quantity-modal-overlay" onClick={closeQuantityModal}>
          <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>수량 선택</h3>
              <button className="close-btn" onClick={closeQuantityModal}>×</button>
            </div>
            <div className="quantity-options">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((quantity) => (
                <button
                  key={quantity}
                  className="quantity-option"
                  onClick={() => handleQuantitySelect(quantity)}
                >
                  {quantity}개
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Cart;
