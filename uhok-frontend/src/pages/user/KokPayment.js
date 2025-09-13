// 콕 결제 페이지 - 결제 처리 및 결제 확인 기능 구현
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { kokApi } from '../../api/kokApi';
import { orderApi } from '../../api/orderApi';
import HeaderNavPayment from '../../layout/HeaderNavPayment';
import BottomNav from '../../layout/BottomNav';
import api from '../api';
import { checkBackendConnection } from '../../utils/authUtils';
import { performOrderStatusUpdate } from '../../utils/orderUpdateUtils';
import '../../styles/kok_payment.css';
// LoadingModal import
import ModalManager, { showLoginRequiredNotification, showAlert, hideModal } from '../../components/LoadingModal';

const KokPayment = () => {
  const [paymentMethod] = useState('card'); // 항상 신용카드만 사용
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, completed, failed
  const [orderInfo, setOrderInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ isVisible: false });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
    
    // 결제 완료 모달인 경우 주문내역으로 이동
    if (modalState.modalType === 'alert' && modalState.alertMessage === '결제가 완료되었습니다!') {
      navigate('/orderlist', { replace: true });
    }
    // 로그인 필요 모달인 경우에만 이전 페이지로 돌아가기
    else if (modalState.modalType === 'alert' && modalState.alertMessage === '로그인이 필요한 서비스입니다.') {
      window.history.back();
    }
  };

  // URL 파라미터나 state에서 주문 정보 가져오기
  useEffect(() => {
    const fetchOrderInfo = async () => {
      // 1. location.state에서 데이터 읽기 (우선순위 1)
      if (location.state?.fromCart) {
        // 장바구니에서 전달받은 할인 가격 정보 사용
        const orderInfoData = {
          kokOrderId: location.state.orderId || 'CART',
          orderId: location.state.orderId || 'CART',
          productName: location.state.productName || '장바구니 상품',
          quantity: location.state.cartItems?.reduce((total, item) => total + item.kok_quantity, 0) || 1,
          price: location.state.discountPrice || 29900,
          totalAmount: location.state.discountPrice || 29900,
          productId: 'CART',
                     productImage: location.state.productImage || null,
          // 장바구니 정보 추가
          fromCart: true,
          cartItems: location.state.cartItems,
          originalPrice: location.state.originalPrice
        };
        
        console.log('장바구니 주문 정보 설정 (location.state):', orderInfoData);
        console.log('장바구니 상품 이미지 (location.state):', orderInfoData.productImage);
        setOrderInfo(orderInfoData);
        return;
      }
      
      // 2. URL 파라미터에서 데이터 읽기 (우선순위 2)
      const urlParams = new URLSearchParams(location.search);
      const dataParam = urlParams.get('data');
      
      if (dataParam) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(dataParam));
          
          if (decodedData.fromCart) {
            // 장바구니에서 전달받은 할인 가격 정보 사용
            const orderInfoData = {
              kokOrderId: decodedData.orderId || 'CART',
              orderId: decodedData.orderId || 'CART',
              productName: decodedData.productName || '장바구니 상품',
              quantity: decodedData.cartItems?.reduce((total, item) => total + item.kok_quantity, 0) || 1,
              price: decodedData.discountPrice || 29900,
              totalAmount: decodedData.discountPrice || 29900,
              productId: 'CART',
                             productImage: decodedData.productImage || null,
              // 장바구니 정보 추가
              fromCart: true,
              cartItems: decodedData.cartItems,
              originalPrice: decodedData.originalPrice
            };
            
            console.log('장바구니 주문 정보 설정 (URL 파라미터):', orderInfoData);
            console.log('장바구니 상품 이미지 (URL 파라미터):', orderInfoData.productImage);
            setOrderInfo(orderInfoData);
            
            // location.state에도 저장 (UI 표시용)
            if (!location.state) {
              window.history.replaceState(decodedData, '');
            }
            
            return;
          }
        } catch (error) {
          console.error('URL 파라미터 파싱 실패:', error);
        }
      }
      
      // 3. 기존 location.state 처리 (우선순위 3)
      if (location.state?.orderInfo) {
        setOrderInfo(location.state.orderInfo);
      } else if (location.state?.fromCart === false && location.state?.productImage) {
        // 프로덕트 디테일에서 바로 결제로 넘어온 경우
        const orderInfoData = {
          kokOrderId: location.state.orderId || 'DETAIL',
          orderId: String(location.state.orderId || 'DETAIL'),
          productName: location.state.productName || '상품',
          quantity: 1,
          price: location.state.discountPrice || 29900,
          totalAmount: location.state.discountPrice || 29900,
          productId: String(location.state.orderId || 'DETAIL'),
          productImage: location.state.productImage,
          fromProductDetail: true
        };
        
        console.log('프로덕트 디테일 주문 정보 설정:', orderInfoData);
        console.log('프로덕트 디테일 상품 이미지:', orderInfoData.productImage);
        console.log('location.state 원본:', location.state);
        setOrderInfo(orderInfoData);
      } else if (location.state?.productId) {
        // 상품 상세페이지에서 전달받은 제품 ID로 실제 제품 정보를 API에서 가져오기
        const productId = location.state.productId;
        
        // 상품 상세페이지에서 전달받은 할인 가격 정보가 있는지 확인
        if (location.state.fromProductDetail && location.state.discountPrice) {
          // 전달받은 할인 가격 정보 사용
          const orderInfoData = {
            kokOrderId: productId,
            orderId: productId,
            productName: location.state.productName || `제품 ID: ${productId}`,
            quantity: 1,
            price: location.state.discountPrice,
            totalAmount: location.state.discountPrice,
            productId: productId,
            productImage: location.state.productImage || null // 상품 상세페이지에서 전달받은 이미지 사용
          };
          
          console.log('프로덕트 디테일 주문 정보 설정:', orderInfoData);
          console.log('프로덕트 디테일 상품 이미지:', orderInfoData.productImage);
          console.log('location.state.productImage 원본:', location.state.productImage);
          setOrderInfo(orderInfoData);
        } else {
          try {
            // 제품 기본 정보 가져오기
            const productInfo = await api.get(`/api/kok/product/${productId}/info`);
            
            if (productInfo.data) {
              const product = productInfo.data;
              
              console.log('API에서 가져온 제품 정보:', product);
              
              // 제품 메인 이미지 가져오기 (제품 기본 정보에서 메인 이미지 사용)
              let productImage = null;
              
              // 제품 기본 정보에서 메인 이미지 필드 확인 (제품 상세페이지와 동일한 우선순위)
              if (product.kok_thumbnail) {
                // 제품 상세페이지에서 사용하는 썸네일 이미지 우선 사용
                productImage = product.kok_thumbnail;
                console.log('kok_thumbnail 사용:', productImage);
              } else if (product.kok_product_image) {
                productImage = product.kok_product_image;
                console.log('kok_product_image 사용:', productImage);
              } else if (product.image) {
                productImage = product.image;
                console.log('image 사용:', productImage);
              } else if (product.kok_img_url) {
                productImage = product.kok_img_url;
                console.log('kok_img_url 사용:', productImage);
              } else {
                // 메인 이미지가 없으면 이미지 탭 API에서 첫 번째 이미지 사용 (폴백)
                console.log('기본 이미지 필드가 없어서 이미지 탭 API 시도');
                try {
                  const imageResponse = await api.get(`/api/kok/product/${productId}/tabs`);
                  if (imageResponse.data && imageResponse.data.images && imageResponse.data.images.length > 0) {
                    productImage = imageResponse.data.images[0].kok_img_url;
                    console.log('이미지 탭 API에서 가져온 이미지:', productImage);
                  }
                } catch (imageError) {
                  console.log('제품 이미지 로드 실패, 기본 이미지 사용:', imageError);
                }
              }
              
              // 할인된 가격 또는 원래 가격 사용
              const finalPrice = product.kok_product_discounted_price || 
                                product.kok_product_final_price || 
                                product.kok_product_price || 
                                29900;
              
              const orderInfoData = {
                kokOrderId: productId,
                orderId: productId,
                productName: product.kok_product_name || `제품 ID: ${productId}`,
                quantity: 1,
                price: finalPrice,
                totalAmount: finalPrice,
                productId: productId,
                productImage: productImage
              };
              
              console.log('API 주문 정보 설정:', orderInfoData);
              console.log('API 상품 이미지:', orderInfoData.productImage);
              setOrderInfo(orderInfoData);
            } else {
              // API 실패 시 기본 정보로 설정
              setOrderInfo({
                kokOrderId: productId,
                orderId: productId,
                productName: `제품 ID: ${productId}`,
                quantity: 1,
                price: 29900,
                totalAmount: 29900,
                productId: productId
              });
            }
          } catch (error) {
            console.error('제품 정보 API 호출 실패:', error);
            // API 실패 시 기본 정보로 설정
            setOrderInfo({
              kokOrderId: productId,
              orderId: productId,
              productName: `제품 ID: ${productId}`,
              quantity: 1,
              price: 29900,
              totalAmount: 29900,
              productId: productId
            });
          }
        }
      } else {
        // 기본 주문 정보 (실제로는 API에서 가져와야 함)
        setOrderInfo({
          kokOrderId: '12345',
          orderId: 'ORD-001',
          productName: '테스트 상품',
          quantity: 1,
          price: 29900,
          totalAmount: 29900
        });
      }
    };

    fetchOrderInfo();
    
    // 테스트용 기본 카드 정보 설정
    setCardNumber('1234 5678 9012 3456');
    setExpiryDate('12/25');
    setCvv('123');
    setCardHolderName('홍길동');
  }, [location]);

  // 결제 처리 함수 (비동기) - 3단계 프로세스: 주문 생성 + 결제 확인 + 결제 요청 응답 확인 (v2 롱폴링+웹훅)
  const handlePayment = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    let orderId; // 변수를 try 블록 밖에서 선언
    let updatedOrderInfo; // 변수를 상위 스코프에서 선언
     
    try {
      // 백엔드 서버 연결 상태 확인
      console.log('🔍 백엔드 서버 연결 상태 확인 중...');
      const backendStatus = await checkBackendConnection();
      
      console.log('✅ 백엔드 서버 연결 확인됨:', backendStatus);
      
             // 모의 응답 제거 - 백엔드 서버 연결 실패 시 바로 에러 처리
       if (backendStatus.isMock) {
         console.log('🔄 백엔드 서버 연결 실패 - 모의 응답 제거됨');
         throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
       }
      
      // 개발 환경에서는 백엔드 연결 실패를 허용하고 계속 진행
      if (!backendStatus.connected && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 개발 환경에서 백엔드 서버 연결 실패 - 모의 모드로 진행');
        console.warn('실제 결제 처리는 백엔드 서버가 필요합니다.');
      } else if (!backendStatus.connected) {
        throw new Error(`백엔드 서버에 연결할 수 없습니다: ${backendStatus.error}`);
      }
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setModalState(showLoginRequiredNotification());
        return;
      }

      // ===== 1단계: 주문 생성 =====
      console.log('🚀 1단계: 주문 생성 시작');
      console.log('🔍 API 호출: POST /api/orders/kok/carts/order 또는 /api/orders/kok/order');
       
       if (orderInfo?.fromCart && orderInfo?.cartItems) {
                 // 장바구니에서 온 주문인 경우
                 const selectedItems = orderInfo.cartItems.map(item => ({
          kok_cart_id: item.kok_cart_id, // 백엔드 API 스펙에 맞게 kok_cart_id 사용
          quantity: item.kok_quantity
        }));
        
        const requestData = {
          selected_items: selectedItems
        };
        
        console.log('🔍 장바구니 주문 요청 데이터:', requestData);
        console.log('🔍 장바구니 아이템 상세:', orderInfo.cartItems);
        
                 let orderResponse;
         try {
           // 장바구니 주문의 경우 유효성 검증을 건너뛰고 직접 주문 생성
           console.log('🛒 1단계-장바구니: 장바구니 주문 생성 시작');
          
          // 토큰 확인
          const token = localStorage.getItem('access_token');
          if (!token) {
            setModalState(showLoginRequiredNotification());
            return;
          }
          
          // 직접 API 호출 (유효성 검증 없이)
          orderResponse = await api.post('/api/orders/kok/carts/order', requestData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
                     console.log('✅ 1단계-장바구니: 장바구니 주문 생성 성공:', orderResponse.data);
           orderId = orderResponse.data.order_id;
          
                 } catch (orderError) {
           console.error('❌ 1단계-장바구니: 장바구니 주문 생성 실패:', orderError);
          
                     // 백엔드 서버 연결 실패 시 바로 에러 처리 (모의 응답 제거)
           if (orderError.response?.status === 500 || orderError.code === 'ERR_NETWORK' || orderError.response?.status === 404) {
             console.error('❌ 백엔드 서버 연결 실패:', orderError);
             throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
           } else {
            // 다른 에러들
            if (orderError.response?.status === 422) {
              console.error('❌ 422 유효성 검증 에러:', orderError.response.data);
              setErrorMessage(`주문 데이터가 올바르지 않습니다: ${orderError.response.data?.message || '알 수 없는 오류'}`);
            } else {
              setErrorMessage(`주문 생성 실패: ${orderError.message}`);
            }
            setPaymentStatus('failed');
            return;
          }
        }
        
        // orderId 검증
        if (!orderId) {
          throw new Error('주문 생성 후 주문 ID를 받지 못했습니다.');
        }
        
        console.log('🔍 생성된 orderId:', orderId);
        console.log('🔍 orderId 타입:', typeof orderId);
        
        // 주문 정보 업데이트 (order_details에서 kok_order_id들 추출)
        const orderDetails = orderResponse.order_details || [];
        const kokOrderIds = orderDetails.map(detail => detail.kok_order_id);
        
        console.log('🔍 추출된 kok_order_id들:', kokOrderIds);
        
        // 상태 업데이트와 함께 로컬 변수로도 저장 (즉시 사용하기 위해)
        updatedOrderInfo = {
          ...orderInfo,
          orderId: orderId,
          totalAmount: orderResponse.total_amount,
          kokOrderIds: kokOrderIds,  // 실제 kok_order_id들 저장
          orderDetails: orderDetails
        };
        
        setOrderInfo(updatedOrderInfo);
                   } else {
        // 단일 상품 주문인 경우 (상품 상세에서 바로 주문)
        console.log('🔍 단일 상품 주문 - 이미 생성된 주문 정보 사용');
        console.log('🔍 주문 정보 상세:', orderInfo);
        console.log('🔍 orderId 확인:', orderInfo?.orderId);
        console.log('🔍 kokOrderIds 확인:', orderInfo?.kokOrderIds);
        console.log('🔍 kokOrderId 확인:', orderInfo?.kokOrderId);
        
        // 이미 제품 상세 페이지에서 주문이 생성되었으므로, 기존 주문 정보 사용
        if (orderInfo?.orderId) {
          console.log('✅ 기존 주문 정보 사용:', {
            orderId: orderInfo.orderId,
            kokOrderIds: orderInfo.kokOrderIds || []
          });
          
          orderId = orderInfo.orderId;
          updatedOrderInfo = orderInfo;
        } else {
          // 주문 정보가 없는 경우 에러 처리
          console.error('❌ 주문 정보가 없습니다:', orderInfo);
          throw new Error('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        }
        
        setOrderInfo(updatedOrderInfo);
      }

             if (!orderId) {
         throw new Error('주문 ID를 받지 못했습니다.');
       }

       // ===== 2단계: 결제 확인 =====
       console.log('🚀 2단계: 결제 확인 시작');
       console.log('⏳ 주문 생성 완료, 잠시 대기 중...');
       await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

       // 사용자 정보 확인 (권한 진단용)
       console.log('🔍 사용자 정보 확인 중...');
       try {
         const userInfo = await api.get('/api/user/info');
         console.log('✅ 현재 로그인한 사용자 정보:', userInfo.data);
       } catch (userError) {
         console.error('❌ 사용자 정보 조회 실패:', userError);
         throw new Error('사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
       }

               // ===== 3단계: 결제 요청 응답 확인 (v2 롱폴링+웹훅) =====
        console.log('🚀 3단계: 결제 요청 응답 확인 시작 (v2 롱폴링+웹훅)');
        console.log('🔍 API 호출: POST /api/orders/payment/{order_id}/confirm/v2');
        console.log('🔍 사용할 orderId:', orderId);
        console.log('🔍 orderId 타입:', typeof orderId);
        console.log('🔍 orderId 값 검증:', orderId);
      
      // orderId 유효성 검증
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        throw new Error('유효하지 않은 주문 ID입니다. 주문을 다시 생성해주세요.');
      }
      
      // 토큰 재확인 및 디버깅
      const currentToken = localStorage.getItem('access_token');
      console.log('🔍 현재 토큰 상태:', {
        hasToken: !!currentToken,
        tokenLength: currentToken?.length,
        tokenStart: currentToken?.substring(0, 20) + '...',
        tokenEnd: currentToken?.substring(currentToken.length - 20)
      });
      
      if (!currentToken) {
        setModalState(showLoginRequiredNotification());
        return;
      }
      
      // 토큰 만료 확인
      try {
        const tokenParts = currentToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < currentTime;
          
          console.log('🔍 토큰 정보:', {
            exp: payload.exp,
            currentTime: currentTime,
            isExpired: isExpired,
            userId: payload.sub || payload.user_id
          });
          
          if (isExpired) {
            throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
          }
        }
      } catch (tokenError) {
        console.error('토큰 파싱 오류:', tokenError);
        throw new Error('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
      }
      
      // 결제 확인 API 호출 전 최종 검증
      console.log('🔍 결제 확인 API 호출 전 최종 검증:', {
        orderId: orderId,
        orderIdType: typeof orderId,
        orderIdValid: !!orderId && orderId !== 'undefined' && orderId !== 'null',
        tokenValid: !!currentToken
      });
      
            // 백엔드 결제 확인 요청 (v2 롱폴링+웹훅 방식 사용)
      console.log('🚀 3단계: 백엔드 결제 확인 요청 시작 (v2 롱폴링+웹훅)');
      const paymentResponse = await orderApi.confirmPaymentV2(orderId);
      
      console.log('✅ 3단계: 백엔드 결제 확인 응답 수신 완료:', paymentResponse);

      // 결제 상태 확인 - 결제가 성공한 경우에만 주문 내역에 저장
              console.log('🔍 3단계: 결제 응답 상세 분석 (v2):', {
        hasResponse: !!paymentResponse,
        status: paymentResponse?.status,
        paymentId: paymentResponse?.payment_id,
        orderId: paymentResponse?.order_id,
        kok_order_ids: paymentResponse?.kok_order_ids,
        kok_order_ids_타입: typeof paymentResponse?.kok_order_ids,
        kok_order_ids_길이: paymentResponse?.kok_order_ids?.length,
        hs_order_id: paymentResponse?.hs_order_id,
        tx_id: paymentResponse?.tx_id,
        order_id_internal: paymentResponse?.order_id_internal,
        전체_응답: JSON.stringify(paymentResponse, null, 2)
      });
      
      // 백엔드 결제 확인 응답 처리 (v2 롱폴링+웹훅 방식)
      if (paymentResponse && paymentResponse.status === 'PENDING') {
        // PENDING 상태: 백엔드에서 웹훅으로 완료 신호 대기
        console.log('⏳ 3단계: 결제 PENDING 상태 - 백엔드 웹훅 완료 신호 대기');
        console.log('🔍 PENDING 상태 상세:', {
          tx_id: paymentResponse.tx_id,
          order_id_internal: paymentResponse.order_id_internal,
          payment_id: paymentResponse.payment_id
        });
        
        // PENDING 상태를 "진행중"으로 처리
        setPaymentStatus('processing');
        setErrorMessage('결제가 진행 중입니다. 백엔드에서 완료 신호를 기다리고 있습니다. 잠시 후 주문 내역에서 확인해주세요.');
        
        // PENDING 상태에서는 백엔드에서 웹훅으로 상태를 업데이트하므로
        // 프론트엔드에서 자동 상태 업데이트를 호출하지 않음
        console.log('⚠️ PENDING 상태 - 프론트엔드에서 자동 상태 업데이트 호출하지 않음');
        console.log('⚠️ 백엔드에서 웹훅으로 완료 신호를 보낼 때까지 대기');
        console.log('⚠️ 현재 백엔드에서 롱폴링 API가 구현되지 않음');
        
        // 실제 환경에서는 여기서 롱폴링이나 WebSocket 연결을 시작해야 함
        // 현재는 백엔드 구현이 완료될 때까지 대기 상태로 유지
        console.log('🔄 백엔드 롱폴링 API 구현 대기 중...');
        
        // 개발 환경에서만 임시로 5초 후 사용자에게 안내
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            console.log('⚠️ 개발 환경: 백엔드 롱폴링 API 미구현으로 인한 임시 처리');
            setPaymentStatus('processing');
            setErrorMessage('개발 환경: 백엔드 롱폴링 API가 구현되지 않았습니다. 실제 환경에서는 백엔드에서 완료 신호를 보낼 때까지 대기합니다.');
          }, 5000);
        }
        
      } else if (paymentResponse && (paymentResponse.status === 'COMPLETED' || paymentResponse.status === 'PAYMENT_COMPLETED')) {
        // 즉시 완료된 경우 (기존 로직)
        console.log('✅ 3단계: 결제 즉시 완료 확인됨 - 자동 상태 업데이트 시작');
        
        // ===== 3-1단계: 자동 상태 업데이트 =====
        console.log('🚀 3-1단계: 자동 상태 업데이트 시작');
        
        try {
          // 백엔드 결제 응답의 모든 주문 ID를 포함한 업데이트된 주문 정보 생성 (v2)
          const orderInfoWithPaymentResponse = {
            ...updatedOrderInfo,
            kok_order_ids: paymentResponse?.kok_order_ids || [], // 백엔드 응답의 kok_order_ids 우선 사용
            hs_order_id: paymentResponse?.hs_order_id || 0, // 백엔드 응답의 hs_order_id 추가 (v2에서는 0)
            payment_id: paymentResponse?.payment_id,
            payment_status: paymentResponse?.status,
            payment_amount: paymentResponse?.payment_amount,
            payment_method: paymentResponse?.method,
            confirmed_at: paymentResponse?.confirmed_at,
            tx_id: paymentResponse?.tx_id, // v2에서 추가된 tx_id (밑줄 보존)
            order_id_internal: paymentResponse?.order_id_internal // v2에서 추가된 order_id_internal
          };
          
          console.log('🔍 백엔드 결제 응답 포함된 주문 정보:', orderInfoWithPaymentResponse);
          
          // 통일된 주문 상태 업데이트 함수 사용
          const updateResult = await performOrderStatusUpdate(orderInfoWithPaymentResponse);
          
          if (updateResult.success) {
            console.log(`✅ 3-1단계: 자동 상태 업데이트 완료 - 성공: ${updateResult.successfulCount}개, 실패: ${updateResult.failedCount}개`);
            
            if (updateResult.failedCount > 0) {
              console.warn(`⚠️ ${updateResult.failedCount}개의 상태 업데이트가 실패했지만 결제는 성공으로 처리됩니다.`);
            }
          } else {
            console.error('❌ 3-1단계: 자동 상태 업데이트 실패:', updateResult.error);
            console.log('⚠️ 상태 업데이트 실패했지만 결제는 성공으로 처리됩니다.');
          }
        } catch (updateError) {
          // 상태 업데이트 실패는 로그만 남기고 결제는 성공으로 처리
          console.error('❌ 3-1단계: 자동 상태 업데이트 실패:', updateError);
          console.log('⚠️ 상태 업데이트 실패했지만 결제는 성공으로 처리됩니다.');
        }

        // ===== 4단계: 결제 완료 처리 =====
        console.log('🚀 4단계: 결제 완료 처리 시작');
        setPaymentStatus('completed');
        setModalState(showAlert('결제가 완료되었습니다!'));
        
        // 결제 완료 모달 표시 - 사용자가 확인 버튼을 눌러야 주문내역으로 이동
        console.log('🚀 4단계: 결제 완료 모달 표시 - 확인 버튼 대기 중');
        
      } else {
        // 실제 실패 상태인 경우만 실패로 처리
        console.log('❌ 3단계: 결제 실패 - 주문 내역에 저장하지 않음');
        console.log('❌ 3단계: 결제 실패 상세:', {
          paymentResponse: paymentResponse,
          responseType: typeof paymentResponse,
          status: paymentResponse?.status
        });
        setPaymentStatus('failed');
        setErrorMessage('결제가 실패했습니다. 다시 시도해주세요.');
        
        // 백엔드에서 결제 실패 시 주문 상태를 관리하도록 함
        console.log('⚠️ 결제 실패 - 백엔드에서 주문 상태 관리 필요');
      }

    } catch (error) {
      console.error('❌ 결제 처리 실패:', error);
      console.error('❌ 에러 응답 데이터:', error.response?.data);
      console.error('❌ 에러 상태 코드:', error.response?.status);
      setPaymentStatus('failed');
      
             // 백엔드 서버 연결 실패 오류 처리
       if (error.message && error.message.includes('백엔드 서버에 연결할 수 없습니다')) {
         setErrorMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
         return;
       }
      
      // API 오류 메시지 처리
      if (error.response?.status === 401) {
        setModalState(showLoginRequiredNotification());
      } else if (error.response?.status === 422) {
        const errorDetails = error.response.data?.message || error.response.data?.error || '데이터 형식이 올바르지 않습니다.';
        setErrorMessage(`주문 생성 실패: ${errorDetails}`);
        console.error('❌ 422 에러 상세:', error.response.data);
        
        // 필드 누락 에러 상세 분석
        if (error.response.data?.detail && Array.isArray(error.response.data.detail)) {
          error.response.data.detail.forEach((err, index) => {
            console.error(`❌ 필드 에러 ${index + 1}:`, {
              type: err.type,
              location: err.loc,
              message: err.msg,
              input: err.input
            });
          });
        }
      } else if (error.response?.status === 400) {
        // 400 에러 - 장바구니 항목 유효성 문제
        const errorDetail = error.response.data?.detail || error.response.data?.message || '잘못된 요청입니다.';
        
        if (errorDetail.includes('장바구니') || errorDetail.includes('삭제') || errorDetail.includes('존재하지 않') || errorDetail.includes('유효하지 않습니다')) {
          setErrorMessage(`장바구니 상태 오류: ${errorDetail}\n\n해결 방법:\n1. 장바구니로 돌아가서 상품을 다시 확인해주세요.\n2. 선택한 상품이 여전히 장바구니에 있는지 확인해주세요.\n3. 상품 수량이 변경되지 않았는지 확인해주세요.\n4. 페이지를 새로고침한 후 다시 시도해주세요.`);
        } else {
          setErrorMessage('결제 처리에 실패했습니다: ' + errorDetail);
        }
      } else if (error.response?.status === 403) {
        // 403 에러 - 권한 없음
        console.log('결제 권한이 없음');
        const errorDetail = error.response.data?.detail || '해당 주문에 대한 권한이 없습니다.';
        
        // 403 오류 상세 분석
        console.error('❌ 403 권한 오류 상세:', {
          errorDetail: errorDetail,
          orderId: orderId,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          requestData: error.config?.data,
          responseData: error.response?.data
        });
        
        // 사용자에게 더 구체적인 안내
        let userMessage = `결제 권한 오류: ${errorDetail}`;
        if (errorDetail.includes('권한이 없습니다')) {
          userMessage += '\n\n해결 방법:\n1. 로그아웃 후 다시 로그인해주세요.\n2. 본인이 생성한 주문인지 확인해주세요.\n3. 주문이 아직 결제 가능한 상태인지 확인해주세요.\n4. 백엔드 서버가 정상적으로 실행 중인지 확인해주세요.';
        }
        
        // 개발자용 디버깅 정보 추가
        if (process.env.NODE_ENV === 'development') {
          userMessage += `\n\n[개발자 정보]\n주문 ID: ${orderId}\n요청 URL: ${error.config?.url}`;
        }
        
        setErrorMessage(userMessage);
      } else if (error.response?.status === 404) {
        // 404 에러 - 결제 API 엔드포인트가 존재하지 않음
        console.log('결제 API 엔드포인트가 존재하지 않음');
        setErrorMessage('결제 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.data?.message) {
        setErrorMessage(`결제 처리 실패: ${error.response.data.message}`);
      } else if (error.message) {
        setErrorMessage(`결제 처리 실패: ${error.message}`);
      } else {
        setErrorMessage('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 결제 확인 처리 함수 (비동기)
  const handlePaymentConfirmation = async () => {
    try {
      let confirmationResult;

      // 장바구니에서 온 주문인 경우
      if (orderInfo?.fromCart && orderInfo?.orderId) {
        try {
          // 주문 단위 결제 확인 시도
          confirmationResult = await kokApi.confirmOrderUnitPayment(orderInfo.orderId);
          
          if (confirmationResult.success) {
            setPaymentStatus('completed');
            setModalState(showAlert('결제가 완료되었습니다!'));
            navigate('/mypage');
            return;
          }
        } catch (error) {
          console.log('주문 단위 결제 확인 실패, 단건 결제 확인 시도...');
        }
      }

      // 단건 결제 확인 시도
      if (orderInfo?.kokOrderId) {
        try {
          confirmationResult = await kokApi.confirmKokPayment(orderInfo.kokOrderId);
          
          if (confirmationResult.success) {
            setPaymentStatus('completed');
            setModalState(showAlert('결제가 완료되었습니다!'));
            navigate('/mypage');
            return;
          }
        } catch (error) {
          console.log('단건 결제 확인 실패:', error);
        }
      }

      // 결제 확인 성공 처리
      if (confirmationResult?.success) {
        setPaymentStatus('completed');
        setModalState(showAlert('결제가 완료되었습니다!'));
        navigate('/mypage');
        return;
      }

      // 결제 확인 실패
      setPaymentStatus('failed');
      setErrorMessage(confirmationResult?.message || '결제 확인에 실패했습니다.');

    } catch (error) {
      console.error('결제 확인 처리 실패:', error);
      setPaymentStatus('failed');
      setErrorMessage('결제 확인 처리 중 오류가 발생했습니다.');
    }
  };

  // 결제 폼 유효성 검사
  const validatePaymentForm = () => {
    if (paymentMethod === 'card') {
      if (!cardNumber.trim()) {
        setModalState(showAlert('카드 번호를 입력해주세요.'));
        return false;
      }
      if (!expiryDate.trim()) {
        setModalState(showAlert('만료일을 입력해주세요.'));
        return false;
      }
      if (!cvv.trim()) {
        setModalState(showAlert('CVV를 입력해주세요.'));
        return false;
      }
      if (!cardHolderName.trim()) {
        setModalState(showAlert('카드 소유자명을 입력해주세요.'));
        return false;
      }
    }
    
    return true;
  };

  // 카드 번호 포맷팅
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // 만료일 포맷팅
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="payment-page">
      {/* 주문 결제 헤더 네비게이션 */}
      <HeaderNavPayment 
        onBackClick={handleBack}
      />
      
      <div className="payment-content">        
        <div className="order-summary">
          
          {orderInfo && (
            <div className="order-summary-items">
              {/* 장바구니에서 넘어온 경우 각 상품을 개별적으로 표시 */}
              {orderInfo.fromCart && orderInfo.cartItems ? (
                <div className="cart-items-individual">
                  <h4 style={{ marginBottom: '20px', fontSize: '18px', color: '#212529', fontWeight: '600' }}>
                    선택된 상품들 ({orderInfo.cartItems.length}개)
                  </h4>
                  
                  {/* 판매자별로 상품 그룹화 */}
                  {(() => {
                    // 판매자별로 상품 그룹화
                    const groupedByStore = {};
                    orderInfo.cartItems.forEach(item => {
                      const storeName = item.kok_store_name || '콕';
                      if (!groupedByStore[storeName]) {
                        groupedByStore[storeName] = [];
                      }
                      groupedByStore[storeName].push(item);
                    });

                    return Object.entries(groupedByStore).map(([storeName, items]) => (
                      <div key={storeName} className="store-group">
                        {/* 판매자 정보 헤더 */}
                        <div className="store-header">
                          <div className="store-info">
                            <div className="store-details">
                              <span className="store-name">{storeName}</span>
                              <span className="delivery-info">
                                <span className="delivery-icon">
                                  <img src={require('../../assets/delivery_icon.png')} alt="배송" />
                                </span>
                                무료배송
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 해당 판매자의 상품들 */}
                        {items.map((item, index) => (
                          <div key={item.kok_cart_id || index} className="cart-item-individual">
                            <div className="item-content-container">
                              <div className="item-image-container">
                                {item.kok_thumbnail ? (
                                  <img 
                                    src={item.kok_thumbnail} 
                                    alt={item.kok_product_name} 
                                    className="item-image" 
                                    onError={(e) => {
                                      console.log('장바구니 이미지 로드 실패:', item.kok_thumbnail);
                                      e.target.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('장바구니 이미지 로드 성공:', item.kok_thumbnail);
                                    }}
                                  />
                                ) : (
                                  <div className="item-image-placeholder">
                                    <span>이미지 없음</span>
                                  </div>
                                )}
                              </div>
                              <div className="item-details">
                                <h5 className="item-name">{item.kok_product_name}</h5>
                                
                                {/* 옵션 정보 (수량) */}
                                <div className="item-option">
                                  옵션: 수량 {item.kok_quantity}개
                                </div>
                                
                                {/* 가격 및 수량 */}
                                <div className="item-price-quantity">
                                  <span className="item-price">₩{item.kok_discounted_price?.toLocaleString() || '0'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                /* 단일 상품인 경우 기존 방식으로 표시 */
                <div className="order-item">
                  {orderInfo.productImage ? (
                    <img 
                      src={orderInfo.productImage} 
                      alt="상품" 
                      className="product-image" 
                      onError={(e) => {
                        console.log('이미지 로드 실패:', orderInfo.productImage);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', orderInfo.productImage);
                      }}
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>이미지 없음</span>
                    </div>
                  )}
                  <div className="product-info">
                    <h3>{orderInfo.productName}</h3>
                    <p>수량: {orderInfo.quantity}개</p>
                    <p className="price">₩{orderInfo.price.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="total">
            <span>총 결제금액:</span>
            <span className="total-price">
              ₩{orderInfo?.totalAmount?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="payment-methods">
          <h2>결제 방법</h2>
          <div className="method-options">
            <div className="method-option selected">
              <span>신용카드</span>
            </div>
          </div>
        </div>

        <div className="card-form">
            <h2>카드 정보</h2>
            <div className="form-group">
              <label>카드 번호</label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                disabled={isProcessing}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>만료일</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength="3"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="form-group">
              <label>카드 소유자명</label>
              <input
                type="text"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                placeholder="홍길동"
                disabled={isProcessing}
              />
            </div>
          </div>

        {/* 에러 메시지 표시 */}
        {errorMessage && (
          <div className="error-message">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* 결제 상태 표시 */}
        {paymentStatus === 'processing' && (
          <div className="payment-status processing">
            <p>결제 처리 중입니다. 잠시만 기다려주세요...</p>
          </div>
        )}

        {paymentStatus === 'completed' && (
          <div className="payment-status completed">
            <p>결제가 성공적으로 완료되었습니다!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="payment-status failed">
            <p>결제 처리에 실패했습니다.</p>
          </div>
        )}

        {/* 결제하기 버튼은 BottomNav에서 처리하므로 여기서는 제거 */}
      </div>
      
      <BottomNav handlePayment={handlePayment} modalState={modalState} setModalState={setModalState} />
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default KokPayment;
