import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homeshopping_kokrecommendation.css';
import kokLogo from '../assets/kokshoppingmall_logo.png';
import emptyHeartIcon from '../assets/heart_empty.png';
import filledHeartIcon from '../assets/heart_filled.png';
import api from '../pages/api';

const HomeshoppingKokRecommendation = ({ kokRecommendations, onKokProductClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wishlistedProducts, setWishlistedProducts] = useState(new Set()); // 찜된 상품 ID들을 저장
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 찜 상태 초기화
  useEffect(() => {
    initializeWishlistStatus();
  }, []);

  // 디버깅을 위한 로그 추가
  console.log('🔍 HomeshoppingKokRecommendation 렌더링:', {
    kokRecommendations,
    length: kokRecommendations?.length,
    isExpanded
  });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    console.log('🔄 토글 상태 변경:', !isExpanded);
  };

  // 찜 상태 초기화 함수
  const initializeWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // 사용자의 찜한 콕 상품 목록 가져오기
      const response = await api.get('/api/kok/likes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.liked_products) {
        const likedProductIds = new Set(response.data.liked_products.map(product => product.kok_product_id));
        setWishlistedProducts(likedProductIds);
        console.log('콕 찜 상태 초기화 완료:', likedProductIds.size, '개 상품');
      }
    } catch (error) {
      console.error('콕 찜 상태 초기화 실패:', error);
    }
  };

  const handleKokProductClick = (kokProductId) => {
    console.log('🖱️ 콕 상품 클릭:', kokProductId);
    if (onKokProductClick) {
      onKokProductClick(kokProductId);
    } else {
      navigate(`/kok/product/${kokProductId}`);
    }
  };

  // 찜 토글 함수 (콕 상품용)
  const handleHeartToggle = async (kokProductId, event) => {
    event.stopPropagation(); // 상품 클릭 이벤트 방지
    
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('토큰이 없어서 로그인 필요 팝업 표시');
        alert('로그인이 필요한 서비스입니다.');
        return;
      }

      // 찜 토글 API 호출
      const requestPayload = { kok_product_id: kokProductId };
      
      const response = await api.post('/api/kok/likes/toggle', requestPayload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('콕 찜 토글 응답:', response.data);

      // 찜 토글 성공 후 백엔드 응답에 따라 상태 업데이트
      if (response.data) {
        console.log('콕 찜 토글 성공! 백엔드 응답에 따라 상태를 업데이트합니다.');
        
        // 백엔드 응답의 liked 상태에 따라 찜 상태 업데이트
        const isLiked = response.data.liked;
        
        setWishlistedProducts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            // 백엔드에서 찜된 상태로 응답
            newSet.add(kokProductId);
            console.log('✅ 콕 찜이 추가되었습니다. 채워진 하트로 변경됩니다.');
          } else {
            // 백엔드에서 찜 해제된 상태로 응답
            newSet.delete(kokProductId);
            console.log('❌ 콕 찜이 해제되었습니다. 빈 하트로 변경됩니다.');
          }
          return newSet;
        });
        
        // 애니메이션 효과 추가
        const heartButton = event.currentTarget;
        if (heartButton) {
          heartButton.style.transform = 'scale(1.2)';
          setTimeout(() => {
            heartButton.style.transform = 'scale(1)';
          }, 150);
        }
      }
    } catch (err) {
      console.error('콕 찜 토글 실패:', err);
      
      // 401 에러 (인증 실패) 시 제자리에 유지
      if (err.response?.status === 401) {
        alert('로그인이 필요한 서비스입니다.');
        return;
      }
      
      // 다른 에러의 경우 사용자에게 알림
      alert('찜 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 데이터가 없거나 빈 배열인 경우에도 기본 메시지 표시
  if (!kokRecommendations || kokRecommendations.length === 0) {
    return (
      <div className="homeshopping-kokrecom-container">
        <div className="kokrecom-toggle-section">
          <button 
            className="kokrecom-toggle-button"
            onClick={handleToggle}
          >
            <div className="kok-logo-text-container">
              <img src={kokLogo} alt="콕" className="kok-logo" />
              <span className="toggle-text">에서 비슷한 상품을 팔고 있어요!</span>
            </div>
            <svg 
              className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <path 
                d="M7 10L12 15L17 10" 
                stroke="#838383" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="kokrecom-content">
            
            <div className="no-recommendations">
              <p>현재 추천할 콕 상품이 없습니다.</p>
              <p>곧 새로운 추천 상품을 준비하겠습니다.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="homeshopping-kokrecom-container">
      {/* 토글 버튼 */}
      <div className="kokrecom-toggle-section">
        <button 
          className="kokrecom-toggle-button"
          onClick={handleToggle}
        >
          <div className="kok-logo-text-container">
            <img src={kokLogo} alt="콕" className="kok-logo" />
            <span className="toggle-text">에서 비슷한 상품을 팔고 있어요!</span>
          </div>
          <svg 
            className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d="M7 10L12 15L17 10" 
              stroke="#838383" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 콕 상품 추천 목록 */}
      {isExpanded && (
        <div className="kokrecom-content">

          <div className="kokrecom-products">
            {kokRecommendations.map((product, index) => (
              <div 
                key={index} 
                className="kokrecom-product-item"
                onClick={() => handleKokProductClick(product.kok_product_id)}
              >
                <div className="kokrecom-product-image">
                  <img 
                    src={product.kok_thumbnail || '/default-product-image.png'} 
                    alt={product.kok_product_name}
                    onError={(e) => {
                      console.log('❌ 콕 상품 이미지 로드 실패:', product.kok_thumbnail);
                      e.target.src = '/default-product-image.png';
                    }}
                  />
                </div>
                                                   <div className="kokrecom-product-info">
                    <div className="kokrecom-product-name">
                      <div className="kokrecom-product-store">[{product.kok_store_name}]</div>
                      <div className="kokrecom-product-name-text">{product.kok_product_name}</div>
                    </div>
                                                              <div className="kokrecom-price-section">
                        {product.kok_discount_rate > 0 ? (
                          <span className="kokrecom-product-discount">
                            {product.kok_discount_rate}%
                          </span>
                        ) : (
                          <span className="kokrecom-no-discount">할인 없음</span>
                        )}
                        <span className="kokrecom-product-price">
                          {product.kok_discounted_price?.toLocaleString()}원
                        </span>
                        <button 
                          className="kokrecom-heart-button"
                          onClick={(e) => handleHeartToggle(product.kok_product_id, e)}
                        >
                          <img 
                            src={wishlistedProducts.has(product.kok_product_id) ? filledHeartIcon : emptyHeartIcon}
                            alt="찜 토글" 
                            className="kokrecom-heart-icon"
                          />
                        </button>
                      </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeshoppingKokRecommendation;
