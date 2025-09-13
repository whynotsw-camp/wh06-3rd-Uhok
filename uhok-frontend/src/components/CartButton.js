import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../pages/api';
import ModalManager, { showAlert, hideModal } from './LoadingModal';

import cartIcon from '../assets/icon-park-outline_weixin-market.png';

const CartButton = ({ 
  productId, 
  recipeId = 0, 
  quantity = 1, 
  size = '30px',
  onClick,
  className = '',
  style = {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });
  const navigate = useNavigate();

  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      
      // 입력 데이터 검증
      if (!productId) {
        setModalState(showAlert('상품 ID가 필요합니다.'));
        return;
      }
      
      if (quantity <= 0) {
        setModalState(showAlert('수량은 1개 이상이어야 합니다.'));
        return;
      }
      
      // 토큰 확인 (ensureToken 호출 제거)
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
        return;
      }

      // 요청 데이터 준비 (API 명세서에 맞춤 - 수량은 1개로 고정)
      const requestData = {
        kok_product_id: productId,
        kok_price_id: 0, // 기본값 0
        kok_quantity: 1, // 수량은 1개로 고정
        recipe_id: recipeId || 0
      };

      console.log('장바구니 추가 요청:', {
        url: '/api/kok/carts',
        data: requestData,
        token: token ? '토큰 있음' : '토큰 없음',
        timestamp: new Date().toISOString()
      });

      // 장바구니 추가 API 호출
      const response = await api.post('/api/kok/carts', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('장바구니 추가 성공:', response.data);
      
      // 성공 메시지 표시
      setModalState(showAlert('장바구니에 추가되었습니다!'));
      
      // 클릭 이벤트가 있으면 실행
      if (onClick) {
        onClick();
      }
      
    } catch (error) {
      console.error('장바구니 추가 실패:', {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      if (error.response?.status === 401) {
        setModalState(showAlert('로그인이 필요한 서비스입니다.'));
      } else if (error.response?.status === 409) {
        setModalState(showAlert('이미 장바구니에 있는 상품입니다.'));
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || '잘못된 요청입니다.';
        setModalState(showAlert(`요청 오류: ${errorMessage}`));
      } else if (error.response?.status === 500) {
        console.error('서버 내부 오류 상세:', error.response?.data);
        
        setModalState(showAlert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.<br><span class="sub-message">개발자 도구의 콘솔에서 자세한 오류 정보를 확인할 수 있습니다.</span>'));
      } else if (error.response?.status === 404) {
        setModalState(showAlert('API 엔드포인트를 찾을 수 없습니다.'));
      } else if (error.code === 'ECONNABORTED') {
        setModalState(showAlert('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.'));
      } else if (!error.response) {
        setModalState(showAlert('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'));
      } else {
        const errorMessage = error.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
        setModalState(showAlert(`장바구니 추가 실패: ${errorMessage}`));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <img 
        src={cartIcon}
        alt="장바구니"
        className={`cart-button ${className}`}
        style={{ 
          width: size, 
          height: size, 
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'transform 0.15s ease-in-out, opacity 0.2s ease',
          ...style
        }}
        onClick={isLoading ? undefined : handleAddToCart}
        title={isLoading ? '처리 중...' : '장바구니에 추가'}
      />
      
      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={closeModal}
      />
    </>
  );
};

export default CartButton;
