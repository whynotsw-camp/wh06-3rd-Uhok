import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Header removed
import KokProductSection from '../../components/KokProductSection';
import BottomNav from '../../layout/BottomNav';
import Loading from '../../components/Loading';
import HeaderNavMain from '../../layout/HeaderNavKokMain';
import '../../styles/kok_main.css';
import api from '../api';
import { useUser } from '../../contexts/UserContext';

// 상품 데이터 import (오늘의 특가와 베스트 판매 상품만)
import { 
  discountProducts, 
  highSellingProducts
} from '../../data/products';

const KokMain = () => {
  const navigate = useNavigate();
  const [kokFadeIn, setKokFadeIn] = useState(false);
  const [kokSearchQuery, setKokSearchQuery] = useState('');
  // API 데이터를 저장할 상태 추가
  const [kokProducts, setKokProducts] = useState([]);
  const [kokTopSellingProducts, setKokTopSellingProducts] = useState([]);
  const [kokStoreBestItems, setKokStoreBestItems] = useState([]);
  const [kokLoading, setKokLoading] = useState(true);
  
  // 사용자 정보 가져오기
  const { user, isLoggedIn } = useUser();

  // KOK API에서 오늘의 특가 상품 데이터를 가져오는 함수
  const fetchKokProducts = async (limitTo20 = true) => {
    try {
      console.log('오늘의 특가 상품 API 호출 시작...');
      console.log('API 엔드포인트: /api/kok/discounted');
      console.log('요청 파라미터:', { page: 1, size: 20 });
      
      const response = await api.get('/api/kok/discounted', {
        baseURL: '', // 프록시 사용
        params: {
          page: 1,
          size: 20
        }
      });
      
      console.log('📤 API 요청 헤더: 공개 엔드포인트 - 토큰 없음');
      console.log('📤 API 요청 URL:', '/api/kok/discounted');
      console.log('📤 API 요청 파라미터:', { page: 1, size: 20 });
      
      console.log('📥 오늘의 특가 상품 API 응답 전체:', response);
      console.log('오늘의 특가 상품 API 응답:', response.data);
      
      // 백엔드 응답 구조에 맞게 데이터 처리 (products 필드 우선)
      if (response.data && response.data.products && Array.isArray(response.data.products)) {
        console.log('오늘의 특가 상품 데이터 설정:', response.data.products.length);
        
        // 백엔드에서 직접 제공하는 별점과 리뷰 수 사용
        const transformedProducts = response.data.products.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price, // 할인율이 0이면 할인가가 원가
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_thumbnail,
          rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
          reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
          storeName: product.kok_store_name
        }));
        
        // 항상 20개로 제한 (초기 로딩과 무한 스크롤 모두)
        const finalProducts = transformedProducts.slice(0, 20);
        
        console.log('변환된 상품 데이터 (20개 제한):', finalProducts);
        console.log('원본 데이터 개수:', transformedProducts.length, '→ 최종 데이터 개수:', finalProducts.length);
        console.log('변환된 상품의 별점과 리뷰수:', finalProducts.map(p => ({ name: p.name, rating: p.rating, reviewCount: p.reviewCount })));
        setKokProducts(finalProducts);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('API 응답이 배열 형태입니다 (products 필드 없음).');
        // 배열 형태로 직접 응답받은 경우 (하위 호환성)
        const transformedProducts = response.data.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price,
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_thumbnail,
          rating: product.kok_review_score || 0,
          reviewCount: product.kok_review_cnt || 0,
          storeName: product.kok_store_name
        }));
        
        // 항상 20개로 제한 (초기 로딩과 무한 스크롤 모두)
        const finalProducts = transformedProducts.slice(0, 20);
        
        console.log('변환된 상품 데이터 (20개 제한):', finalProducts);
        console.log('원본 데이터 개수:', transformedProducts.length, '→ 최종 데이터 개수:', finalProducts.length);
        setKokProducts(finalProducts);
      } else {
        console.log('API 응답 구조가 예상과 다릅니다. 응답 데이터:', response.data);
        console.log('임시 데이터를 사용합니다.');
        setKokProducts(discountProducts);
      }
    } catch (err) {
      console.error('KOK 상품 데이터 로딩 실패:', err);
      
      // 에러 상세 정보 로깅
      if (err.response) {
        console.error('에러 응답 상태:', err.response.status);
        console.error('에러 응답 데이터:', err.response.data);
      } else if (err.request) {
        console.error('요청은 전송되었지만 응답을 받지 못함:', err.request);
      } else {
        console.error('요청 설정 중 에러 발생:', err.message);
      }
      
      console.log('임시 데이터를 사용합니다.');
      // API 연결 실패 시 기존 데이터 사용
      setKokProducts(discountProducts);
    }
  };

  // KOK API에서 베스트 판매 상품 데이터를 가져오는 함수
  const fetchKokTopSellingProducts = async (limitTo20 = true) => {
    try {
      // console.log('베스트 판매 상품 API 호출 시작...');
      // console.log('API 엔드포인트: /api/kok/top-selling');
      // console.log('요청 파라미터:', { page: 1, size: 20, sort_by: 'review_count' });
      
      // 공개 엔드포인트이므로 토큰 검증 없이 진행
      const response = await api.get('/api/kok/top-selling', {
        baseURL: '', // 프록시 사용
        params: {
          page: 1,
          size: 20,
          sort_by: 'review_count' // 리뷰 개수 순으로 정렬 (기본값)
        }
      });
      
      // console.log('📤 API 요청 헤더: 공개 엔드포인트 - 토큰 없음');
      // console.log('📤 API 요청 URL:', '/api/kok/top-selling');
      // console.log('📤 API 요청 파라미터:', { page: 1, size: 20, sort_by: 'review_count' });
      
      // console.log('📥 베스트 판매 상품 API 응답 전체:', response);
      // console.log('베스트 판매 상품 API 응답:', response.data);
      
      // 백엔드 응답 구조에 맞게 데이터 처리 (products 필드 우선)
      if (response.data && response.data.products && Array.isArray(response.data.products)) {
        console.log('베스트 판매 상품 데이터 설정:', response.data.products.length);
        
        // 백엔드에서 직접 제공하는 별점과 리뷰 수 사용
        const transformedProducts = response.data.products.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price,
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_product_image || product.kok_thumbnail,
          rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
          reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
          storeName: product.kok_store_name
        }));
        
        // 항상 20개로 제한 (초기 로딩과 무한 스크롤 모두)
        const finalProducts = transformedProducts.slice(0, 20);
        
        console.log('변환된 상품 데이터 (20개 제한):', finalProducts);
        console.log('원본 데이터 개수:', transformedProducts.length, '→ 최종 데이터 개수:', finalProducts.length);
        console.log('변환된 상품의 별점과 리뷰수:', finalProducts.map(p => ({ name: p.name, rating: p.rating, reviewCount: p.reviewCount })));
        setKokTopSellingProducts(finalProducts);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('API 응답이 배열 형태입니다 (products 필드 없음).');
        // 배열 형태로 직접 응답받은 경우 (하위 호환성)
        const transformedProducts = response.data.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price,
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_product_image || product.kok_thumbnail,
          rating: product.kok_review_score || 0,
          reviewCount: product.kok_review_cnt || 0,
          storeName: product.kok_store_name
        }));
        
        // 항상 20개로 제한 (초기 로딩과 무한 스크롤 모두)
        const finalProducts = transformedProducts.slice(0, 20);
        
        console.log('변환된 상품 데이터 (20개 제한):', finalProducts);
        console.log('원본 데이터 개수:', transformedProducts.length, '→ 최종 데이터 개수:', finalProducts.length);
        setKokTopSellingProducts(finalProducts);
      } else {
        console.log('API 응답 구조가 예상과 다릅니다. 응답 데이터:', response.data);
        console.log('임시 데이터를 사용합니다.');
        setKokTopSellingProducts(highSellingProducts);
      }
    } catch (err) {
      console.error('KOK 베스트 판매 상품 데이터 로딩 실패:', err);
      
      // 에러 상세 정보 로깅
      if (err.response) {
        console.error('에러 응답 상태:', err.response.status);
        console.error('에러 응답 데이터:', err.response.data);
      } else if (err.request) {
        console.error('요청은 전송되었지만 응답을 받지 못함:', err.request);
      } else {
        console.error('요청 설정 중 에러 발생:', err.message);
      }
      
      console.log('임시 데이터를 사용합니다.');
      // API 연결 실패 시 기존 데이터 사용
      setKokTopSellingProducts(highSellingProducts);
    }
  };

    // 최근 이용 스토어 내 인기 상품 데이터를 가져오는 함수
  const fetchKokStoreBestItems = async () => {
    try {
      console.log('스토어 베스트 상품 API 호출 시작...');
      console.log('API 엔드포인트: /api/kok/store-best-items');
      console.log('요청 파라미터:', { sort_by: 'review_count' });
      
      // 공개 엔드포인트이므로 토큰 검증 없이 진행
      const response = await api.get('/api/kok/store-best-items', {
        baseURL: '', // 프록시 사용
        params: {
          sort_by: 'review_count' // 리뷰 개수 순으로 정렬 (기본값)
        }
      });
      
      console.log('📤 API 요청 헤더: 공개 엔드포인트 - 토큰 없음');
      console.log('📤 API 요청 URL:', '/api/kok/store-best-items');
      console.log('📤 API 요청 파라미터:', { sort_by: 'review_count' });
      
      console.log('📥 스토어 베스트 상품 API 응답 전체:', response);
      console.log('응답 상태:', response.status);
      console.log('응답 헤더:', response.headers);
      console.log('응답 데이터:', response.data);
      console.log('응답 데이터 타입:', typeof response.data);
      console.log('응답 데이터가 배열인가?', Array.isArray(response.data));
      console.log('응답 데이터에 products 필드가 있는가?', response.data && 'products' in response.data);
      console.log('products 필드가 있다면 타입은?', response.data?.products ? typeof response.data.products : '없음');
      console.log('products 필드가 있다면 배열인가?', response.data?.products ? Array.isArray(response.data.products) : '없음');
      console.log('products 필드가 있다면 길이는?', response.data?.products ? response.data.products.length : '없음');
      
      // 백엔드 응답 구조에 맞게 데이터 처리 (products 필드 우선)
      if (response.data && response.data.products && Array.isArray(response.data.products)) {
        if (response.data.products.length === 0) {
          console.log('⚠️ 백엔드에서 빈 배열을 반환했습니다.');
          console.log('가능한 원인:');
          console.log('1. 사용자가 아직 구매한 상품이 없음');
          console.log('2. 구매한 상품의 판매자 정보가 누락됨');
          console.log('3. 해당 판매자들이 현재 판매 중인 상품이 없음');
          console.log('4. 리뷰가 있는 상품이 없음 (kok_review_cnt > 0 조건)');
          console.log('💡 해결 방법: 상품을 구매하여 구매 이력을 만들어보세요!');
          
          // 빈 배열이지만 정상적인 응답인 경우
          setKokStoreBestItems([]);
          return;
        }
        
        console.log('✅ 스토어 베스트 상품 데이터 설정:', response.data.products.length);
        
        // 백엔드에서 직접 제공하는 별점과 리뷰 수 사용
        const transformedProducts = response.data.products.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price,
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_product_image || product.kok_thumbnail,
          rating: product.kok_review_score || 0, // 백엔드에서 제공하는 별점
          reviewCount: product.kok_review_cnt || 0, // 백엔드에서 제공하는 리뷰 수
          storeName: product.kok_store_name
        }));
        
        console.log('변환된 상품 데이터:', transformedProducts);
        console.log('변환된 상품의 별점과 리뷰수:', transformedProducts.map(p => ({ name: p.name, rating: p.rating, reviewCount: p.reviewCount })));
        setKokStoreBestItems(transformedProducts);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('API 응답이 배열 형태입니다 (products 필드 없음).');
        console.log('배열 길이:', response.data.length);
        console.log('배열 내용:', response.data);
        
        if (response.data.length === 0) {
          console.log('⚠️ 백엔드에서 빈 배열을 직접 반환했습니다.');
          setKokStoreBestItems([]);
          return;
        }
        
        // 배열 형태로 직접 응답받은 경우 (하위 호환성)
        const transformedProducts = response.data.map(product => ({
          id: product.kok_product_id,
          name: product.kok_product_name,
          originalPrice: product.kok_discount_rate > 0 
            ? Math.round(product.kok_discounted_price / (1 - product.kok_discount_rate / 100)) 
            : product.kok_discounted_price,
          discountPrice: product.kok_discounted_price,
          discountRate: product.kok_discount_rate,
          image: product.kok_product_image || product.kok_thumbnail,
          rating: product.kok_review_score || 0,
          reviewCount: product.kok_review_cnt || 0,
          storeName: product.kok_store_name
        }));
        setKokStoreBestItems(transformedProducts);
      } else {
        console.log('API 응답 구조가 예상과 다릅니다. 응답 데이터:', response.data);
        console.log('응답 데이터의 모든 키:', response.data ? Object.keys(response.data) : '데이터 없음');
        console.log('응답 데이터의 값들:', response.data ? Object.values(response.data) : '데이터 없음');
        
        // 빈 배열이지만 products 필드가 있는 경우
        if (response.data && response.data.products && response.data.products.length === 0) {
          console.log('products 필드는 있지만 빈 배열입니다. 백엔드에 데이터가 없는 것 같습니다.');
          setKokStoreBestItems([]);
        } else {
          console.log('예상하지 못한 응답 구조입니다.');
          setKokStoreBestItems([]);
        }
      }
    } catch (err) {
      console.error('KOK 스토어 베스트 상품 데이터 로딩 실패:', err);
      
      // 에러 상세 정보 로깅
      if (err.response) {
        console.error('에러 응답 상태:', err.response.status);
        console.error('에러 응답 데이터:', err.response.data);
        console.error('에러 응답 헤더:', err.response.headers);
      } else if (err.request) {
        console.error('요청은 전송되었지만 응답을 받지 못함:', err.request);
      } else {
        console.error('요청 설정 중 에러 발생:', err.message);
      }
      
      // 500 에러인 경우 사용자에게 알림
      if (err.response?.status === 500) {
        console.error('백엔드 서버 내부 오류 (500) - 백엔드 개발자에게 문의 필요');
        console.error('에러 상세 정보:', {
          endpoint: '/api/kok/store-best-items',
          status: err.response.status,
          data: err.response.data,
          message: 'KokOrder 모델에 price_id 속성이 없는 것으로 추정됨'
        });
        // 사용자에게는 조용히 빈 배열 설정 (섹션 숨김)
      }
      
      console.log('API 호출 실패로 빈 배열을 설정합니다.');
      setKokStoreBestItems([]);
    }
  };

  // 검색 핸들러 (콕 쇼핑몰 타입으로 검색 페이지 이동)
  const handleKokSearch = (query) => {
    // 콕 쇼핑몰 타입으로 검색 페이지로 이동
    if (query && query.trim()) {
      const searchUrl = `/kok/search?q=${encodeURIComponent(query.trim())}`;
      navigate(searchUrl);
    } else {
      navigate('/kok/search');
    }
  };

  // 알림 클릭 핸들러
  const handleKokNotificationClick = () => {
    console.log('알림 클릭됨');
    navigate('/notifications');
  };

  // 백엔드 서버 상태를 확인하는 테스트 함수
  const testBackendConnection = async () => {
    try {
      console.log('🔍 백엔드 서버 연결 상태 확인 중...');
      
      // 간단한 헬스체크
      const healthResponse = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      });
      console.log('헬스체크 응답:', healthResponse.status);
      
      // API 엔드포인트 테스트 (토큰 포함)
      const token = localStorage.getItem('access_token');
      const testResponse = await api.get('/api/kok/store-best-items', {
        params: { sort_by: 'review_count' },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('API 테스트 응답:', testResponse.status);
      console.log('API 테스트 데이터:', testResponse.data);
      
      return true;
    } catch (error) {
      console.error('백엔드 서버 연결 테스트 실패:', error);
      return false;
    }
  };

  useEffect(() => {
    setKokFadeIn(true);
    
    // 모든 API 호출을 병렬로 처리
    const loadAllData = async () => {
      try {
        setKokLoading(true);
        
        // 공개 페이지이므로 토큰 검증 없이 API 호출
        console.log('KokMain - 공개 페이지로 접근, 토큰 검증 없이 진행');
        
        await Promise.all([
          fetchKokProducts(),
          fetchKokTopSellingProducts(),
          fetchKokStoreBestItems()
        ]);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setKokLoading(false);
      }
    };
    
    loadAllData();
  }, []);
  
  // 사용자 정보가 변경될 때마다 콘솔에 출력 (디버깅용)
  useEffect(() => {
    console.log('KokMain - 사용자 정보 상태:', {
      user: user,
      isLoggedIn: isLoggedIn,
      hasUser: !!user,
      userEmail: user?.email,
      hasToken: !!user?.token
    });
  }, [user, isLoggedIn]);

  // 데이터 상태 디버깅 (한 번만 실행)
  useEffect(() => {
    if (!kokLoading) {
      console.log('📊 KokMain - 데이터 상태 요약:', {
        kokProducts: kokProducts.length,
        kokTopSellingProducts: kokTopSellingProducts.length,
        kokStoreBestItems: kokStoreBestItems.length,
        kokLoading: kokLoading
      });
      
      // 데이터가 없는 경우 상세 로깅
      if (kokProducts.length === 0) {
        console.log('⚠️ 오늘의 특가 상품 데이터가 없습니다.');
      } else {
        console.log('✅ 오늘의 특가 상품:', kokProducts.length, '개');
      }
      
      if (kokTopSellingProducts.length === 0) {
        console.log('⚠️ 베스트 판매 상품 데이터가 없습니다.');
      } else {
        console.log('✅ 베스트 판매 상품:', kokTopSellingProducts.length, '개');
      }
      
      if (kokStoreBestItems.length === 0) {
        console.log('⚠️ 스토어 베스트 상품 데이터가 없습니다.');
        console.log('💡 이는 정상적인 상황입니다. 사용자가 아직 구매한 상품이 없어서 개인 맞춤 추천을 받을 수 없습니다.');
      } else {
        console.log('✅ 스토어 베스트 상품:', kokStoreBestItems.length, '개');
      }
      
      // 모든 데이터가 없는 경우
      if (kokProducts.length === 0 && kokTopSellingProducts.length === 0 && kokStoreBestItems.length === 0) {
        console.log('🚨 모든 상품 데이터가 비어있습니다. 백엔드 서버 상태를 확인해주세요.');
        console.log('확인사항:');
        console.log('1. 백엔드 서버가 실행 중인지 확인');
        console.log('2. 프록시 설정이 올바른지 확인 (setupProxy.js)');
        console.log('3. 백엔드 API 엔드포인트가 올바른지 확인');
        console.log('4. 데이터베이스에 상품 데이터가 있는지 확인');
      } else if (kokStoreBestItems.length === 0 && (kokProducts.length > 0 || kokTopSellingProducts.length > 0)) {
        console.log('ℹ️ 스토어 베스트 상품만 없는 상황입니다. 이는 정상적인 동작입니다.');
        console.log('사용자가 상품을 구매하면 해당 스토어의 베스트 상품을 추천받을 수 있습니다.');
      }
    }
  }, [kokLoading]); // kokLoading만 의존성으로 설정

  return (
    <div className={`kok-home-shopping-main ${kokFadeIn ? 'kok-fade-in' : ''}`}>
      <HeaderNavMain 
        title="콕 쇼핑몰" 
        onNotificationsClick={handleKokNotificationClick}
        onSearch={handleKokSearch}
      />
      <main className="kok-main-content">
        {kokLoading ? (
          <Loading message="데이터를 불러오는 중 ..." />
        ) : (
          <>
            <KokProductSection 
              title="오늘의 특가" 
              products={kokProducts.slice(0, 12)} 
              type="discount-grid"
              showMore={true}
              sectionStyle={{
                margin: '0 0 24px 0',
                padding: '0 0px'
              }}
              containerStyle={{
                gap: '12px'
              }}
              cardStyle={{
                boxShadow: 'none'
              }}
            />
        
        <KokProductSection 
          title="베스트 판매 상품" 
          products={kokTopSellingProducts.slice(0, 5)} 
          type="non-duplicated-grid"
          showMore={true}
          sectionStyle={{
            margin: '0 0 24px 0',
            padding: '0 0px'
          }}
          containerStyle={{
            gap: '14px'
          }}
          cardStyle={{
            boxShadow: 'none'
          }}
        />
        
        {/* 최근 이용 스토어 내 인기 상품 - API 실패 시 숨김 */}
        {kokStoreBestItems.length > 0 && (
          <KokProductSection 
            title="최근 이용 스토어 내 인기 상품" 
            products={kokStoreBestItems.slice(0, 3)} 
            type="fixed"
            showMore={true}
            sectionStyle={{
              margin: '0 0 24px 0',
              padding: '0 0px'
            }}
            containerStyle={{
              gap: '4px'
            }}
            cardStyle={{
              boxShadow: 'none'
            }}
          />
        )}
        
                 {/* API 실패 시 대체 섹션 표시 */}
         {kokStoreBestItems.length === 0 && (
           <div style={{ 
             textAlign: 'center', 
             padding: '20px',
             color: '#999',
             fontSize: '13px',
             backgroundColor: '#f8f9fa',
             borderRadius: '8px',
             margin: '0 16px'
           }}>
             <div style={{ marginBottom: '8px' }}>
               <span role="img" aria-label="info" style={{ fontSize: '16px', marginRight: '6px' }}>ℹ️</span>
               최근 이용 스토어 내 인기 상품
             </div>
             <div style={{ fontSize: '12px', color: '#666' }}>
               서비스 점검 중입니다
             </div>
           </div>
         )}

          </>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default KokMain;