import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from './OptimizedImage.js';
import '../styles/kok_product_card.css';

const KokProductCard = memo(({ product, type = 'default', style = {} }) => {
  const navigate = useNavigate();
  const { 
    id, 
    name, 
    originalPrice, 
    discountPrice, 
    discountRate, 
    image, 
    rating, 
    reviewCount,
    isSpecial = false 
  } = product;

  const handleKokCardClick = useCallback(() => {
    navigate(`/kok/product/${id}`);
  }, [navigate, id]);

  // 상품명 최적화 - useMemo로 계산 결과 캐싱
  const displayName = useMemo(() => {
    if (!name) return '상품명 없음';
    return name.length > 50 ? `${name.substring(0, 40)}...` : name;
  }, [name]);

  // 가격 정보 최적화
  const priceInfo = useMemo(() => ({
    discountRate: discountRate || 0,
    discountPrice: discountPrice?.toLocaleString() || '0'
  }), [discountRate, discountPrice]);

  // 리뷰 정보 최적화
  const reviewInfo = useMemo(() => ({
    rating: rating?.toFixed(1) || '0.0',
    count: reviewCount || 0
  }), [rating, reviewCount]);

  return (
    <div 
      className={`kok-product-card ${isSpecial ? 'special' : ''}`} 
      style={{ ...style, cursor: 'pointer' }}
      onClick={handleKokCardClick}
    >
      <div className="kok-product-image-container">
        <OptimizedImage 
          src={image} 
          alt={name} 
          className="kok-product-image"
          width="100%"
        />
      </div>
      <div className="kok-product-info">
        <div className="kok-price-info">
          <span className="kok-discount-rate">{priceInfo.discountRate}%</span>
          <span className="kok-discount-price">{priceInfo.discountPrice}</span>
        </div>
        <h3 className="kok-product-name">
          {displayName}
        </h3>
        {(type === 'default' || type === 'special' || type === 'grid' || type === 'fixed' || type === 'non-duplicated-grid' || type === 'discount-grid') && (
          <div className="kok-rating-info">
            <span className="kok-stars">★ {reviewInfo.rating}</span>
            <span className="kok-review-count">({reviewInfo.count})</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default KokProductCard;
