// React와 필요한 훅들을 가져옵니다
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// 검색 헤더 컴포넌트를 가져옵니다
import HeaderSearchBar from '../../components/HeaderSearchBar';
// 하단 네비게이션 컴포넌트를 가져옵니다
import BottomNav from '../../layout/BottomNav';
// 로딩 컴포넌트를 가져옵니다
import Loading from '../../components/Loading';
// 뒤로가기 버튼 컴포넌트를 가져옵니다
import HeaderNavBackBtn from '../../components/HeaderNavBackBtn';
// 검색 페이지 스타일을 가져옵니다
import '../../styles/search.css';
import '../../styles/infinite_scroll.css';
// 콕 API를 가져옵니다
import { kokApi } from '../../api/kokApi';
// 사용자 Context import
import { useUser } from '../../contexts/UserContext';
// 모달 관리자 컴포넌트 import
import ModalManager, { showAlert, hideModal, showSearchHistoryDeletedNotification } from '../../components/LoadingModal';

// 콕 검색 페이지 컴포넌트를 정의합니다
const KokSearch = () => {
  // 페이지 이동을 위한 navigate 훅
  const navigate = useNavigate();
  // URL 정보를 가져오는 location 훅
  const location = useLocation();
  // 사용자 정보 가져오기
  const { user, isLoggedIn, isLoading: userLoading } = useUser();
  
  // 검색 관련 상태 관리 (콕 전용)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true); // 초기값을 true로 설정하여 로딩 상태로 시작
  const [historyLoaded, setHistoryLoaded] = useState(false); // 검색 히스토리 로드 완료 플래그 추가
  const searchType = 'kok'; // 콕 검색 타입 (상수로 변경)
  
  // 무한 스크롤을 위한 상태 변수들
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // 모달 상태 관리
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });

  // ===== 모달 관련 함수 =====
  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
  };

  // 콕 검색 히스토리 로드 (API 사용)
  const loadSearchHistory = useCallback(async () => {
    // 이미 로드된 경우 중복 호출 방지
    if (historyLoaded) {
      console.log('🔍 검색 히스토리가 이미 로드됨 - 중복 호출 방지');
      return;
    }
    
    console.log('🔍 콕 검색 히스토리 로드 시작:', { isLoggedIn, historyLoaded });
    
    try {
      if (isLoggedIn && user?.token) {
        // 로그인된 사용자는 서버에서 콕 검색 히스토리 가져오기
        const response = await kokApi.getSearchHistory(50, user.token); // 더 많은 데이터 가져오기
        const history = response.history || [];
        
        console.log('🔍 백엔드에서 받은 원본 히스토리:', {
          전체개수: history.length,
          원본데이터: history.map(item => ({
            id: item.kok_history_id,
            keyword: item.kok_keyword,
            createdAt: item.created_at
          }))
        });
        
        // UI에서 중복 제거 및 최신순 정렬
        const keywordMap = new Map();
        
        // 원본 데이터를 그대로 순회하면서 중복 제거
        history.forEach(item => {
          const existingItem = keywordMap.get(item.kok_keyword);
          const currentTime = new Date(item.created_at);
          
          // 같은 키워드가 없거나, 현재 항목이 더 최신인 경우 업데이트
          if (!existingItem || currentTime > new Date(existingItem.created_at)) {
            keywordMap.set(item.kok_keyword, {
              id: item.kok_history_id,
              keyword: item.kok_keyword,
              createdAt: item.created_at
            });
          }
        });
        
        // 최신 순으로 정렬 (created_at 기준 내림차순)
        const sortedHistory = Array.from(keywordMap.values())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(item => item.keyword)
          .slice(0, 10); // UI에는 최대 10개만 표시
        
        console.log('🔍 UI 중복 제거 및 최신순 정렬 후 히스토리:', {
          원본개수: history.length,
          중복제거후개수: keywordMap.size,
          UI표시개수: sortedHistory.length,
          최종키워드: sortedHistory
        });
        
        setSearchHistory(sortedHistory);
        // 로컬스토리지도 업데이트하여 다음 로드 시 빠르게 표시
        localStorage.setItem('kok_searchHistory', JSON.stringify(sortedHistory));
      } else {
        // 비로그인 사용자는 로컬스토리지에서 가져오기
        const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
        // 중복 제거 후 최신순 정렬
        const uniqueHistory = history.filter((keyword, index, self) => self.indexOf(keyword) === index);
        setSearchHistory(uniqueHistory.slice(0, 10));
      }
    } catch (error) {
      console.error('콕 검색 히스토리 로드 실패:', error);
      // API 실패 시 로컬스토리지에서 가져오기
      try {
        const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
        const uniqueHistory = history.filter((keyword, index, self) => self.indexOf(keyword) === index);
        setSearchHistory(uniqueHistory.slice(0, 10));
      } catch (localError) {
        console.error('로컬스토리지 콕 검색 히스토리 로드 실패:', localError);
        setSearchHistory([]);
      }
    } finally {
      setHistoryLoading(false); // 로딩 상태 종료
      setHistoryLoaded(true); // 로드 완료 플래그 설정
    }
  }, [isLoggedIn, user?.token, historyLoaded]);

  // 검색만 실행하는 함수 (저장 없이)
  const executeSearchOnly = useCallback(async (query) => {
    if (!query || loading) {
      console.log('🔍 검색 조건 불충족 또는 중복 실행 방지');
      return;
    }

    console.log('🔍 콕 검색만 실행 (저장 없이):', { query });
    
    // 컴포넌트가 언마운트되었는지 확인하는 플래그
    let isMounted = true;
    
    setLoading(true);
    setError(null);

         try {
       // URL 업데이트
       navigate(`/kok/search?q=${encodeURIComponent(query)}`, { replace: true });
       
       // 콕 실제 API 검색
       try {
         console.log('콕 상품 검색 시작:', query);
         const accessToken = isLoggedIn && user?.token ? user.token : null;
         const response = await kokApi.searchProducts(query, 1, 20, accessToken);
         
         console.log('콕 API 응답 전체:', response);
         console.log('콕 상품 데이터 샘플:', response.products?.[0]);
         
                   // API 응답 데이터를 검색 결과 형식으로 변환 (KokMain.js와 동일한 방식)
          const kokResults = (response.products || []).map(product => {
            console.log('콕 상품 원본 데이터:', product);
            
            // KokMain.js와 동일한 방식으로 데이터 변환
            const transformedProduct = {
              id: product.kok_product_id,
              name: product.kok_product_name,
              originalPrice: product.kok_discount_rate > 0 
                ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
                : product.kok_discounted_price, // 할인율이 0이면 할인가가 원가
              discountPrice: product.kok_discounted_price,
              discountRate: product.kok_discount_rate,
              image: product.kok_thumbnail || 'https://via.placeholder.com/300x300/CCCCCC/666666?text=No+Image',
              rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
              reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
              storeName: product.kok_store_name
            };
            
            // 검색 결과 형식으로 변환
            const result = {
              id: transformedProduct.id,
              title: transformedProduct.name,
              description: `콕 쇼핑몰에서 판매 중인 상품`,
              price: `${transformedProduct.discountPrice.toLocaleString()}원`,
              originalPrice: `${transformedProduct.originalPrice.toLocaleString()}원`,
              discount: `${transformedProduct.discountRate}%`,
              image: transformedProduct.image,
              category: '콕 상품',
              rating: transformedProduct.rating,
              reviewCount: transformedProduct.reviewCount,
              storeName: transformedProduct.storeName,
              shipping: '무료배송'
            };
            
            console.log('변환된 콕 상품 데이터:', result);
            return result;
          });
        
        // 중복 제거 (id 기준)
        const uniqueKokResults = kokResults.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        
        console.log('콕 검색 결과:', uniqueKokResults.length, '개 상품 (중복 제거 후)');
        if (isMounted) {
          setSearchResults(uniqueKokResults);
        }
        
        // 검색 결과를 sessionStorage에 저장
        const searchStateKey = `kok_search_${query}`;
        sessionStorage.setItem(searchStateKey, JSON.stringify({
          results: uniqueKokResults,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('콕 상품 검색 실패:', error);
        if (isMounted) {
          setError('콕 상품 검색 중 오류가 발생했습니다.');
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
      
    } catch (err) {
      console.error('콕 검색 실패:', err);
      if (isMounted) {
        setError('콕 검색 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
  }, [loading, navigate, isLoggedIn, user?.token]);

  // 콕 검색 실행 함수 (저장 포함)
  const handleSearch = useCallback(async (e = null, queryOverride = null) => {
    console.log('🔍 콕 검색 실행 함수 호출:', { e, queryOverride, searchQuery });
    
    // SearchHeader에서 (e, searchQuery) 순서로 전달됨
    // 두 번째 파라미터가 문자열이면 검색어로 사용
    if (typeof queryOverride === 'string') {
      // SearchHeader에서 온 경우: e = 이벤트, queryOverride = searchQuery
    } else if (typeof e === 'string') {
      // 다른 곳에서 검색어만 전달한 경우
      queryOverride = e;
      e = null;
    }
    
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    const query = queryOverride || searchQuery.trim();
    if (!query) {
      console.log('🔍 검색어가 없어서 콕 검색 중단');
      return;
    }

    console.log('🔍 콕 실제 검색 시작 (저장 포함):', { query });
    setLoading(true);
    setError(null);

    try {
      console.log('콕 검색 실행:', query);
      
      // 검색 히스토리에 저장 (함수 내부에서 직접 처리)
      try {
        if (isLoggedIn && user?.token) {
          // 백엔드에서 현재 히스토리를 가져와서 중복 체크
          try {
            const response = await kokApi.getSearchHistory(20, user.token);
            const currentHistory = response.history || [];
            
            // 시간 정보를 활용한 중복 체크
            const existingItem = currentHistory.find(item => item.kok_keyword === query);
            const currentTime = new Date();
            
            if (existingItem) {
              console.log('🔍 이미 백엔드에 존재하는 검색어입니다. UI에서 맨 위로 올리기:', query);
              
              // 기존 항목의 시간과 현재 시간 비교 (1분 이내면 중복으로 간주)
              const existingTime = new Date(existingItem.created_at);
              const timeDiff = currentTime - existingTime;
              const isRecentDuplicate = timeDiff < 60000; // 1분 = 60000ms
              
              if (isRecentDuplicate) {
                console.log('🔍 최근에 검색된 키워드입니다. DB 저장 생략, UI에서 맨 위로 이동:', query);
                // DB 저장 없이 UI에서만 맨 위로 이동
                setSearchHistory(prevHistory => {
                  const filteredHistory = prevHistory.filter(item => item !== query);
                  return [query, ...filteredHistory].slice(0, 10);
                });
              } else {
                // 시간이 충분히 지난 경우 새로운 검색으로 처리
                                 console.log('🔍 시간이 지난 검색어입니다. 새로운 검색으로 저장:', query);
                 await kokApi.addSearchHistory(query, user.token);
                
                // 히스토리 다시 로드하여 최신 순으로 정렬
                await loadSearchHistory();
              }
            } else {
                             // 새로운 검색어만 백엔드에 저장
               console.log('🔍 새로운 검색어를 백엔드에 저장:', query);
               await kokApi.addSearchHistory(query, user.token);
              
              // 히스토리 다시 로드하여 최신 순으로 정렬
              await loadSearchHistory();
            }
          } catch (historyError) {
                         console.error('히스토리 중복 체크 실패, 기본 저장 로직 실행:', historyError);
             // 히스토리 가져오기 실패 시 기본 저장 로직 실행
             await kokApi.addSearchHistory(query, user.token);
            setSearchHistory(prevHistory => {
              const currentHistory = prevHistory.filter(item => item !== query);
              return [query, ...currentHistory].slice(0, 10);
            });
          }
        } else {
          // 비로그인 사용자는 로컬스토리지에 저장
          const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
          const updatedHistory = [query, ...history.filter(item => item !== query)].slice(0, 20);
          localStorage.setItem('kok_searchHistory', JSON.stringify(updatedHistory));
          setSearchHistory(updatedHistory.slice(0, 10));
        }
      } catch (error) {
        console.error('콕 검색 히스토리 저장 실패:', error);
        // API 실패 시 로컬스토리지에 저장
        try {
          const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
          const updatedHistory = [query, ...history.filter(item => item !== query)].slice(0, 20);
          localStorage.setItem('kok_searchHistory', JSON.stringify(updatedHistory));
          setSearchHistory(updatedHistory.slice(0, 10));
        } catch (localError) {
          console.error('로컬스토리지 콕 검색 히스토리 저장 실패:', localError);
        }
      }
      
      // URL 업데이트 (쿼리 파라미터 추가)
      navigate(`/kok/search?q=${encodeURIComponent(query)}`, { replace: true });
      
      // 콕 실제 API 검색
      try {
        console.log('콕 상품 검색 시작:', query);
        const accessToken = isLoggedIn && user?.token ? user.token : null;
        const response = await kokApi.searchProducts(query, 1, 20, accessToken);
        
        console.log('콕 API 응답 전체:', response);
        console.log('콕 상품 데이터 샘플:', response.products?.[0]);
        
                 // API 응답 데이터를 검색 결과 형식으로 변환 (KokMain.js와 동일한 방식)
         const kokResults = (response.products || []).map(product => {
           console.log('콕 상품 원본 데이터:', product);
           
           // KokMain.js와 동일한 방식으로 데이터 변환
           const transformedProduct = {
             id: product.kok_product_id,
             name: product.kok_product_name,
             originalPrice: product.kok_discount_rate > 0 
               ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
               : product.kok_discounted_price, // 할인율이 0이면 할인가가 원가
             discountPrice: product.kok_discounted_price,
             discountRate: product.kok_discount_rate,
             image: product.kok_thumbnail || 'https://via.placeholder.com/300x300/CCCCCC/666666?text=No+Image',
             rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
             reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
             storeName: product.kok_store_name
           };
           
           // 검색 결과 형식으로 변환
           const result = {
             id: transformedProduct.id,
             title: transformedProduct.name,
             description: `콕 쇼핑몰에서 판매 중인 상품`,
             price: `${transformedProduct.discountPrice.toLocaleString()}원`,
             originalPrice: `${transformedProduct.originalPrice.toLocaleString()}원`,
             discount: `${transformedProduct.discountRate}%`,
             image: transformedProduct.image,
             category: '콕 상품',
             rating: transformedProduct.rating,
             reviewCount: transformedProduct.reviewCount,
             storeName: transformedProduct.storeName,
             shipping: '무료배송'
           };
           
           console.log('변환된 콕 상품 데이터:', result);
           console.log('상품 ID 확인:', {
             원본_kok_product_id: product.kok_product_id,
             변환후_id: result.id,
             타입: typeof result.id
           });
           return result;
         });
        
        // 중복 제거 (id 기준)
        const uniqueKokResults = kokResults.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        
        console.log('콕 검색 결과:', uniqueKokResults.length, '개 상품 (중복 제거 후)');
        setSearchResults(uniqueKokResults);
        
        // 무한 스크롤 상태 초기화
        setCurrentPage(1);
        setHasMore(uniqueKokResults.length === 20); // 20개면 더 로드 가능
        
        // 검색 결과를 sessionStorage에 저장
        const searchStateKey = `kok_search_${query}`;
        sessionStorage.setItem(searchStateKey, JSON.stringify({
          results: uniqueKokResults,
          timestamp: Date.now(),
          currentPage: 1,
          hasMore: uniqueKokResults.length === 20
        }));
      } catch (error) {
        console.error('콕 상품 검색 실패:', error);
        setError('콕 상품 검색 중 오류가 발생했습니다.');
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('콕 검색 실패:', err);
      setError('콕 검색 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [searchQuery, navigate, isLoggedIn, user?.token]);

  // URL 쿼리 파라미터에서 초기 검색어 가져오기 (콕 전용)
  useEffect(() => {
    console.log('=== 콕 Search 페이지 URL 파라미터 읽기 ===');
    console.log('현재 URL:', window.location.href);
    console.log('location.search:', location.search);
    
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    
    console.log('URL에서 읽은 파라미터:', { query });
    
    if (query) {
      setSearchQuery(query);
      
      // sessionStorage를 사용하여 뒤로가기인지 확인
      const searchStateKey = `kok_search_${query}`;
      const savedSearchState = sessionStorage.getItem(searchStateKey);
      
      if (savedSearchState) {
        // 이미 검색한 결과가 있다면 복원 (뒤로가기로 돌아온 경우)
        console.log('저장된 콕 검색 결과 복원:', query);
        try {
          const parsedState = JSON.parse(savedSearchState);
          const results = parsedState.results || [];
          
          // 복원된 결과에서도 중복 제거
          const uniqueResults = results.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          );
          
          console.log('복원된 콕 검색 결과:', uniqueResults.length, '개 상품 (중복 제거 후)');
          setSearchResults(uniqueResults);
          setLoading(false);
          
          // 복원된 검색어는 이미 저장되어 있으므로 히스토리 저장 생략
          console.log('🔍 복원된 검색어는 이미 히스토리에 저장되어 있음:', query);
        } catch (error) {
          console.error('콕 검색 상태 복원 실패:', error);
          // 복원 실패 시 검색만 실행 (저장 없이)
          executeSearchOnly(query);
        }
      } else {
        // 새로운 검색 실행 (저장 포함)
        console.log('새로운 콕 검색 실행 (저장 포함):', query);
        handleSearch(null, query);
      }
    }
  }, [location.search]); // handleSearch 의존성 제거

     // 더 많은 검색 결과를 로드하는 함수
   const loadMoreSearchResults = useCallback(async () => {
     if (loadingMore || !hasMore || !searchQuery.trim()) return;
     
     console.log('🔄 더 많은 검색 결과 로드 시작 - 페이지:', currentPage + 1);
     setLoadingMore(true);
     
     try {
       const accessToken = isLoggedIn && user?.token ? user.token : null;
       const response = await kokApi.searchProducts(searchQuery, currentPage + 1, 20, accessToken);
       
       console.log('콕 추가 검색 API 응답:', response);
       
              // API 응답 데이터를 검색 결과 형식으로 변환 (KokMain.js와 동일한 방식)
       const newKokResults = (response.products || []).map(product => {
         // KokMain.js와 동일한 방식으로 데이터 변환
         const transformedProduct = {
           id: product.kok_product_id,
           name: product.kok_product_name,
           originalPrice: product.kok_discount_rate > 0 
             ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
             : product.kok_discounted_price, // 할인율이 0이면 할인가가 원가
           discountPrice: product.kok_discounted_price,
           discountRate: product.kok_discount_rate,
           image: product.kok_thumbnail || 'https://via.placeholder.com/300x300/CCCCCC/666666?text=No+Image',
           rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
           reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
           storeName: product.kok_store_name
         };
         
         // 검색 결과 형식으로 변환
         return {
           id: transformedProduct.id,
           title: transformedProduct.name,
           description: `콕 쇼핑몰에서 판매 중인 상품`,
           price: `${transformedProduct.discountPrice.toLocaleString()}원`,
           originalPrice: `${transformedProduct.originalPrice.toLocaleString()}원`,
           discount: `${transformedProduct.discountRate}%`,
           image: transformedProduct.image,
           category: '콕 상품',
           rating: transformedProduct.rating,
           reviewCount: transformedProduct.reviewCount,
           storeName: transformedProduct.storeName,
           shipping: '무료배송'
         };
       });
      
      if (newKokResults && newKokResults.length > 0) {
        // 중복 제거를 위해 기존 상품 ID들을 Set으로 관리
        const existingIds = new Set(searchResults.map(p => p.id));
        const uniqueNewResults = newKokResults.filter(product => !existingIds.has(product.id));
        
        if (uniqueNewResults.length > 0) {
          setSearchResults(prev => [...prev, ...uniqueNewResults]);
          setCurrentPage(prev => prev + 1);
          console.log('✅ 새로운 검색 결과 추가 완료:', uniqueNewResults.length, '개');
          
          // 20개 미만이면 더 이상 로드할 상품이 없음
          if (newKokResults.length < 20) {
            setHasMore(false);
            console.log('📄 마지막 페이지 도달 - 더 이상 로드할 검색 결과가 없음');
          }
          
          // sessionStorage 업데이트
          const searchStateKey = `kok_search_${searchQuery}`;
          const currentState = JSON.parse(sessionStorage.getItem(searchStateKey) || '{}');
          sessionStorage.setItem(searchStateKey, JSON.stringify({
            ...currentState,
            results: [...searchResults, ...uniqueNewResults],
            currentPage: currentPage + 1,
            hasMore: newKokResults.length === 20
          }));
        } else {
          console.log('⚠️ 중복 제거 후 추가할 검색 결과가 없음');
          setHasMore(false);
        }
      } else {
        console.log('📄 더 이상 로드할 검색 결과가 없음');
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 더 많은 검색 결과 로드 중 오류:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchQuery, currentPage, searchResults, isLoggedIn, user?.token]);

  // 스크롤 이벤트 리스너 (무한 스크롤)
  useEffect(() => {
    const handleScroll = () => {
      // .search-content 요소를 찾기
      const searchContent = document.querySelector('.search-content');
      if (!searchContent) return;
      
      const scrollTop = searchContent.scrollTop;
      const scrollHeight = searchContent.scrollHeight;
      const clientHeight = searchContent.clientHeight;
      
      // 스크롤이 최하단에 도달했는지 확인 (100px 여유)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      if (isAtBottom && hasMore && !loadingMore && searchResults.length > 0) {
        console.log('🎯 스크롤 최하단 도달! 새로운 검색 결과 로드 시작');
        // 함수를 직접 호출하여 무한 루프 방지
        if (loadingMore || !hasMore || !searchQuery.trim()) return;
        
        setLoadingMore(true);
        
        // 비동기 함수를 즉시 실행
        (async () => {
          try {
            const accessToken = isLoggedIn && user?.token ? user.token : null;
            const response = await kokApi.searchProducts(searchQuery, currentPage + 1, 20, accessToken);
            
            console.log('콕 추가 검색 API 응답:', response);
            
                         // API 응답 데이터를 검색 결과 형식으로 변환 (KokMain.js와 동일한 방식)
             const newKokResults = (response.products || []).map(product => {
               // KokMain.js와 동일한 방식으로 데이터 변환
               const transformedProduct = {
                 id: product.kok_product_id,
                 name: product.kok_product_name,
                 originalPrice: product.kok_discount_rate > 0 
                   ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
                   : product.kok_discounted_price, // 할인율이 0이면 할인가가 원가
                 discountPrice: product.kok_discounted_price,
                 discountRate: product.kok_discount_rate,
                 image: product.kok_thumbnail || 'https://via.placeholder.com/300x300/CCCCCC/666666?text=No+Image',
                 rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
                 reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
                 storeName: product.kok_store_name
               };
               
               // 검색 결과 형식으로 변환
               return {
                 id: transformedProduct.id,
                 title: transformedProduct.name,
                 description: `콕 쇼핑몰에서 판매 중인 상품`,
                 price: `${transformedProduct.discountPrice.toLocaleString()}원`,
                 originalPrice: `${transformedProduct.originalPrice.toLocaleString()}원`,
                 discount: `${transformedProduct.discountRate}%`,
                 image: transformedProduct.image,
                 category: '콕 상품',
                 rating: transformedProduct.rating,
                 reviewCount: transformedProduct.reviewCount,
                 storeName: transformedProduct.storeName,
                 shipping: '무료배송'
               };
             });
            
            if (newKokResults && newKokResults.length > 0) {
              // 중복 제거를 위해 기존 상품 ID들을 Set으로 관리
              const existingIds = new Set(searchResults.map(p => p.id));
              const uniqueNewResults = newKokResults.filter(product => !existingIds.has(product.id));
              
              if (uniqueNewResults.length > 0) {
                setSearchResults(prev => [...prev, ...uniqueNewResults]);
                setCurrentPage(prev => prev + 1);
                console.log('✅ 새로운 검색 결과 추가 완료:', uniqueNewResults.length, '개');
                
                // 20개 미만이면 더 이상 로드할 상품이 없음
                if (newKokResults.length < 20) {
                  setHasMore(false);
                  console.log('📄 마지막 페이지 도달 - 더 이상 로드할 검색 결과가 없음');
                }
                
                // sessionStorage 업데이트
                const searchStateKey = `kok_search_${searchQuery}`;
                const currentState = JSON.parse(sessionStorage.getItem(searchStateKey) || '{}');
                sessionStorage.setItem(searchStateKey, JSON.stringify({
                  ...currentState,
                  results: [...searchResults, ...uniqueNewResults],
                  currentPage: currentPage + 1,
                  hasMore: newKokResults.length === 20
                }));
              } else {
                console.log('⚠️ 중복 제거 후 추가할 검색 결과가 없음');
                setHasMore(false);
              }
            } else {
              console.log('📄 더 이상 로드할 검색 결과가 없음');
              setHasMore(false);
            }
          } catch (error) {
            console.error('❌ 더 많은 검색 결과 로드 중 오류:', error);
          } finally {
            setLoadingMore(false);
          }
        })();
      }
    };

    // .search-content 요소에 스크롤 이벤트 리스너 등록
    const searchContent = document.querySelector('.search-content');
    if (searchContent) {
      searchContent.addEventListener('scroll', handleScroll);
      return () => searchContent.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, searchResults.length, searchQuery, currentPage, isLoggedIn, user?.token]);

  // 컴포넌트 마운트 시 콕 검색 히스토리 로드
  useEffect(() => {
    // 사용자 정보가 완전히 로드된 후에만 실행
    if (userLoading) {
      console.log('⏳ 사용자 정보 로딩 중 - 검색 히스토리 로드 대기');
      return;
    }
    
    console.log('🔄 KokSearch 컴포넌트 마운트 - 검색 히스토리 초기 로드 시작');
    
    // 먼저 로컬스토리지에서 데이터를 가져와서 초기 렌더링 개선
    try {
      const localHistory = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
      console.log('📱 로컬스토리지에서 초기 데이터 로드:', { 개수: localHistory.length, 데이터: localHistory });
      
      if (localHistory.length > 0) {
        const uniqueHistory = localHistory.filter((keyword, index, self) => self.indexOf(keyword) === index);
        console.log('✅ 로컬 데이터로 초기 렌더링:', { 개수: uniqueHistory.length, 데이터: uniqueHistory });
        setSearchHistory(uniqueHistory.slice(0, 10));
        setHistoryLoading(false); // 로컬 데이터가 있으면 로딩 상태 해제
      } else {
        console.log('📭 로컬스토리지에 데이터가 없음');
        // 로컬 데이터가 없으면 서버에서 가져오기
        if (isLoggedIn && user?.token) {
          console.log('🌐 서버에서 최신 데이터 가져오기 시작');
          loadSearchHistory();
        } else {
          console.log('👤 로그인되지 않음 - 검색 히스토리 로드 생략');
          setHistoryLoading(false);
        }
      }
    } catch (error) {
      console.error('❌ 로컬스토리지 초기 로드 실패:', error);
      // 에러 발생 시 서버에서 가져오기
      if (isLoggedIn && user?.token) {
        console.log('🌐 서버에서 최신 데이터 가져오기 시작');
        loadSearchHistory();
      } else {
        setHistoryLoading(false);
      }
    }
  }, [userLoading, isLoggedIn, user?.token]); // userLoading 의존성 추가

  // 사용자 정보가 변경될 때마다 콘솔에 출력 (디버깅용)
  useEffect(() => {
    console.log('KokSearch - 사용자 정보 상태:', {
      user: user,
      isLoggedIn: isLoggedIn,
      hasUser: !!user,
      userEmail: user?.email,
      hasToken: !!user?.token,
      userLoading: userLoading
    });
  }, [user, isLoggedIn, userLoading]);

  // 검색 히스토리 상태 변경 시 콘솔에 출력 (디버깅용)
  useEffect(() => {
    console.log('KokSearch - 검색 히스토리 상태:', {
      searchHistory: searchHistory,
      historyLength: searchHistory.length,
      historyLoading: historyLoading,
      historyLoaded: historyLoaded,
      historyItems: searchHistory.map((query, index) => `${index + 1}. ${query}`)
    });
  }, [searchHistory, historyLoading, historyLoaded]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    navigate(-1);
  };

  // 콕 상품 클릭 핸들러
  const handleProductClick = (product) => {
    console.log('콕 상품 클릭:', product);
    console.log('상품 ID 타입:', typeof product.id, '값:', product.id);
    console.log('전체 상품 데이터:', product);
    
    // 콕 상품 상세 페이지로 이동 (검색 정보를 state로 전달)
    navigate(`/kok/product/${product.id}`, {
      state: {
        from: 'search',
        searchQuery: searchQuery,
        backUrl: `/kok/search?q=${encodeURIComponent(searchQuery)}`,
        productData: product // 디버깅을 위해 전체 상품 데이터도 전달
      }
    });
  };

  // 검색 히스토리 클릭 핸들러
  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    handleSearch(null, query);
  };

  // 콕 검색 히스토리 삭제 핸들러 (API 사용)
  const handleDeleteHistory = async (queryToDelete) => {
    try {
      if (isLoggedIn && user?.token) {
        // 로그인된 사용자는 서버에서 콕 검색어 삭제
        const response = await kokApi.getSearchHistory(20, user.token);
        const history = response.history || [];
        const targetHistory = history.find(item => item.kok_keyword === queryToDelete);
        
        if (targetHistory) {
          await kokApi.deleteSearchHistory(targetHistory.kok_history_id, user.token);
        }
        // 삭제 후 히스토리 다시 로드
        await loadSearchHistory();
      } else {
        // 비로그인 사용자는 로컬스토리지에서 삭제
        const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
        const updatedHistory = history.filter(item => item !== queryToDelete);
        localStorage.setItem('kok_searchHistory', JSON.stringify(updatedHistory));
        setSearchHistory(updatedHistory.slice(0, 10));
      }
      
      // sessionStorage에서도 해당 검색 결과 삭제
      const searchStateKey = `kok_search_${queryToDelete}`;
      sessionStorage.removeItem(searchStateKey);
      console.log('🗑️ sessionStorage에서 검색 결과 삭제:', searchStateKey);
      
    } catch (error) {
      console.error('콕 검색 히스토리 삭제 실패:', error);
      // API 실패 시 로컬스토리지에서 삭제
      try {
        const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
        const updatedHistory = history.filter(item => item !== queryToDelete);
        localStorage.setItem('kok_searchHistory', JSON.stringify(updatedHistory));
        setSearchHistory(updatedHistory.slice(0, 10));
        
        // sessionStorage에서도 해당 검색 결과 삭제
        const searchStateKey = `kok_search_${queryToDelete}`;
        sessionStorage.removeItem(searchStateKey);
        console.log('🗑️ sessionStorage에서 검색 결과 삭제:', searchStateKey);
      } catch (localError) {
        console.error('로컬스토리지 콕 검색 히스토리 삭제 실패:', localError);
      }
    }
  };

  // 테스트용 검색 히스토리 생성 함수 (개발 중에만 사용)
  const generateTestHistory = () => {
    const testHistory = ['테스트 검색어 1', '테스트 검색어 2', '테스트 검색어 3'];
    localStorage.setItem('kok_searchHistory', JSON.stringify(testHistory));
    setSearchHistory(testHistory);
    setHistoryLoading(false);
    console.log('🧪 테스트 검색 히스토리 생성:', testHistory);
  };

  // 콕 검색 히스토리 전체 삭제 핸들러 (API 사용)
  const handleClearAllHistory = async () => {
    try {
      // 현재 UI에 표시된 검색 히스토리 개수 확인
      const currentHistoryCount = searchHistory.length;
      
      if (currentHistoryCount === 0) {
        console.log('삭제할 검색 히스토리가 없습니다.');
        setModalState(showAlert('삭제할 검색 히스토리가 없습니다.'));
        return;
      }
      
      console.log(`총 ${currentHistoryCount}개의 검색 히스토리를 삭제합니다...`);
      
      if (isLoggedIn && user?.token) {
        try {
          // 서버에서 현재 히스토리를 가져와서 삭제 시도
          const response = await kokApi.getSearchHistory(50, user.token);
          const serverHistory = response.history || [];
          
          if (serverHistory.length > 0) {
            console.log(`서버에 ${serverHistory.length}개의 검색 히스토리가 있습니다. 서버에서 삭제합니다.`);
            
            // 모든 검색어를 병렬로 삭제 (더 빠름)
            const deletePromises = serverHistory.map(async (item) => {
              try {
                await kokApi.deleteSearchHistory(item.kok_history_id, user.token);
                console.log(`✅ 서버 검색어 삭제 성공: ${item.kok_keyword} (ID: ${item.kok_history_id})`);
                return { success: true, id: item.kok_history_id };
              } catch (error) {
                console.error(`❌ 서버 검색어 삭제 실패 (ID: ${item.kok_history_id}):`, error);
                return { success: false, id: item.kok_history_id, error };
              }
            });
            
            // 모든 삭제 작업 완료 대기
            const results = await Promise.allSettled(deletePromises);
            
            // 결과 확인
            const successCount = results.filter(result => 
              result.status === 'fulfilled' && result.value.success
            ).length;
            
            console.log(`서버 삭제 완료: ${successCount}/${serverHistory.length}개 성공`);
          } else {
            console.log('서버에 검색 히스토리가 없습니다. 로컬 데이터만 삭제합니다.');
          }
        } catch (serverError) {
          console.error('서버 히스토리 삭제 실패:', serverError);
          console.log('서버 삭제 실패로 로컬 데이터만 삭제합니다.');
        }
      }
      
      // 로컬스토리지에서 검색 히스토리 삭제
      const localHistory = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
      localStorage.removeItem('kok_searchHistory');
      setSearchHistory([]);
      console.log(`로컬 검색 히스토리 ${localHistory.length}개 삭제 완료`);
      
             // sessionStorage에서 현재 검색 히스토리에 해당하는 검색 결과만 삭제
       const keysToRemove = [];
       for (let i = 0; i < sessionStorage.length; i++) {
         const key = sessionStorage.key(i);
         if (key && key.startsWith('kok_search_')) {
           // 검색어 추출 (kok_search_감자 -> 감자)
           const searchKeyword = key.replace('kok_search_', '');
           // 현재 검색 히스토리에 있는 검색어만 삭제
           if (searchHistory.includes(searchKeyword)) {
             keysToRemove.push(key);
           }
         }
       }
       
       if (keysToRemove.length > 0) {
         keysToRemove.forEach(key => {
           sessionStorage.removeItem(key);
           console.log('🗑️ sessionStorage에서 검색 결과 삭제:', key);
         });
         console.log(`✅ sessionStorage에서 ${keysToRemove.length}개의 검색 결과 삭제 완료`);
       } else {
         console.log('📝 sessionStorage에서 삭제할 검색 결과가 없음');
       }
      
      // 성공 메시지 표시
      setModalState(showSearchHistoryDeletedNotification(currentHistoryCount));
      
    } catch (error) {
      console.error('콕 검색 히스토리 전체 삭제 실패:', error);
      
             // 에러 발생 시에도 로컬 데이터는 삭제
       try {
         const history = JSON.parse(localStorage.getItem('kok_searchHistory') || '[]');
         localStorage.removeItem('kok_searchHistory');
         setSearchHistory([]);
         console.log(`에러 발생으로 로컬 검색 히스토리 ${history.length}개만 삭제 완료`);
         
         // 에러 발생 시에도 sessionStorage에서 해당 검색 결과만 삭제
         const keysToRemove = [];
         for (let i = 0; i < sessionStorage.length; i++) {
           const key = sessionStorage.key(i);
           if (key && key.startsWith('kok_search_')) {
             const searchKeyword = key.replace('kok_search_', '');
             if (history.includes(searchKeyword)) {
               keysToRemove.push(key);
             }
           }
         }
         
         if (keysToRemove.length > 0) {
           keysToRemove.forEach(key => {
             sessionStorage.removeItem(key);
             console.log('🗑️ 에러 발생 시 sessionStorage에서 검색 결과 삭제:', key);
           });
         }
         
         setModalState(showSearchHistoryDeletedNotification(history.length));
       } catch (localError) {
         console.error('로컬 데이터 삭제도 실패:', localError);
         setModalState(showAlert('검색 히스토리 삭제 중 오류가 발생했습니다.'));
       }
    }
  };

  // 로딩 중일 때 표시할 UI
  if (userLoading) {
    return (
      <div className="search-page">
        <div className="search-header">
          <HeaderNavBackBtn onClick={handleBack} />
          <HeaderSearchBar 
            onSearch={(query) => {
              if (query && query.trim()) {
                navigate(`/kok/search?q=${encodeURIComponent(query.trim())}&type=${searchType}`);
              }
            }}
            placeholder={`${searchType === 'kok' ? '콕' : '홈쇼핑'} 상품 검색`}
          />
        </div>
        <div className="search-content">
          <Loading message="검색 페이지를 불러오는 중..." />
        </div>
        <BottomNav />
      </div>
    );
  }

  // 콕 검색 페이지 렌더링
  return (
    <div className="search-page">

      
                     {/* 콕 검색 헤더 */}
        <div className="search-header">
          <HeaderNavBackBtn onClick={handleBack} />
          
          <HeaderSearchBar 
            onSearch={(query) => {
              console.log('🔍 HeaderSearchBar에서 콕 검색:', query);
              if (query && query.trim()) {
                navigate(`/kok/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
            placeholder="콕 상품 검색"
          />
        </div>

             {/* 메인 콘텐츠 */}
       <div className="search-content">
         {/* 검색 타입 전환 버튼 */}
         <div className="search-type-switch">
           <button 
             className="switch-btn"
             onClick={() => {
               console.log('🔍 홈쇼핑 검색으로 전환');
               navigate('/homeshopping/search');
             }}
           >
             홈쇼핑
           </button>
           <button 
             className="switch-btn active"
             onClick={() => {
               console.log('🔍 콕 검색 유지');
             }}
           >
             콕 쇼핑
           </button>
         </div>
         
         {/* 검색 결과가 없고 로딩 중이 아닐 때 */}
         {!loading && searchResults.length === 0 && !searchQuery && (
          <div className="search-empty-state">
            {/* 최근 검색어 섹션 - 항상 표시 */}
            <div className="search-history-section">
                             <div className="section-header">
                 <h3>최근 검색어</h3>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                    {!historyLoading && searchHistory.length > 0 && (
                      <button 
                        className="clear-all-btn"
                        onClick={handleClearAllHistory}
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>
               </div>
              
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #FA5F8C',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px'
                  }}></div>
                  검색 히스토리를 불러오는 중...
                </div>
              ) : searchHistory.length > 0 ? (
                <div className="search-history">
                  {searchHistory.map((query, index) => (
                    <div key={index} className="history-item">
                      <button
                        className="history-query"
                        onClick={() => handleHistoryClick(query)}
                      >
                        {query}
                      </button>
                      <button
                        className="delete-history-btn"
                        onClick={() => handleDeleteHistory(query)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  검색 히스토리가 없습니다
                </div>
              )}
            </div>
          </div>
        )}

        {/* 로딩 중일 때 */}
        {loading && (
          <div className="search-loading">
            <Loading message={`"${searchQuery}" 검색 중...`} />
          </div>
        )}

        {/* 에러 발생 시 */}
        {error && (
          <div className="search-error">
            <div className="error-message">{error}</div>
            <button 
              className="retry-btn"
              onClick={() => handleSearch(null, searchQuery)}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 검색 결과 */}
        {!loading && searchResults.length > 0 && (
          <div className="search-results">
            <div className="results-header">
              <h3>검색 결과 ({searchResults.length}개)</h3>
              <span className="search-query">"{searchQuery}"</span>
            </div>
            
            <div className="results-list">
              {searchResults.map((result, index) => (
                <div 
                  key={`kok-${result.id}-${index}`} 
                  className="result-item clickable"
                  onClick={() => handleProductClick(result)}
                >
                  <div className="result-image">
                    <img 
                      src={result.image} 
                      alt={result.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (!parent.querySelector('.image-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'image-placeholder';
                          placeholder.textContent = '이미지 준비 중입니다.';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>
                  <div className="result-info">
                    <h4 className="result-title" title={result.title}>
                      {result.title && result.title.length > 50 
                        ? result.title.substring(0, 50) + '...' 
                        : result.title}
                    </h4>


                    <div className="result-price">
                      {result.discount && result.discount !== '0%' && result.discount !== 'null' && result.discount !== 'null%' && result.discount !== null && (
                        <span className="discount">{result.discount}</span>
                      )}
                      <span className="price">{result.price}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 무한 스크롤 상태 표시 - 20개씩 로딩 */}
              {loadingMore && (
                <div className="infinite-scroll-loading">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">
                    <div>20개 검색 결과를 불러오는 중...</div>
                    <div className="loading-subtext">잠시만 기다려주세요</div>
                  </div>
                </div>
              )}
              
              {/* {!hasMore && searchResults.length > 0 && (
                <div className="no-more-products">
                  <div className="no-more-icon">🔍</div>
                  <div className="no-more-text">모든 검색 결과를 불러왔습니다</div>
                  <div className="no-more-subtext">총 {searchResults.length}개의 검색 결과</div>
                </div>
              )} */}
            </div>
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {!loading && searchQuery && searchResults.length === 0 && !error && (
          <div className="no-results">
            <h3>검색 결과가 없습니다</h3>
            <p>"{searchQuery}"에 대한 검색 결과를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />

      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={closeModal}
      />
    </div>
  );
};

// KokSearch 컴포넌트를 기본 내보내기로 설정합니다
export default KokSearch;
