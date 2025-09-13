import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = null,
  loading = 'lazy',
  width,
  height,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && src) {
      // WebP 지원 확인 후 적절한 포맷 선택
      const webpSupported = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // 이미지 로딩
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setImageSrc(fallback);
        setIsLoaded(true);
      };
      img.src = src;
    } else if (isInView && !src) {
      // src가 없으면 fallback으로 설정하거나 로딩 완료 처리
      setImageSrc(fallback);
      setIsLoaded(true);
    }
  }, [isInView, src, fallback]);

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...props}
    >
      {isInView && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          loading={loading}
        />
      )}
      {!isLoaded && isInView && (
        <div className="image-placeholder">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
