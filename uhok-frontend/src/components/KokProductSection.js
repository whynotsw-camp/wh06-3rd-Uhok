import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import KokProductCard from './KokProductCard';
import ErrorBoundary from './ErrorBoundary';
import '../styles/kok_product_section.css';

const KokProductSection = ({ 
  title, 
  products, 
  type = 'default', 
  showMore = false,
  sectionStyle = {},
  containerStyle = {},
  cardStyle = {}
}) => {
  const kokContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // grid 타입들일 때만 마우스 드래그 기능 추가
    if ((type === 'grid' || type === 'discount-grid' || type === 'non-duplicated-grid') && kokContainerRef.current) {
      const container = kokContainerRef.current;
      let isDown = false;
      let startX;
      let scrollLeft;

      const handleKokMouseDown = (e) => {
        isDown = true;
        container.classList.add('dragging');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        e.preventDefault(); // 기본 동작 방지
      };

      const handleKokMouseLeave = () => {
        isDown = false;
        container.classList.remove('dragging');
      };

      const handleKokMouseUp = () => {
        isDown = false;
        container.classList.remove('dragging');
      };

      const handleKokMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // 드래그 민감도 조정
        container.scrollLeft = scrollLeft - walk;
      };

      // 터치 이벤트도 추가
      const handleKokTouchStart = (e) => {
        isDown = true;
        container.classList.add('dragging');
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      };

      const handleKokTouchEnd = () => {
        isDown = false;
        container.classList.remove('dragging');
      };

      const handleKokTouchMove = (e) => {
        if (!isDown) return;
        if (e.cancelable) e.preventDefault();
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
      };

      // 마우스 이벤트
      container.addEventListener('mousedown', handleKokMouseDown);
      container.addEventListener('mouseleave', handleKokMouseLeave);
      container.addEventListener('mouseup', handleKokMouseUp);
      container.addEventListener('mousemove', handleKokMouseMove);

      // 터치 이벤트
      container.addEventListener('touchstart', handleKokTouchStart, { passive: false });
      container.addEventListener('touchend', handleKokTouchEnd);
      container.addEventListener('touchmove', handleKokTouchMove, { passive: false });

      // 휠 이벤트 추가
      const handleKokWheel = (e) => {
        if (e.cancelable) e.preventDefault();
        container.scrollLeft += e.deltaY;
      };
      container.addEventListener('wheel', handleKokWheel, { passive: false });

      return () => {
        // 마우스 이벤트 정리
        container.removeEventListener('mousedown', handleKokMouseDown);
        container.removeEventListener('mouseleave', handleKokMouseLeave);
        container.removeEventListener('mouseup', handleKokMouseUp);
        container.removeEventListener('mousemove', handleKokMouseMove);

        // 터치 이벤트 정리
        container.removeEventListener('touchstart', handleKokTouchStart);
        container.removeEventListener('touchend', handleKokTouchEnd);
        container.removeEventListener('touchmove', handleKokTouchMove);

        // 휠 이벤트 정리
        container.removeEventListener('wheel', handleKokWheel);
      };
    }
  }, [type]);

  const handleKokMoreClick = () => {
    // 섹션 타입에 따라 다른 경로로 이동
    let sectionType = '';
    switch (type) {
      case 'discount-grid':
        sectionType = 'discount';
        break;
      case 'fixed':
        sectionType = 'reviews';
        break;
      case 'non-duplicated-grid':
        sectionType = 'high-selling';
        break;
      default:
        sectionType = 'all';
    }
    navigate(`/kok/products/${sectionType}`);
  };

  return (
    <div className="kok-product-section" style={sectionStyle}>
      <div className="kok-section-header">
        <h2 className="kok-section-title">{title}</h2>
        {showMore && (
          <button className="kok-more-button" onClick={handleKokMoreClick}>
            더보기 <span className="kok-arrow">{'>'}</span>
          </button>
        )}
        {!showMore && <span className="kok-arrow-icon">{'>'}</span>}
      </div>
      <div 
        ref={kokContainerRef}
        className={`kok-products-container ${type}`}
        style={containerStyle}
      >
        {products.map((product, index) => (
          <ErrorBoundary key={product.id || `product-${index}`}>
            <KokProductCard 
              product={product} 
              type={type}
              style={cardStyle}
            />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

export default KokProductSection;
