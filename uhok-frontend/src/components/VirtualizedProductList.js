import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import KokProductCard from './KokProductCard';
import '../styles/virtualized_product_list.css';

const VirtualizedProductList = ({ 
  products = [], 
  itemHeight = 200, 
  containerHeight = 400,
  overscan = 5,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const loadingRef = useRef(null);

  // 가상화 계산
  const virtualizedData = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, products.length);
    const actualStartIndex = Math.max(0, startIndex - overscan);

    return {
      startIndex: actualStartIndex,
      endIndex,
      visibleItems: products.slice(actualStartIndex, endIndex),
      totalHeight: products.length * itemHeight,
      offsetY: actualStartIndex * itemHeight
    };
  }, [products, itemHeight, containerHeight, scrollTop, overscan]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // 무한 스크롤 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || !hasMore || loading) return;

    const handleScrollToBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScrollToBottom);
    return () => container.removeEventListener('scroll', handleScrollToBottom);
  }, [onLoadMore, hasMore, loading]);

  return (
    <div 
      ref={containerRef}
      className="virtualized-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div 
        className="virtualized-content"
        style={{ 
          height: virtualizedData.totalHeight,
          position: 'relative'
        }}
      >
        <div
          className="virtualized-items"
          style={{
            transform: `translateY(${virtualizedData.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {virtualizedData.visibleItems.map((product, index) => (
            <div
              key={product.id || (virtualizedData.startIndex + index)}
              className="virtualized-item"
              style={{ height: itemHeight }}
            >
              <KokProductCard 
                product={product} 
                type="grid"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ))}
        </div>
        
        {/* 로딩 인디케이터 */}
        {loading && (
          <div 
            ref={loadingRef}
            className="loading-indicator"
            style={{
              position: 'absolute',
              top: virtualizedData.totalHeight - 50,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '20px'
            }}
          >
            <div className="loading-spinner">로딩 중...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedProductList;
