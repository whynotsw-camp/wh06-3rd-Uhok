import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../../layout/BottomNav';
import HeaderNavKokProductDetail from '../../layout/HeadernavkokProductDetail';
import { getProductDetail } from '../../data/products';
import Loading from '../../components/Loading';
import UpBtn from '../../components/UpBtn';
import '../../styles/kok_product_detail.css';
import emptyHeartIcon from '../../assets/heart_empty.png';
import filledHeartIcon from '../../assets/heart_filled.png';
import CartButton from '../../components/CartButton';
import VideoPopUp from '../../components/VideoPopUp';
import api from '../api';
import { cartApi } from '../../api/cartApi';
import LiveStreamPlayer from '../../components/player/LiveStreamPlayer';
import ModalManager, { showAlert, showConfirm, hideModal } from '../../components/LoadingModal';


const KokProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [kokProduct, setKokProduct] = useState(null);
  const [kokActiveTab, setKokActiveTab] = useState('description');
  const [kokLoading, setKokLoading] = useState(true);
  const [kokIsWishlisted, setKokIsWishlisted] = useState(false);
  const [kokProductImages, setKokProductImages] = useState([]);
  const [kokReviewStats, setKokReviewStats] = useState(null);
  const [kokReviewList, setKokReviewList] = useState([]);
  const [kokSellerInfo, setKokSellerInfo] = useState(null);
  const [kokDetailInfo, setKokDetailInfo] = useState([]);
  
  // 수량 선택 모달 관련 상태
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // VideoPopUp 상태 관리
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [videoPopupData, setVideoPopupData] = useState({
    videoUrl: '',
    productName: '',
    homeshoppingName: '',
    kokProductId: ''
  });

  // 커스텀 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });
  
  // 장바구니 중복 확인 모달 상태
  const [showCartConfirmModal, setShowCartConfirmModal] = useState(false);
  const [existingCartItem, setExistingCartItem] = useState(null);



  // BottomNav에서 주문하기 버튼 클릭 시 수량 선택 모달 열기
  useEffect(() => {
    const handleOpenQuantityModal = (event) => {
      if (event.detail && event.detail.productId === productId) {
        console.log('하단 네비게이션에서 주문하기 버튼 클릭됨');
        setShowQuantityModal(true);
      } else {
        console.log('BottomNav에서 수량 선택 모달 열기 이벤트 수신');
        setShowQuantityModal(true);
      }
    };

    window.addEventListener('openQuantityModal', handleOpenQuantityModal);

    return () => {
      window.removeEventListener('openQuantityModal', handleOpenQuantityModal);
    };
  }, [productId]);

  // KOK API에서 상품 기본 정보를 가져오는 함수
  const fetchKokProductInfo = async (productId) => {
    try {
      // productId를 정수형으로 변환
      const numericProductId = parseInt(productId, 10);
      console.log(`상품 기본 정보 API 호출: /api/kok/product/${numericProductId}/info`);
      
      // 토큰이 있으면 헤더에 추가 (선택사항)
      const token = localStorage.getItem('access_token');
      const config = {};
      
      if (token) {
        config.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await api.get(`/api/kok/product/${numericProductId}/info`, config);
      console.log('상품 기본 정보 API 응답:', response.data);
      return response.data;
    } catch (err) {
      console.error('KOK 상품 기본 정보 로딩 실패:', err);
      console.log('임시 데이터를 사용합니다.');
      return null;
    }
  };

  // KOK API에서 상품 상세정보 탭 데이터를 가져오는 함수
  const fetchKokProductTabs = async (productId) => {
    try {
      // productId를 정수형으로 변환
      const numericProductId = parseInt(productId, 10);
      console.log(`상품 상세정보 탭 API 호출: /api/kok/product/${numericProductId}/tabs`);
      
      // 토큰이 있으면 헤더에 추가 (선택사항)
      const token = localStorage.getItem('access_token');
      const config = {};
      
      if (token) {
        config.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await api.get(`/api/kok/product/${numericProductId}/tabs`, config);
      console.log('KOK 상품 상세정보 탭 데이터 응답:', response.data);
      
      // API 응답 구조 확인
      if (response.data && response.data.images) {
        return response.data;
      } else {
        console.log('API 응답에 images 필드가 없어 기본 이미지를 사용합니다.');
        return {
          images: []
        };
      }
    } catch (err) {
      console.error('KOK 상품 상세정보 탭 데이터 로딩 실패:', err);
      console.log('임시 데이터를 사용합니다.');
      // API 실패 시 더미 데이터 반환
      return {
        images: []
      };
    }
  };

  // KOK API에서 상품 리뷰 데이터를 가져오는 함수
  const fetchKokProductReviews = async (productId) => {
    try {
      // productId를 정수형으로 변환
      const numericProductId = parseInt(productId, 10);
      console.log(`상품 리뷰 API 호출: /api/kok/product/${numericProductId}/reviews`);
      
      // 토큰이 있으면 헤더에 추가 (선택사항)
      const token = localStorage.getItem('access_token');
      const config = {};
      
      if (token) {
        config.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await api.get(`/api/kok/product/${numericProductId}/reviews`, config);
      console.log('상품 리뷰 API 응답:', response.data);
      return response.data;
    } catch (err) {
      console.error('KOK 상품 리뷰 데이터 로딩 실패:', err);
      console.log('임시 데이터를 사용합니다.');
      return null;
    }
  };

  // KOK API에서 상품 상세 정보 데이터를 가져오는 함수
  const fetchKokProductDetails = async (productId) => {
    try {
      // productId를 정수형으로 변환
      const numericProductId = parseInt(productId, 10);
      console.log(`상품 상세 정보 API 호출: /api/kok/product/${numericProductId}/seller-details`);
      
      // 토큰이 있으면 헤더에 추가 (선택사항)
      const token = localStorage.getItem('access_token');
      const config = {};
      
      if (token) {
        config.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await api.get(`/api/kok/product/${numericProductId}/seller-details`, config);
      console.log('KOK 상품 상세 정보 데이터 응답:', response.data);
      return response.data;
    } catch (err) {
      console.error('KOK 상품 상세 정보 데이터 로딩 실패:', err);
      console.log('임시 데이터를 사용합니다.');
      return null;
    }
  };



  // KOK API에서 상품 전체 상세 정보를 가져오는 함수 (사용하지 않음)
  // const fetchKokProductFullDetail = async (productId) => {
  //   try {
  //     console.log(`상품 전체 상세 정보 API 호출: /api/kok/product/${productId}/full-detail`);
  //     const response = await api.get(`/api/kok/product/${productId}/full-detail`);
  //     console.log('KOK 상품 전체 상세 정보 API 응답:', response.data);
  //     return response.data;
  //   } catch (err) {
  //     console.error('KOK 상품 전체 상세 정보 로딩 실패:', err);
  //     console.log('개별 API를 사용합니다.');
  //     return null;
  //   }
  // };



  // VideoPopUp 표시 함수
  const showVideoPopupHandler = () => {
    setVideoPopupData({
      videoUrl: '', // 콕 상품 페이지에서는 영상 URL이 없으므로 빈 문자열로 설정
      productName: kokProduct?.name || '상품명',
      homeshoppingName: '콕 쇼핑몰',
      kokProductId: productId
    });
    setShowVideoPopup(true);
  };

  useEffect(() => {
    const loadKokProductData = async () => {
      try {
        setKokLoading(true);
        
                 // 홈쇼핑에서 넘어온 경우 영상 표시는 상단에 고정으로 처리됨
        
        // 개별 API들을 병렬로 호출하여 데이터 가져오기
        console.log('개별 API들을 사용하여 데이터 로딩');
        
        try {
          const [kokProductInfo, kokProductTabs, kokProductReviews, kokProductDetails] = await Promise.all([
            fetchKokProductInfo(productId),
            fetchKokProductTabs(productId),
            fetchKokProductReviews(productId),
            fetchKokProductDetails(productId)
          ]);

                                // 기본 제품 데이터 생성 (기본값으로 설정)
            let defaultKokProduct = {
              id: parseInt(productId),
              name: `제품 ${productId}`,
              originalPrice: 15000,
              discountPrice: 12000,
              discountRate: 20,
              image: '',
              rating: 4.5,
              reviewCount: 15
            };

          // product-info API에서 기본 정보가 있으면 업데이트
          if (kokProductInfo) {
            defaultKokProduct = {
              id: kokProductInfo.kok_product_id || parseInt(productId),
              name: kokProductInfo.kok_product_name || `제품 ${productId}`,
              originalPrice: kokProductInfo.kok_product_price || 0,
              discountPrice: kokProductInfo.kok_discounted_price || kokProductInfo.kok_product_price || 0,
              discountRate: kokProductInfo.kok_discount_rate || 0,
                             image: kokProductInfo.kok_thumbnail || '',
              rating: 0, // API에서 별도로 제공되지 않음
              reviewCount: kokProductInfo.kok_review_cnt || 0,
              storeName: kokProductInfo.kok_store_name || ''
            };

            // 백엔드에서 제공하는 찜 상태 설정
            if (kokProductInfo.is_liked !== undefined) {
              setKokIsWishlisted(kokProductInfo.is_liked);
              console.log('백엔드에서 찜 상태 확인:', kokProductInfo.is_liked);
            }
          }

          setKokProduct(defaultKokProduct);

          // 상품 상세정보 탭 데이터 처리
          if (kokProductTabs && kokProductTabs.images) {
            console.log('상품 이미지 데이터 설정:', kokProductTabs.images);
            setKokProductImages(kokProductTabs.images);
          } else {
            console.log('상품 이미지 데이터가 없어 기본 이미지를 사용합니다.');
            setKokProductImages([]);
          }

          // 상품 리뷰 데이터 처리
          if (kokProductReviews) {
            setKokReviewStats(kokProductReviews.stats);
            setKokReviewList(kokProductReviews.reviews);
          }

          // 상품 상세 정보 데이터 처리
          if (kokProductDetails) {
            setKokSellerInfo(kokProductDetails.seller_info);
            setKokDetailInfo(kokProductDetails.detail_info);
          }
        } catch (error) {
          console.error('개별 API 로딩 중 오류 발생:', error);
          
          // API 실패 시 기본 데이터 사용
          console.log('API 실패, 기본 데이터 사용');
          
                     // 기본 제품 데이터 생성
           const defaultKokProduct = {
             id: parseInt(productId),
             name: `제품 ${productId}`,
             originalPrice: 15000,
             discountPrice: 12000,
             discountRate: 20,
             image: '/test1.png',
             rating: 4.5,
             reviewCount: 15
           };
          setKokProduct(defaultKokProduct);
          
          // 기본 이미지 설정
          setKokProductImages([
            {
              kok_img_id: 1,
              kok_img_url: ""
            }
          ]);
        }
      } catch (error) {
        console.error('상품 데이터 로딩 중 오류 발생:', error);
      } finally {
        setKokLoading(false);
      }
    };

    loadKokProductData();
  }, [productId]);

  const handleKokBack = () => {
    // 검색 페이지에서 온 경우 검색 페이지로 돌아가기
    const fromState = location.state;
    
    if (fromState && fromState.from === 'search' && fromState.backUrl) {
      console.log('검색 페이지로 돌아가기:', fromState.backUrl);
      navigate(fromState.backUrl);
    } else {
      // 일반적인 뒤로가기
      console.log('일반 뒤로가기');
      navigate(-1);
    }
  };



  const handleKokNotificationClick = () => {
    console.log('알림 클릭');
    navigate('/notifications');
  };

  const handleKokCartClick = () => {
    console.log('장바구니 클릭');
    navigate('/cart');
  };

  const handleKokCartButtonClick = () => {
    console.log('장바구니 버튼 클릭');
    
    // 애니메이션 효과를 위한 DOM 조작
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
      cartButton.style.transform = 'scale(1.2)';
      setTimeout(() => {
        cartButton.style.transform = 'scale(1)';
      }, 150);
    }
  };

  // 수량 선택 모달 열기
  const handleOrderClick = () => {
    console.log('주문하기 클릭 - 수량 선택 모달 열기');
    setShowQuantityModal(true);
  };

  // 수량 선택 모달 닫기
  const handleCloseQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedQuantity(1); // 수량 초기화
  };

  // 수량 변경
  const handleQuantityChange = (newQuantity) => {
    setSelectedQuantity(newQuantity);
  };

  // 커스텀 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };

  // 장바구니 중복 확인 모달 - 장바구니로 이동
  const handleCartConfirm = () => {
    console.log('사용자가 장바구니로 이동을 선택했습니다.');
    setShowCartConfirmModal(false);
    setExistingCartItem(null);
    handleCloseQuantityModal();
    navigate('/cart');
  };

  // 장바구니 중복 확인 모달 - 현재 페이지에서 계속 쇼핑
  const handleCartCancel = () => {
    console.log('사용자가 현재 페이지에서 계속 쇼핑을 선택했습니다.');
    setShowCartConfirmModal(false);
    setExistingCartItem(null);
    handleCloseQuantityModal();
  };

  // API 연결 테스트 함수 (개발자 도구에서 실행 가능)
  const testApiConnection = async () => {
    try {
      console.log('🧪 API 연결 테스트 시작');
      const results = await cartApi.testApiConnection(); // cartApi 객체를 사용하여 테스트
      console.log('📊 API 연결 테스트 결과:', results);
      
      // 결과를 alert로 표시
      const summary = `
API 연결 테스트 결과:
- 인증 토큰: ${results.auth.hasToken ? '있음' : '없음'}
- 장바구니 조회: ${results.tests.cartRead?.success ? '성공' : '실패'}
- 상태 코드: ${results.tests.cartRead?.status || 'N/A'}
      `;
      setModalState(showAlert(summary));
      
      return results;
    } catch (error) {
      console.error('❌ API 연결 테스트 실패:', error);
      setModalState(showAlert('API 연결 테스트 실패: ' + error.message));
    }
  };

  // 개발자 도구에서 실행할 수 있도록 window 객체에 추가
  useEffect(() => {
    window.testCartApi = testApiConnection;
    // console.log('🧪 API 테스트 함수가 window.testCartApi로 등록되었습니다.');
    // console.log('개발자 도구에서 window.testCartApi()를 실행하여 테스트하세요.');
  }, []);

  // 장바구니에 추가 (일반)
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        window.history.back();
        return;
      }

      // productId 유효성 검증
      console.log('🔍 productId 검증:', { productId, type: typeof productId });
      
      if (!productId) {
        throw new Error('상품 ID가 없습니다.');
      }
      
      const parsedProductId = parseInt(productId);
      if (isNaN(parsedProductId) || parsedProductId <= 0) {
        throw new Error(`유효하지 않은 상품 ID: ${productId}`);
      }

      const cartData = {
        kok_product_id: parsedProductId,
        kok_quantity: selectedQuantity, // 선택된 수량 사용
        recipe_id: 0 // 레시피 ID는 0으로 설정
      };

      console.log('장바구니 추가 요청:', cartData);
      console.log('🔍 디버깅 정보:', {
        productId: productId,
        productIdType: typeof productId,
        productIdParsed: parseInt(productId),
        isNaN: isNaN(parseInt(productId)),
        selectedQuantity: selectedQuantity,
        selectedQuantityType: typeof selectedQuantity
      });
      
      const response = await cartApi.addToCart(cartData);

      console.log('장바구니 추가 성공:', response);
      
      // 성공 메시지 표시
      setModalState(showAlert('장바구니에 추가되었습니다!'));
      
      // 모달 닫기
      handleCloseQuantityModal();
      
      // 장바구니 페이지로 이동 (선택사항)
      // navigate('/cart');
      
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      
      if (error.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
      } else if (error.response?.status === 400) {
        setModalState(showAlert('이미 장바구니에 있는 상품입니다.'));
      } else if (error.response?.status === 500) {
        // 500 에러는 cartApi에서 이미 임시 모의 응답을 반환했으므로 성공으로 처리
        console.log('서버 오류 발생, 임시 모의 응답 사용됨');
        setModalState(showAlert('장바구니에 추가되었습니다! (임시 모의 응답)'));
      } else {
        setModalState(showAlert('장바구니 추가에 실패했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 주문하기를 위한 장바구니 추가 및 결제 페이지 이동 (백그라운드 처리)
  const handleOrderNow = async () => {
    try {
      setIsAddingToCart(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        return;
      }

      console.log('🚀 주문하기 - 장바구니 확인 시작');
      
      // 1. 먼저 현재 장바구니 상태 확인
      const cartResponse = await cartApi.getCartItems();

      console.log('✅ 현재 장바구니 상태:', cartResponse);
      
      const cartItems = cartResponse.cart_items || [];
      const existingCartItem = cartItems.find(item => 
        item.kok_product_id === parseInt(productId)
      );

      // 2. 이미 장바구니에 있는 상품인지 확인
      if (existingCartItem) {
        console.log('이미 장바구니에 있는 상품 발견:', existingCartItem);
        
        // 모달로 사용자에게 선택권 제공
        setExistingCartItem(existingCartItem);
        setShowCartConfirmModal(true);
        return;
      }

                    // 3. 장바구니에 상품 추가
       console.log('🚀 주문하기 - 장바구니에 상품 추가');
       
       const cartData = {
         kok_product_id: parseInt(productId),
         kok_quantity: selectedQuantity,
         recipe_id: 0 // 레시피 ID는 0으로 설정
       };

       try {
         // 4. 장바구니에 상품 추가
         const cartResponse = await cartApi.addToCart(cartData);
         console.log('✅ 주문하기 - 장바구니 추가 성공:', cartResponse);
         
         // 5. 장바구니 목록 다시 조회하여 추가된 상품 정보 가져오기
         const updatedCartResponse = await cartApi.getCartItems();
         console.log('✅ 주문하기 - 업데이트된 장바구니 목록 조회 성공:', updatedCartResponse);
         
         // 6. 추가된 상품 찾기
         const updatedCartItems = updatedCartResponse.cart_items || [];
         const cartItemToOrder = updatedCartItems.find(item => 
           item.kok_product_id === parseInt(productId)
         );

         if (!cartItemToOrder) {
           throw new Error('장바구니에 추가된 상품을 찾을 수 없습니다.');
         }

         console.log('✅ 주문하기 - 주문할 장바구니 상품 찾음:', cartItemToOrder);
         
         // 7. 장바구니 상품으로 주문 생성
         const orderItem = {
           cart_id: cartItemToOrder.kok_cart_id,
           quantity: selectedQuantity
         };

         const orderResponse = await cartApi.createOrder([orderItem]);
         console.log('✅ 주문하기 - 주문 생성 성공:', orderResponse);
         
         // 8. 결제 페이지로 이동할 데이터 구성
         const navigationState = {
           fromCart: false,
           discountPrice: (kokProduct?.discountPrice || 0) * selectedQuantity,
           originalPrice: (kokProduct?.originalPrice || 0) * selectedQuantity,
           productName: kokProduct?.name || `제품 ${productId}`,
                       productImage: kokProduct?.image || kokProductImages[0]?.kok_img_url || '',
           orderId: String(orderResponse.order_id || `ORDER-${Date.now()}`),
           orderDetails: orderResponse.order_details || [],
           kokOrderIds: orderResponse.order_details?.map(detail => detail.kok_order_id) || []
         };
         
         console.log('🚀 주문하기 - kokProduct.image:', kokProduct?.image);
         console.log('🚀 주문하기 - kokProductImages[0]:', kokProductImages[0]);
         console.log('🚀 주문하기 - 최종 productImage:', navigationState.productImage);

         console.log('🚀 주문하기 - 결제 페이지로 이동:', navigationState);
         
         // 9. 모달 닫기
         handleCloseQuantityModal();
         
         // 10. 결제 페이지로 이동
         navigate('/kok/payment', { 
           state: navigationState,
           replace: false
         });
         
       } catch (orderError) {
         console.error('❌ 주문 생성 실패:', orderError);
         
         if (orderError.response?.status === 401) {
           setModalState(showAlert('로그인이 필요한 서비스입니다.'));
         } else if (orderError.response?.status === 500) {
           setModalState(showAlert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
         } else {
           setModalState(showAlert('주문 처리에 실패했습니다. 다시 시도해주세요.'));
         }
       }
    } catch (error) {
      console.error('❌ 주문하기 처리 실패:', error);
      
      if (error.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
      } else {
        setModalState(showAlert('주문 처리에 실패했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleKokWishlistClick = async () => {
    try {
      // API 호출을 위한 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        return;
      }

      // API 호출
      const response = await api.post('/api/kok/likes/toggle', {
        kok_product_id: productId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('찜 API 응답:', response.data);
      
      // 찜 상태 토글
      setKokIsWishlisted(!kokIsWishlisted);
      console.log('찜 버튼 클릭:', !kokIsWishlisted ? '찜 추가' : '찜 해제');
      
      // 애니메이션 효과를 위한 DOM 조작
      const heartButton = document.querySelector('.heart-button');
      if (heartButton) {
        if (!kokIsWishlisted) {
          // 찜 추가 애니메이션
          heartButton.classList.add('liked');
          setTimeout(() => heartButton.classList.remove('liked'), 600);
        } else {
          // 찜 해제 애니메이션
          heartButton.classList.add('unliked');
          setTimeout(() => heartButton.classList.remove('unliked'), 600);
        }
      }
    } catch (error) {
      console.error('찜 API 호출 실패:', error);
      
      // 에러 발생 시 사용자에게 알림
      if (error.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
      } else {
        setModalState(showAlert('찜 기능을 사용할 수 없습니다. 다시 시도해주세요.'));
      }
    }
  };

  const renderKokStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const renderKokTabContent = () => {
    switch (kokActiveTab) {
      case 'description':
        return (
          <div className="kok-tab-content" style={{ 
            padding: '16px',
            width: '100%',
            maxWidth: '448px',
            height: '855px',
            overflowY: 'auto'
          }}>
                         {/* KOK API에서 가져온 상품 이미지들 */}
             {kokProductImages.length > 0 && (
               <div className="product-images-section" style={{ marginTop: '24px' }}>
                 <h3>상품 상세 이미지</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {kokProductImages.map((image) => (
                    <div key={image.kok_img_id} style={{ width: '100%', margin: '0px', padding: '0px' }}>
                      <img 
                        src={image.kok_img_url} 
                        alt={`상품 상세 이미지 ${image.kok_img_id}`}
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          borderRadius: '0px',
                          margin: '0px',
                          padding: '0px',
                          display: 'block',
                          verticalAlign: 'top'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'reviews':
        return (
          <div className="kok-tab-content" style={{ 
            padding: '16px',
            width: '100%',
            maxWidth: '448px',
            height: '855px',
            overflowY: 'auto'
          }}>
                         <div className="reviews-header" style={{ marginBottom: '20px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                 리뷰 {kokReviewStats ? kokReviewStats.kok_review_cnt : kokProduct.reviewCount}
               </h3>
            </div>
            
            
            
            {/* 별점 분포 표시 */}
            {kokReviewStats && (
              <div className="rating-distribution-container">
                                 {/* 평균 별점 섹션 */}
                 <div className="average-rating-section">
                   <div className="average-rating-stars">
                     ★
                   </div>
                   <div className="average-rating-score">
                     {kokReviewStats.kok_review_score ? kokReviewStats.kok_review_score.toFixed(1) : '0.0'}
                   </div>
                 </div>
                
                {/* 별점 분포 차트 */}
                <div className="rating-distribution-chart">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="rating-bar" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="star-label" style={{ width: '40px', fontSize: '12px' }}>{star}점</span>
                      <div className="rating-bar-container">
                        <div 
                          className="rating-bar-fill" 
                          style={{ 
                            width: `${kokReviewStats[`kok_${star}_ratio`] || 0}%`
                          }}
                        ></div>
                      </div>
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666', width: '30px' }}>
                        {kokReviewStats[`kok_${star}_ratio`] || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* API에서 실제 리뷰 데이터가 있을 때만 표시 */}
            {kokReviewList.length > 0 ? (
              <div className="reviews-list">
                {kokReviewList.map(review => (
                  <div key={review.kok_review_id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{review.kok_review_user}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>{review.kok_review_date}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#FA5F8C', fontSize: '14px' }}>
                        {renderKokStars(review.kok_review_score)}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                      {review.kok_review_text}
                    </p>
                    {review.kok_price_eval && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        <span style={{ marginRight: '8px' }}>가격: {review.kok_price_eval}</span>
                        <span style={{ marginRight: '8px' }}>배송: {review.kok_delivery_eval}</span>
                        <span>맛: {review.kok_taste_eval}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#999',
                fontSize: '14px'
              }}>
                아직 리뷰가 없습니다.
              </div>
            )}
          </div>
        );

      case 'details':
        return (
          <div className="kok-tab-content" style={{ 
            padding: '16px',
            width: '100%',
            maxWidth: '448px',
            height: '855px',
            overflowY: 'auto'
          }}>
                         <div className="details-info">
               <h3>상세 정보</h3>
               
               {/* 판매자 정보 표 */}
               {kokSellerInfo && (
                 <div>
                   <h4>판매자 정보</h4>
                   <table>
                     <tbody>
                       <tr>
                         <td>상호명/대표자</td>
                         <td>{kokSellerInfo.kok_co_ceo}</td>
                       </tr>
                       <tr>
                         <td>사업자등록번호</td>
                         <td>{kokSellerInfo.kok_co_reg_no}</td>
                       </tr>
                       <tr>
                         <td>통신판매업신고</td>
                         <td>{kokSellerInfo.kok_co_ec_reg}</td>
                       </tr>
                       <tr>
                         <td>전화번호</td>
                         <td>{kokSellerInfo.kok_tell}</td>
                       </tr>
                       <tr>
                         <td>인증완료 항목</td>
                         <td>{kokSellerInfo.kok_ver_item}</td>
                       </tr>
                       <tr>
                         <td>인증시기</td>
                         <td>{kokSellerInfo.kok_ver_date}</td>
                       </tr>
                       <tr>
                         <td>영업소재지</td>
                         <td>{kokSellerInfo.kok_co_addr}</td>
                       </tr>
                       <tr>
                         <td>반품주소</td>
                         <td>{kokSellerInfo.kok_return_addr}</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               )}

               {/* 제품 상세 정보 표 */}
               {kokDetailInfo.length > 0 && (
                 <div>
                   <h4>제품 상세 정보</h4>
                   <table>
                     <tbody>
                       {kokDetailInfo.map((detail, index) => (
                         <tr key={index}>
                           <td>{detail.kok_detail_col}</td>
                           <td>{detail.kok_detail_val}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

              {/* API 데이터가 없는 경우 안내 메시지 */}
              {!kokSellerInfo && !kokDetailInfo.length && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  상세 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (kokLoading) {
    return (
      <Loading 
        message="상품 정보를 불러오는 중 ..." 
        containerStyle={{ height: '100vh' }}
      />
    );
  }

  if (!kokProduct) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        제품을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="kok-product-detail-page" style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <HeaderNavKokProductDetail 
        onBackClick={handleKokBack}
        onNotificationsClick={handleKokNotificationClick}
        onCartClick={handleKokCartClick}
      />
      
                    <div className="product-content">
                                   {/* 제품 이미지 또는 영상 */}
                    <div className="product-image-section" style={{ 
             marginBottom: '24px',
             width: '100%',
             maxWidth: '448px',
             minHeight: (() => {
               const fromHomeshopping = location.state?.fromHomeshopping;
               const streamUrl = location.state?.streamUrl || window.__LIVE_SRC__ || '';
               const broadcastStatus = location.state?.broadcastStatus;
               
               const isValidStreamUrl = streamUrl && 
                 streamUrl.trim() !== '' && 
                 streamUrl !== 'undefined' && 
                 streamUrl !== 'null' &&
                 (streamUrl.includes('http') || streamUrl.includes('m3u8') || streamUrl.includes('mp4'));
               
               const shouldShowVideo = fromHomeshopping && 
                 isValidStreamUrl && 
                 broadcastStatus?.status === 'live';
               
               const shouldShowStatusMessage = fromHomeshopping && 
                 (broadcastStatus?.status === 'upcoming' || broadcastStatus?.status === 'ended');
               
               // 홈쇼핑에서 넘어온 경우에만 최소 높이 설정
               return (shouldShowVideo || shouldShowStatusMessage) ? '200px' : 'auto';
             })(),
             position: 'relative',
             overflow: 'hidden'
           }}>
             
                                                       {/* 홈쇼핑에서 넘어온 경우 영상 표시 */}
                            {(() => {
                              const streamUrl = location.state?.streamUrl || window.__LIVE_SRC__ || '';
                              const fromHomeshopping = location.state?.fromHomeshopping;
                              const broadcastStatus = location.state?.broadcastStatus;
                              const thumbnailUrl = location.state?.thumbnailUrl;
                              
                              console.log('📺 콕 상품 상세 - 방송 상태 확인:', {
                                fromHomeshopping,
                                streamUrl,
                                broadcastStatus,
                                thumbnailUrl,
                                shouldShowVideo: fromHomeshopping && 
                                  streamUrl && 
                                  streamUrl.trim() !== '' && 
                                  streamUrl !== 'undefined' && 
                                  streamUrl !== 'null' &&
                                  (streamUrl.includes('http') || streamUrl.includes('m3u8') || streamUrl.includes('mp4')) &&
                                  broadcastStatus?.status === 'live'
                              });
                              
                              const isValidStreamUrl = streamUrl && 
                                streamUrl.trim() !== '' && 
                                streamUrl !== 'undefined' && 
                                streamUrl !== 'null' &&
                                (streamUrl.includes('http') || streamUrl.includes('m3u8') || streamUrl.includes('mp4'));
                              
                              // 방송 상태가 'live'이고 유효한 스트림 URL이 있을 때만 영상 표시
                              const shouldShowVideo = fromHomeshopping && 
                                isValidStreamUrl && 
                                broadcastStatus?.status === 'live';
                              
                              // 방송 예정이나 종료 상태일 때 메시지 표시
                              const shouldShowStatusMessage = fromHomeshopping && 
                                (broadcastStatus?.status === 'upcoming' || broadcastStatus?.status === 'ended');
                              
                              if (shouldShowVideo) {
                                return (
                                  <div className="video-popup-overlay" style={{
                                    width: '100%',
                                    height: '200px',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#000',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    zIndex: 10
                                  }}>
                                    {/* 비디오 플레이어 */}
                                    <div className="video-popup-player" style={{ flex: 1 }}>
                                      <LiveStreamPlayer
                                        src={streamUrl}
                                        autoPlay={true}
                                        muted={true}
                                        controls={true}
                                        width="100%"
                                        height="100%"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          borderRadius: '8px'
                                        }}
                                        onError={(error) => {
                                          console.error('홈쇼핑 영상 로드 실패:', error);
                                        }}
                                        onLoadStart={() => {
                                          console.log('🎬 라이브 스트림 로딩 시작:', streamUrl);
                                        }}
                                        onLoadedData={() => {
                                          console.log('🎬 라이브 스트림 로딩 완료:', streamUrl);
                                        }}
                                      />
                                    </div>
                                    
                                                                         {/* 헤더 정보 */}
                                     <div className="video-popup-header" style={{
                                       position: 'absolute',
                                       top: '0',
                                       left: '0',
                                       right: '0',
                                       background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
                                       color: 'white',
                                       padding: '16px',
                                       display: 'flex',
                                       justifyContent: 'flex-start',
                                       alignItems: 'center',
                                       border: 'none'
                                     }}>
                                      <div className="video-popup-info">
                                        <div className="video-popup-title" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                          <span className="video-popup-homeshopping" style={{width: '88px'}}>{location.state?.homeshoppingName || '홈쇼핑'}</span>
                                          <span className="video-popup-product">{location.state?.productName || '상품명'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                                                            } else if (shouldShowStatusMessage) {
                                return (
                                  <div className="video-popup-overlay" style={{
                                    width: '100%',
                                    height: '200px',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#000',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    zIndex: 10
                                  }}>
                                    {/* 썸네일 이미지 배경 */}
                                    {thumbnailUrl && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${thumbnailUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: 'brightness(0.3)'
                                      }} />
                                    )}
                                    
                                    {/* 방송 상태 메시지 오버레이 */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      color: 'white',
                                      textAlign: 'center',
                                      padding: '20px',
                                      zIndex: 2
                                    }}>
                                      <div style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        marginBottom: '8px'
                                      }}>
                                        {broadcastStatus?.text || '방송 정보 없음'}
                                      </div>
                                      <div style={{
                                        fontSize: '14px',
                                        opacity: 0.8
                                      }}>
                                        {broadcastStatus?.status === 'upcoming' ? '방송 시작을 기다려주세요' : '방송이 종료되었습니다'}
                                      </div>
                                    </div>
                                    
                                    {/* 헤더 정보 */}
                                    <div className="video-popup-header" style={{
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
                                      color: 'white',
                                      padding: '16px',
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      border: 'none',
                                      zIndex: 3
                                    }}>
                                     <div className="video-popup-info">
                                       <div className="video-popup-title" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                         <span className="video-popup-homeshopping" style={{width: '88px'}}>{location.state?.homeshoppingName || '홈쇼핑'}</span>
                                         <span className="video-popup-product">{location.state?.productName || '상품명'}</span>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               );
                              }
                              return null;
                            })()}
            
          </div>
                                                             {/* 상품 이미지는 항상 표시 */}
                               <img 
                                 src={kokProduct?.image}
                                 alt={kokProduct?.name || '상품 이미지'}
                                 style={{ 
                                   width: '100%', 
                                   height: '300px', 
                                   objectFit: 'cover',
                                   borderRadius: '8px',
                                   display: 'block',
                                   maxWidth: '100%',
                                   minHeight: '300px',
                                  marginBottom: '10px'
                                 }}
                                 onError={(e) => {
                                   console.error('이미지 로드 실패:', e.target.src);
                                 }}
                               />

        {/* 제품 정보 */}
        <div className="product-info" style={{ 
          marginBottom: '24px',
          width: '100%',
          maxWidth: '448px'
        }}>
          <h1 className="product-name" style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            {kokProduct.name}
          </h1>
          
          <div className="product-rating" style={{ marginBottom: '12px' }}>
            <span style={{ color: '#FA5F8C', fontSize: '16px', fontWeight: 'bold' }}>
              {renderKokStars(kokReviewStats ? kokReviewStats.kok_review_score : kokProduct.rating)}
            </span>
            <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
              {kokReviewStats ? kokReviewStats.kok_review_score : kokProduct.rating} ({kokReviewStats?.kok_review_cnt ?? kokProduct?.reviewCount ?? 0}개 리뷰)
            </span>
          </div>

          <div className="product-price" style={{ marginBottom: '0px' }}>
            {/* 원가 (위쪽 줄) */}
            <div style={{ marginBottom: '2px' }}>
              <span style={{ fontSize: '16px', color: '#999', textDecoration: 'line-through' }}>
                {kokProduct.originalPrice.toLocaleString()}원
              </span>
            </div>
            {/* 할인율과 할인가격 (아래쪽 줄) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '20px', 
                color: '#FA5F8C', 
                fontWeight: 'bold'
              }}>
                {kokProduct.discountRate}%
              </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#333'}}>
                {kokProduct.discountPrice.toLocaleString()}원
              </span>
              <span style={{ fontSize: '10px', color: '#999' }}>
                무료 배송
              </span>
                             <div 
                 className="heart-button"
                 style={{ 
                   width: '32px', 
                   height: '32px', 
                   marginLeft: '8px',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
                 onClick={handleKokWishlistClick}
               >
                 <img 
                   src={kokIsWishlisted ? filledHeartIcon : emptyHeartIcon}
                   alt="찜"
                   style={{ 
                     transition: 'transform 0.15s ease-in-out'
                   }}
                 />
               </div>
              <CartButton 
                productId={productId}
                size="30px"
                onClick={handleKokCartButtonClick}
                style={{ marginLeft: '0px' }}
              />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="kok-tab-navigation" style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '16px',
          marginTop: '-12px'
        }}>
          {[
            { key: 'description', label: '상품정보' },
            { 
              key: 'reviews', 
              label: `리뷰(${(kokReviewStats?.kok_review_cnt ?? kokProduct?.reviewCount ?? 0)}개)` 
            },
            { key: 'details', label: '상세정보' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`kok-tab-button ${kokActiveTab === tab.key ? 'active' : ''}`}
              onClick={() => setKokActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {renderKokTabContent()}
      </div>


      
      {/* 맨 위로 가기 버튼 */}
      <div style={{ position: 'relative' }}>
        <UpBtn />
      </div>
      
             {/* VideoPopUp - 제거됨 (상단에 고정 영상으로 대체) */}
      
      {/* 수량 선택 모달 */}
      {showQuantityModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: '#333'
              }}>
                수량 선택
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0
              }}>
                {kokProduct?.name}
              </p>
            </div>

            {/* 수량 선택 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => handleQuantityChange(Math.max(1, selectedQuantity - 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid #FA5F8C',
                  backgroundColor: 'white',
                  color: '#FA5F8C',
                  borderRadius: '50%',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                -
              </button>
              
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {selectedQuantity}
              </span>
              
              <button
                onClick={() => handleQuantityChange(selectedQuantity + 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid #FA5F8C',
                  backgroundColor: '#FA5F8C',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>

            {/* 총 가격 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 4px 0'
              }}>
                총 가격
              </p>
              <p style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#FA5F8C',
                margin: 0
              }}>
                {(kokProduct?.discountPrice * selectedQuantity).toLocaleString()}원
              </p>
            </div>

            {/* 버튼들 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* 주문하기 버튼 */}
              <button
                onClick={handleOrderNow}
                disabled={isAddingToCart}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  backgroundColor: isAddingToCart ? '#ccc' : '#FA5F8C',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isAddingToCart ? 'not-allowed' : 'pointer'
                }}
              >
                {isAddingToCart ? '주문 처리 중...' : '주문하기'}
              </button>
              
              {/* 하단 버튼들 */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={handleCloseQuantityModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    color: '#666',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '1px solid #FA5F8C',
                    backgroundColor: 'white',
                    color: '#FA5F8C',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isAddingToCart ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAddingToCart ? '추가 중...' : '장바구니 추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
             <BottomNav 
         productInfo={{
           productId: productId,
           discountPrice: kokProduct?.discountPrice,
           originalPrice: kokProduct?.originalPrice,
           discountRate: kokProduct?.discountRate,
           productName: kokProduct?.name,
           productImage: kokProduct?.image || kokProductImages[0]?.kok_img_url
         }}
       />
      
      {/* VideoPopUp 렌더링 */}
      {/* <VideoPopUp
        videoUrl={location.state?.streamUrl || ''}
        productName={location.state?.productName || kokProduct?.name || '상품명'}
        homeshoppingName={location.state?.homeshoppingName || '홈쇼핑'}
        kokProductId={productId}
        isVisible={showVideoPopup}
        onClose={() => setShowVideoPopup(false)}
        broadcastStatus={location.state?.broadcastStatus}
      /> */}
      
      {/* 커스텀 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={closeModal}
      />
      
      {/* 장바구니 중복 확인 모달 */}
      {showCartConfirmModal && (
        <ModalManager
          {...showConfirm(
            '이미 해당 상품이 장바구니에 있습니다.\n\n장바구니로 이동하시겠습니까?',
            '장바구니로 이동',
            '계속 쇼핑'
          )}
          onConfirm={handleCartConfirm}
          onCancel={handleCartCancel}
        />
      )}
    </div>
  );
};

export default KokProductDetail; 