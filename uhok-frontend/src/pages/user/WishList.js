import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNavWishList from '../../layout/HeaderNavWishList';
import BottomNav from '../../layout/BottomNav';
import Loading from '../../components/Loading';
// 모달 관리자 import
import ModalManager, { showWishlistNotification, showWishlistUnlikedNotification, showLoginRequiredNotification, showAlert, hideModal } from '../../components/LoadingModal';
import api from '../api';
import emptyHeartIcon from '../../assets/heart_empty.png';
import filledHeartIcon from '../../assets/heart_filled.png';
// import testImage1 from '../../assets/test/test1.png';
// import testImage2 from '../../assets/test/test2.png';
import { getLogoByHomeshoppingId } from '../../components/homeshoppingLogo';
import '../../styles/wishlist.css';

const WishList = () => {
  const [wishlistData, setWishlistData] = useState({
    liked_products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('homeshopping'); // 'homeshopping' 또는 'shopping'
  const [unlikedProducts, setUnlikedProducts] = useState(new Set()); // 찜 해제된 상품 ID들을 저장
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가
  const hasInitialized = useRef(false); // 중복 실행 방지용 ref
  
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });
  
  const navigate = useNavigate();

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    // 로그인 필요 모달인 경우에만 이전 페이지로 돌아가기
    if (modalState.modalType === 'alert' && modalState.alertMessage === '로그인이 필요한 서비스입니다.') {
      window.history.back();
    }
  };

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    const isLoggedInStatus = !!token;
    setIsLoggedIn(isLoggedInStatus);
    return isLoggedInStatus;
  };

  // 찜한 상품 목록을 가져오는 함수
  const fetchWishlistData = async () => {
    // 로그인하지 않은 경우 로딩 중단하고 모달 표시
    if (!checkLoginStatus()) {
      setLoading(false);
      setModalState(showLoginRequiredNotification());
      return;
    }

    try {
      setLoading(true);
      
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        setModalState(showLoginRequiredNotification());
        return;
      }

      // 콕 쇼핑몰 찜한 상품 조회
      const kokResponse = await api.get('/api/kok/likes', {
        params: {
          limit: 20
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 홈쇼핑 찜한 상품 조회
      const homeshoppingResponse = await api.get('/api/homeshopping/likes', {
        params: {
          // limit: 50
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 두 API 응답을 합쳐서 위시리스트 데이터 구성
      const allProducts = [];
      
      // 콕 쇼핑몰 상품들 추가
      if (kokResponse.data && kokResponse.data.liked_products) {
        const kokProducts = kokResponse.data.liked_products.map(product => ({
          type: 'shopping',
          // 콕 상품 필드명을 통일
          kok_product_id: product.kok_product_id,
          kok_product_name: product.kok_product_name,
          kok_store_name: product.kok_store_name,
          kok_thumbnail: product.kok_thumbnail,
          kok_discounted_price: product.kok_discounted_price,
          kok_discount_rate: product.kok_discount_rate
        }));
        allProducts.push(...kokProducts);
      }

      // 홈쇼핑 상품들 추가
      if (homeshoppingResponse.data && homeshoppingResponse.data.liked_products) {
        const homeshoppingProducts = homeshoppingResponse.data.liked_products.map(product => ({
          type: 'homeshopping',
          // 홈쇼핑 상품 필드명을 통일
          hs_product_id: product.product_id,
          hs_live_id: product.live_id,
          hs_product_name: product.product_name,
          hs_store_name: product.store_name,
          hs_thumbnail: product.thumb_img_url,
          hs_discounted_price: product.dc_price,
          hs_discount_rate: product.dc_rate,
          // API에서 제공되는 방송 정보 사용
          broadcast_date: product.live_date,
          broadcast_time: product.live_start_time,
          broadcast_end_time: product.live_end_time, // 새로운 필드 추가
          // homeshopping_id를 기반으로 로컬 로고 가져오기
          channel_logo: getLogoByHomeshoppingId(product.homeshopping_id)?.logo,
          // 방송 상태는 live_date와 live_end_time을 모두 고려하여 계산
          broadcast_status: (() => {
            const now = new Date();
            
            // live_date와 live_end_time을 결합하여 방송 종료 시점 계산
            const liveEndDateTime = new Date(`${product.live_date}T${product.live_end_time}`);
            
            // 현재 시간과 방송 종료 시간 비교
            const timeDiff = liveEndDateTime - now;
            
            // 방송 종료 시간이 현재 시간보다 지났으면 방송종료
            if (timeDiff < 0) {
              return "방송종료";
            } 
            // 방송 종료 시간이 현재 시간보다 미래이면 방송중
            else if (timeDiff > 0) {
              return "방송중";
            } 
            // 방송 종료 시간이 현재 시간과 같으면 방송중
            else {
              return "방송중";
            }
          })()
        }));
        allProducts.push(...homeshoppingProducts);
      }

      console.log('통합된 찜한 상품 목록:', allProducts);
      setWishlistData({ liked_products: allProducts });

    } catch (err) {
      console.error('찜한 상품 목록 로딩 실패:', err);
      
      // 401 에러 (인증 실패) 시 로딩 중단하고 모달 표시
      if (err.response?.status === 401) {
        setLoading(false);
        setModalState(showLoginRequiredNotification());
        return;
      }
      
      // API 연결 실패 시 더미 데이터 사용
      // setWishlistData({
      //   liked_products: [
      //     {
      //       kok_product_id: 10,
      //       kok_product_name: "[허닭] 닭가슴살 오븐바/스테이크/소시지/볶음밥/유부초밥 외 전제품 152종 모음전",
      //       kok_thumbnail: testImage1,
      //       kok_product_price: 17900,
      //       kok_store_name: "허닭",
      //       kok_discount_rate: 56,
      //       kok_discounted_price: 7900,
      //       type: "shopping"
      //     },
      //     {
      //       hs_product_id: 25,
      //       hs_product_name: "[산해직송] 산해직송 전라도 맛있는 파김치 남도식 국산 국내산",
      //       hs_thumbnail: testImage2, 
      //       hs_discounted_price: 14800,
      //       hs_store_name: "산해직송",
      //       hs_discount_rate: 52,
      //       type: "homeshopping",
      //       broadcast_date: "2025-08-30",
      //       broadcast_status: "방송예정",
      //       broadcast_time: "20:00:00.000Z",
      //       channel_logo: getLogoByHomeshoppingId(25)
      //     },
      //     {
      //       hs_product_id: 30,
      //       hs_product_name: "[현대홈쇼핑] 프리미엄 무선 이어폰 블루투스 5.0",
      //       hs_thumbnail: testImage1,
      //       hs_discounted_price: 69300,
      //       hs_store_name: "현대홈쇼핑",
      //       hs_discount_rate: 30,
      //       type: "homeshopping",
      //       broadcast_date: "2025-08-30",
      //       broadcast_status: "방송중",
      //       broadcast_time: "14:30:00.000Z",
      //       channel_logo: getLogoByHomeshoppingId(30)
      //     }
      //   ]
      // });
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };

  // 찜 토글 함수
  const handleHeartToggle = async (productId, productType) => {
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('토큰이 없어서 로그인 페이지로 이동');
        window.location.href = '/';
        return;
      }

      let response;
      
      // 상품 타입에 따라 다른 API 호출
      if (productType === 'homeshopping') {
        // 홈쇼핑 상품 찜 토글 - live_id 사용
        response = await api.post('/api/homeshopping/likes/toggle', {
          live_id: productId
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // 콕 쇼핑몰 상품 찜 토글
        response = await api.post('/api/kok/likes/toggle', {
          kok_product_id: productId
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      console.log('찜 토글 응답:', response.data);

      // 찜 토글 성공 후 하트 아이콘만 즉시 변경 (위시리스트 데이터는 동기화하지 않음)
      if (response.data) {
        console.log('찜 토글 성공! 하트 아이콘 상태만 변경합니다.');
        
        // 백엔드 응답의 liked 상태에 따라 찜 상태 업데이트
        const isLiked = response.data.liked;
        
        // 하트 아이콘 상태만 토글 (즉시 피드백)
        setUnlikedProducts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            // 백엔드에서 찜된 상태로 응답
            newSet.delete(productId);
            console.log('찜이 추가되었습니다. 채워진 하트로 변경됩니다.');
          } else {
            // 백엔드에서 찜 해제된 상태로 응답
            newSet.add(productId);
            console.log('찜이 해제되었습니다. 빈 하트로 변경됩니다.');
          }
          return newSet;
        });
        
        // 애니메이션 효과 추가
        const heartButton = document.querySelector(`[data-product-id="${productId}"]`);
        if (heartButton) {
          heartButton.style.transform = 'scale(1.2)';
          setTimeout(() => {
            heartButton.style.transform = 'scale(1)';
          }, 150);
        }
        
        // 찜 상태에 따른 알림 모달 표시 (홈쇼핑 상품일 때만)
        if (productType === 'homeshopping') {
          if (isLiked) {
            // 찜 추가 시 알림
            setModalState(showWishlistNotification());
          } else {
            // 찜 해제 시 알림
            setModalState(showWishlistUnlikedNotification());
          }
        }
        // 쇼핑몰 상품의 경우 팝업 표시하지 않음
        
        // 위시리스트 데이터는 즉시 동기화하지 않음
        // 페이지 벗어나거나 새로고침할 때 동기화됨
      }
    } catch (err) {
      console.error('찜 토글 실패:', err);
      
      // 401 에러 (인증 실패) 시 모달 표시
      if (err.response?.status === 401) {
        setModalState(showLoginRequiredNotification());
        return;
      }
      
      // 다른 에러의 경우 사용자에게 알림
      setModalState(showAlert('찜 상태 변경에 실패했습니다. 다시 시도해주세요.'));
    }
  };

  // 상품 클릭 핸들러
  const handleProductClick = (productId, productType) => {
    if (productType === 'homeshopping') {
      // 홈쇼핑 상품 클릭 시 live_id를 사용하여 홈쇼핑 상품 상세 페이지로 이동
      navigate(`/homeshopping/product/${productId}`);
    } else {
      // 콕 상품 클릭 시 콕 상품 상세 페이지로 이동
      navigate(`/kok/product/${productId}`);
    }
  };

  // 검색 핸들러
  const handleSearch = (query) => {
    console.log('=== 찜 목록 검색 핸들러 호출됨 ===');
    console.log('검색어:', query);
    
    // 검색어가 있으면 기존 로직 사용, 없으면 콕 검색 페이지로 이동
    if (query && query.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(query.trim())}&type=wishlist`;
      console.log('이동할 URL:', searchUrl);
      
      try {
        navigate(searchUrl);
        console.log('페이지 이동 성공');
      } catch (error) {
        console.error('페이지 이동 실패:', error);
        // fallback으로 window.location.href 사용
        window.location.href = searchUrl;
      }
    } else {
      // 검색어가 없으면 콕 검색 페이지로 이동
      console.log('콕 검색 페이지로 이동');
      navigate('/kok/search');
    }
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = () => {
    console.log('알림 클릭됨');
    navigate('/notifications');
  };

  // 장바구니 클릭 핸들러
  const handleCartClick = () => {
    navigate('/cart');
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    navigate(-1);
  };

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  // 현재 탭에 해당하는 상품들만 필터링
  const filteredProducts = wishlistData.liked_products.filter(product => 
    product.type === activeTab
  );

  useEffect(() => {
    // 이미 초기화되었으면 리턴
    if (hasInitialized.current) {
      return;
    }
    
    // 초기화 플래그 설정
    hasInitialized.current = true;
    
    // 로그인 상태 확인 후 조건부로 API 호출 (중복 실행 방지)
    const loginStatus = checkLoginStatus();
    if (loginStatus) {
      fetchWishlistData();
    } else {
      // 로그인하지 않은 경우 로딩 중단하고 모달 표시
      setLoading(false);
      setModalState(showLoginRequiredNotification());
    }
    
    // 페이지를 벗어날 때 찜 상태 동기화
    return () => {
      // 위시리스트 데이터를 백엔드와 동기화
      console.log('위시리스트 페이지를 벗어납니다. 찜 상태를 동기화합니다.');
      // 여기서 필요한 정리 작업을 수행할 수 있습니다
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  if (loading) {
    return (
      <div className="wishlist-page">
        {/* 위시리스트 헤더 네비게이션 */}
        <HeaderNavWishList 
          onBackClick={handleBack}
          onSearchClick={handleSearch}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
        <div className="wishlist-content">
          <Loading message="찜한 상품을 불러오는 중 ..." />
        </div>
        <BottomNav modalState={modalState} setModalState={setModalState} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        {/* 위시리스트 헤더 네비게이션 */}
        <HeaderNavWishList 
          onBackClick={handleBack}
          onSearchClick={handleSearch}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
        <div className="wishlist-content">
          <div className="error">오류: {error}</div>
        </div>
        <BottomNav modalState={modalState} setModalState={setModalState} />
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {/* 위시리스트 헤더 네비게이션 */}
      <HeaderNavWishList 
        onBackClick={handleBack}
        onSearchClick={handleSearch}
        onNotificationClick={handleNotificationClick}
        onCartClick={handleCartClick}
      />
      
      <div className="wishlist-content">
        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'homeshopping' ? 'active' : ''}`}
            onClick={() => setActiveTab('homeshopping')}
          >
            홈쇼핑
          </button>
          <button 
            className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopping')}
          >
            쇼핑몰
          </button>
        </div>

        {/* 상품 개수 표시 */}
        <div className="product-count">
          총 {filteredProducts.length}개 상품
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-icon"></div>
            <div className="empty-text">찜한 상품이 없습니다</div>
            <div className="empty-subtext">마음에 드는 상품을 찜해보세요!</div>
          </div>
        ) : (
          <div className="wishlist-products">
                         {filteredProducts.map((product, index) => (
                               <div key={`${product.type}-${product.type === 'homeshopping' ? product.hs_product_id : product.kok_product_id}-${index}`} className="wishlist-product-container">
                  <div className="wishlist-product" onClick={() => handleProductClick(product.type === 'homeshopping' ? product.hs_live_id : product.kok_product_id, product.type)}>
                   <div className="product-image">
                     <img 
                       src={activeTab === 'homeshopping' ? product.hs_thumbnail : product.kok_thumbnail} 
                       alt={activeTab === 'homeshopping' ? product.hs_product_name : product.kok_product_name}
                     />
                   </div>
                   <div className="product-info">
                                           {activeTab === 'homeshopping' ? (
                                                // 홈쇼핑 탭 레이아웃 - 방송사, 상품명, 방송정보, 가격 순
                                                 <div className="product-channel-info">
                                                      <div className="channel-info-row">
                             <div className="channel-info">
                               <img 
                                 src={product.channel_logo} 
                                 alt="채널 로고"
                                 className="channel-logo"
                               />
                               {/* <span className="channel-number">[CH 8]</span> */}
                             </div>
                             <span className={`broadcast-status ${product.broadcast_status}`}>{product.broadcast_status}</span>
                           </div>
                           <div className="wishlist-product-name">
                             <span className="wishlist-brand-name">{product.hs_store_name}</span> | {product.hs_product_name}
                           </div>
                           <div className="broadcast-info">
                                                         <div className="broadcast-date-time">
                              <span className="broadcast-date">{product.broadcast_date}</span>
                              <span className="broadcast-time">{product.broadcast_time?.substring(0, 5)}</span>
                            </div>
                           </div>
                           <div className="price-section">
                             <div className="price-info">
                               {product.hs_discount_rate > 0 && (
                                 <span className="discount-rate-small wishlist-discount-rate-pink">{product.hs_discount_rate}%</span>
                               )}
                               <span className="discounted-price">{formatPrice(product.hs_discounted_price)}</span>
                             </div>
                                                         {/* 오른쪽: 하트 아이콘만 배치 */}
                            <div className="wishlist-right-info">
                              <button 
                                className="shopping-heart-button"
                                data-product-id={product.hs_live_id}
                                onClick={(e) => {
                                  e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                  handleHeartToggle(product.hs_live_id, product.type);
                                }}>
                                <img 
                                  src={unlikedProducts.has(product.hs_live_id) ? emptyHeartIcon : filledHeartIcon} 
                                  alt="찜 토글" 
                                  className="shopping-heart-icon"
                                />
                              </button>
                            </div>
                           </div>
                         </div>
                                       ) : (
                      // 쇼핑몰 탭 레이아웃 - 이미지 참고하여 개선
                      <div className="shopping-product-info">
                        <div className="shopping-product-details">
                          <span className="shopping-product-name">
                            <span className="shopping-brand-name">{product.kok_store_name}</span>{product.kok_product_name}
                          </span>
                        </div>
                                                 <div className="shopping-price-section">
                           <div className="shopping-price-info">
                                                           {product.kok_discount_rate > 0 && (
                                <span className="shopping-discount-rate-small wishlist-discount-rate-pink">{product.kok_discount_rate}%</span>
                              )}
                             <span className="shopping-discounted-price">{formatPrice(product.kok_discounted_price)}</span>
                           </div>
                          <button 
                            className="shopping-heart-button"
                            data-product-id={product.kok_product_id}
                            onClick={(e) => {
                              e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                              handleHeartToggle(product.kok_product_id, product.type);
                            }}>
                            <img 
                              src={unlikedProducts.has(product.kok_product_id) ? emptyHeartIcon : filledHeartIcon} 
                              alt="찜 토글" 
                              className="shopping-heart-icon"
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav modalState={modalState} setModalState={setModalState} />
      
      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default WishList;
