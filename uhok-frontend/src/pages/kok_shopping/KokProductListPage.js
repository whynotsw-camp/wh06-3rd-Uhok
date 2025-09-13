import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Header removed

import '../../styles/kok_product_list_page.css';
import '../../styles/infinite_scroll.css';
import HeaderNavProductList from '../../layout/HeaderNavProductList';
import UpBtn from '../../components/UpBtn';
import emptyHeartIcon from '../../assets/heart_empty.png';
import filledHeartIcon from '../../assets/heart_filled.png';
import api from '../api';
import { kokApi } from '../../api/kokApi';

const KokProductListPage = () => {
  const { sectionType } = useParams();
  const navigate = useNavigate();
  const [kokProducts, setKokProducts] = useState([]);
  const [kokSectionTitle, setKokSectionTitle] = useState('');
  const [kokSearchQuery, setKokSearchQuery] = useState('');
  const [kokWishlistedProducts, setKokWishlistedProducts] = useState(new Set());
  
  // 무한 스크롤을 위한 상태 변수들
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // 전체 상품 데이터를 저장할 상태
  const [allProducts, setAllProducts] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // KOK API에서 오늘의 특가 상품 데이터를 가져오는 함수
  const fetchKokProducts = async (page = 1, limitTo20 = false) => {
    try {
      // 초기 로딩일 때만 전체 데이터를 가져옴 (백엔드 최대 100개 제한)
      if (isInitialLoad) {
        const response = await api.get('/api/kok/discounted', {
          params: {
            page: 1,
            size: 100 // 백엔드 최대 제한
          }
        });
        console.log('오늘의 특가 상품 API 응답 (전체):', response.data);
        
        if (response.data && response.data.products) {
          const productsWithReviews = response.data.products.map(product => ({
            ...product,
            rating: product.kok_review_score || 0,
            reviewCount: product.kok_review_cnt || 0
          }));
          
          setAllProducts(productsWithReviews);
          setIsInitialLoad(false);
          
          // 첫 20개만 반환
          const first20Products = productsWithReviews.slice(0, 20);
          console.log('전체 데이터 개수:', productsWithReviews.length, '→ 첫 20개:', first20Products.length);
          return first20Products;
        }
      } else {
        // 무한 스크롤에서는 저장된 전체 데이터에서 페이지네이션
        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        const pageProducts = allProducts.slice(startIndex, endIndex);
        
        console.log(`페이지 ${page} 데이터:`, pageProducts);
        console.log(`시작 인덱스: ${startIndex}, 끝 인덱스: ${endIndex}`);
        
        return pageProducts;
      }
      
      return [];
    } catch (err) {
      console.error('KOK 상품 데이터 로딩 실패:', err);
      return [];
    }
  };

  // KOK API에서 베스트 판매 상품 데이터를 가져오는 함수
  const fetchKokTopSellingProducts = async (page = 1, limitTo20 = false) => {
    try {
      // 초기 로딩일 때만 전체 데이터를 가져옴 (백엔드 최대 100개 제한)
      if (isInitialLoad) {
        const response = await api.get('/api/kok/top-selling', {
          params: {
            page: 1,
            size: 100, // 백엔드 최대 제한
            sort_by: 'review_count'
          }
        });
        console.log('베스트 판매 상품 API 응답 (전체):', response.data);
        
        if (response.data && response.data.products) {
          const productsWithReviews = response.data.products.map(product => ({
            ...product,
            rating: product.kok_review_score || 0,
            reviewCount: product.kok_review_cnt || 0
          }));
          
          setAllProducts(productsWithReviews);
          setIsInitialLoad(false);
          
          // 첫 20개만 반환
          const first20Products = productsWithReviews.slice(0, 20);
          console.log('전체 데이터 개수:', productsWithReviews.length, '→ 첫 20개:', first20Products.length);
          return first20Products;
        }
      } else {
        // 무한 스크롤에서는 저장된 전체 데이터에서 페이지네이션
        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        const pageProducts = allProducts.slice(startIndex, endIndex);
        
        console.log(`페이지 ${page} 데이터:`, pageProducts);
        console.log(`시작 인덱스: ${startIndex}, 끝 인덱스: ${endIndex}`);
        
        return pageProducts;
      }
      
      return [];
    } catch (err) {
      console.error('KOK 베스트 판매 상품 데이터 로딩 실패:', err);
      return [];
    }
  };

  // KOK API에서 최근 이용 스토어 내 리뷰 많은 상품 데이터를 가져오는 함수
  const fetchKokStoreBestItems = async (page = 1) => {
    try {
      const response = await api.get('/api/kok/store-best-items', {
        params: {
          sort_by: 'review_count' // 리뷰 개수 순으로 정렬 (기본값)
        }
        // 페이지네이션 파라미터 없음 - 명세서에 따르면 10개 고정
      });
      console.log('스토어 베스트 상품 API 응답:', response.data);
      
      // API 응답 구조에 맞게 데이터 처리
      if (response.data && response.data.products) {
        // 백엔드에서 직접 제공하는 별점과 리뷰 수 사용
        const productsWithReviews = response.data.products.map(product => ({
          ...product,
          rating: product.kok_review_score || 0, // 백엔드에서 직접 제공하는 별점
          reviewCount: product.kok_review_cnt || 0 // 백엔드에서 직접 제공하는 리뷰 수
        }));
        
        console.log('리뷰 통계가 포함된 스토어 베스트 상품 데이터:', productsWithReviews);
        
        // 스토어 베스트는 10개 고정이므로 더 로드할 상품이 없음
        return productsWithReviews;
      } else {
        console.log('API 응답에 products 필드가 없습니다.');
        return [];
      }
    } catch (err) {
             console.error('KOK 최근 이용 스토어 내 리뷰 많은 상품 데이터 로딩 실패:', err);
      return [];
    }
  };

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  };

  useEffect(() => {
    const loadKokProducts = async () => {
      console.log('🔄 초기 상품 로딩 시작');
      
      // 초기 로딩 상태 리셋
      setIsInitialLoad(true);
      
      try {
        switch (sectionType) {
          case 'discount':
            const kokProducts = await fetchKokProducts(1, true); // 초기 로딩이므로 20개로 제한
            setKokProducts(kokProducts);
            setKokSectionTitle('오늘의 특가');
            setHasMore(kokProducts.length === 20); // 20개면 더 로드 가능
            console.log('✅ 오늘의 특가 상품 로드 완료:', kokProducts.length, '개');
            break;
          case 'high-selling':
            const kokTopSellingProducts = await fetchKokTopSellingProducts(1, true); // 초기 로딩이므로 20개로 제한
            setKokProducts(kokTopSellingProducts);
            setKokSectionTitle('베스트 판매 상품');
            setHasMore(kokTopSellingProducts.length === 20); // 20개면 더 로드 가능
            console.log('✅ 베스트 판매 상품 로드 완료:', kokTopSellingProducts.length, '개');
            break;
          case 'reviews':
            const kokStoreBestItems = await fetchKokStoreBestItems(1);
            setKokProducts(kokStoreBestItems);
                         setKokSectionTitle('최근 이용 스토어 내 인기 상품');
            setHasMore(false); // 스토어 베스트는 10개 고정
            console.log('✅ 스토어 베스트 상품 로드 완료:', kokStoreBestItems.length, '개');
            break;
          default:
            setKokProducts([]);
            setKokSectionTitle('제품 목록');
            setHasMore(false);
            console.log('❌ 알 수 없는 섹션 타입:', sectionType);
        }
        
        // 로그인 상태 확인 후 찜한 상품 목록 로드
        if (checkLoginStatus()) {
          await loadLikedProducts();
        } else {
          console.log('로그인하지 않은 상태: 찜 상품 API 호출 건너뜀');
        }
      } catch (error) {
        console.error('❌ 상품 로딩 중 오류:', error);
      }
    };
    loadKokProducts();
  }, [sectionType]);

  // 더 많은 상품을 로드하는 함수 (20개씩)
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return;
    
    console.log('🔄 더 많은 상품 로드 시작 - 페이지:', currentPage + 1, '(20개씩)');
    setLoadingMore(true);
    
    try {
      let newProducts = [];
      
      switch (sectionType) {
        case 'discount':
          newProducts = await fetchKokProducts(currentPage + 1, false); // 무한 스크롤이지만 20개씩만 가져오기
          break;
        case 'high-selling':
          newProducts = await fetchKokTopSellingProducts(currentPage + 1, false); // 무한 스크롤이지만 20개씩만 가져오기
          break;
        case 'reviews':
          // 스토어 베스트는 10개 고정이므로 더 로드하지 않음
          console.log('⚠️ 스토어 베스트는 10개 고정이므로 더 로드하지 않음');
          setHasMore(false);
          setLoadingMore(false);
          return;
        default:
          console.log('❌ 알 수 없는 섹션 타입:', sectionType);
          setLoadingMore(false);
          return;
      }
      
      if (newProducts && newProducts.length > 0) {
        // 20개씩 추가
        setKokProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(prev => prev + 1);
        console.log('✅ 새로운 상품 추가 완료:', newProducts.length, '개 (총:', kokProducts.length + newProducts.length, '개)');
        
        // 20개 미만이면 더 이상 로드할 상품이 없음
        if (newProducts.length < 20) {
          setHasMore(false);
          console.log('📄 마지막 페이지 도달 - 더 이상 로드할 상품이 없음');
        }
      } else {
        console.log('📄 더 이상 로드할 상품이 없음');
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 더 많은 상품 로드 중 오류:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 무한 스크롤 이벤트 리스너 (20개씩 로딩)
  useEffect(() => {
    const handleContainerScroll = () => {
      const container = document.querySelector('.kok-product-list-content');
      if (!container || !hasMore || loadingMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // 스크롤이 하단에 가까워지면 로딩 (100px 여유)
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      if (isNearBottom) {
        console.log('🎯 스크롤 하단 근접! 20개 상품 로드 시작');
        loadMoreProducts();
      }
    };

    // 컨테이너에 스크롤 이벤트 리스너 등록
    const container = document.querySelector('.kok-product-list-content');
    if (container) {
      container.addEventListener('scroll', handleContainerScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleContainerScroll);
      }
    };
  }, [hasMore, loadingMore, loadMoreProducts]);

  const handleKokBack = () => {
    navigate(-1);
  };

  const handleKokSearch = (query) => {
    console.log('검색 실행:', query);
    // 콕 쇼핑몰 타입으로 검색 페이지로 이동
    if (query && query.trim()) {
      const searchUrl = `/kok/search?q=${encodeURIComponent(query.trim())}`;
      navigate(searchUrl);
    } else {
      navigate('/kok/search');
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

  const handleKokProductClick = (productId) => {
    navigate(`/kok/product/${productId}`);
  };

  // 찜한 상품 목록을 가져오는 함수
  const loadLikedProducts = async () => {
    // 로그인하지 않은 경우 API 호출 건너뜀
    if (!checkLoginStatus()) {
      console.log('로그인하지 않은 상태: 찜 상품 API 호출 건너뜀');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('토큰이 없어서 찜한 상품 목록을 로드하지 않습니다.');
        return;
      }

      console.log('🔄 찜한 상품 목록 로딩 시작');
      const response = await kokApi.getLikedProducts(100); // 충분히 많은 수량
      console.log('✅ 찜한 상품 목록 로딩 완료:', response);
      
      if (response && response.liked_products) {
        const likedProductIds = new Set(
          response.liked_products.map(product => product.kok_product_id || product.id)
        );
        setKokWishlistedProducts(likedProductIds);
        console.log('✅ 찜한 상품 ID 목록 설정 완료:', likedProductIds);
      }
    } catch (error) {
      console.error('❌ 찜한 상품 목록 로딩 실패:', error);
      
      // 401 에러인 경우 토큰이 만료되었거나 유효하지 않음
      if (error.response?.status === 401) {
        console.log('401 에러 - 토큰이 만료되었거나 유효하지 않음');
        // 토큰 제거
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // 찜한 상품 목록 초기화
        setKokWishlistedProducts(new Set());
      }
      // 에러가 발생해도 페이지는 정상적으로 표시되도록 함
    }
  };

  const handleKokWishlistClick = async (productId, event) => {
    event.stopPropagation();
    
    // 토큰 확인
    const token = localStorage.getItem('access_token');
          if (!token) {
        alert('로그인이 필요한 서비스입니다.');
        return;
      }
    
    try {
      // 찜 토글 API 호출
      const response = await kokApi.toggleProductLike(productId);
      console.log('찜 토글 응답:', response);
      
      // 찜 토글 성공 후 하트 아이콘 상태 변경
      if (response) {
        console.log('찜 토글 성공! 하트 아이콘 상태를 변경합니다.');
        
        // 애니메이션 클래스 추가
        const heartIcon = event.currentTarget;
        if (heartIcon) {
          if (kokWishlistedProducts.has(productId)) {
            // 찜 해제 애니메이션
            heartIcon.classList.add('unliked');
            setTimeout(() => heartIcon.classList.remove('unliked'), 400);
          } else {
            // 찜 추가 애니메이션
            heartIcon.classList.add('liked');
            setTimeout(() => heartIcon.classList.remove('liked'), 600);
          }
        }
        
        // 로컬 상태 업데이트
        setKokWishlistedProducts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(productId)) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('찜 토글 실패:', error);
      
      // 에러 처리
      if (error.response?.status === 401) {
        console.log('401 에러 - 토큰이 만료되었거나 유효하지 않음');
        // 토큰 제거
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert('로그인이 필요한 서비스입니다.');
      } else {
        alert('찜 기능에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="kok-product-list-page">
      <HeaderNavProductList title={kokSectionTitle || '상품 리스트'} onBackClick={handleKokBack} onNotificationsClick={handleKokNotificationClick} />
      
      <div className="kok-content">
        
        <div className="kok-section-header">
          <h1 className="kok-page-title">{kokSectionTitle}</h1>
        </div>
        
        <div className="kok-product-list-content">
          <div className="kok-products-grid">
            {kokProducts.map((product, index) => (
              <div
                key={`${product.kok_product_id || product.id}-${index}`}
                className="kok-product-card"
                onClick={() => handleKokProductClick(product.kok_product_id || product.id)}
              >
                <div className="kok-product-image-container">
                  <img 
                    src={product.kok_thumbnail || product.image} 
                    alt={product.kok_product_name || product.name} 
                    className="kok-product-image"
                  />
                </div>
                <div className="kok-product-info">
                  <div className="kok-product-price-info">
                    <span className="kok-discount-rate-text">{product.kok_discount_rate || product.discountRate || 0}%</span>
                    <span className="kok-discount-price-text">
                      {(product.kok_discounted_price || product.discountPrice || 0).toLocaleString()}원
                    </span>
                    <img 
                      src={kokWishlistedProducts.has(product.kok_product_id || product.id) ? filledHeartIcon : emptyHeartIcon} 
                      className="kok-wishlist-icon"
                      onClick={(e) => handleKokWishlistClick(product.kok_product_id || product.id, e)} 
                    />
                  </div>
                  <div className="kok-product-name">{product.kok_product_name || product.name}</div>
                  <div className="kok-product-rating">
                    <span className="kok-stars">★ {(product.rating || 0).toFixed(1)}</span>
                    <span className="kok-review-count">({product.reviewCount || 0}개 리뷰)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 무한 스크롤 상태 표시 - 20개씩 로딩 */}
          {loadingMore && (
            <div className="infinite-scroll-loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                <div>20개 상품을 불러오는 중...</div>
                <div className="loading-subtext">잠시만 기다려주세요</div>
              </div>
            </div>
          )}
          
          {!hasMore && kokProducts.length > 0 && (
            <div className="no-more-products">
              {/* <div className="no-more-icon">📦</div> */}
              <div className="no-more-text">모든 상품을 불러왔습니다</div>
              {/* <div className="no-more-subtext">총 {kokProducts.length}개의 상품</div> */}
            </div>
          )}
        </div>
        
        {/* 맨 위로 가기 버튼 */}
        <div style={{ position: 'relative' }}>
          <UpBtn />
        </div>
      </div>
    </div>
  );
};

export default KokProductListPage;
