import React, { lazy, Suspense } from 'react';
import Loading from './Loading';

// 로딩 컴포넌트
const LoadingFallback = ({ message = "로딩 중..." }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px' 
  }}>
    <Loading message={message} />
  </div>
);

// 페이지별 Lazy 컴포넌트들
export const LazyKokMain = lazy(() => import('../pages/kok_shopping/KokMain'));
export const LazyKokProductDetail = lazy(() => import('../pages/kok_shopping/KokProductDetail'));
export const LazyKokProductListPage = lazy(() => import('../pages/kok_shopping/KokProductListPage'));
export const LazyHomeShoppingMain = lazy(() => import('../pages/home_shopping/main'));
export const LazyHomeShoppingProductDetail = lazy(() => import('../pages/home_shopping/HomeShoppingProductDetail'));
export const LazyRecipeDetail = lazy(() => import('../pages/recipes/RecipeDetail'));
export const LazyRecipeRecommendation = lazy(() => import('../pages/recipes/RecipeRecommendation'));
export const LazyRecipeResult = lazy(() => import('../pages/recipes/RecipeResult'));
export const LazyMyPage = lazy(() => import('../pages/user/MyPage'));
export const LazyCart = lazy(() => import('../pages/user/Cart'));
export const LazyWishList = lazy(() => import('../pages/user/WishList'));

// Lazy 컴포넌트 래퍼
export const withSuspense = (Component, fallbackMessage) => (props) => (
  <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
    <Component {...props} />
  </Suspense>
);

// 페이지별 래핑된 컴포넌트들
export const KokMainWithSuspense = withSuspense(LazyKokMain, "콕 쇼핑몰을 불러오는 중...");
export const KokProductDetailWithSuspense = withSuspense(LazyKokProductDetail, "상품 정보를 불러오는 중...");
export const KokProductListPageWithSuspense = withSuspense(LazyKokProductListPage, "상품 목록을 불러오는 중...");
export const HomeShoppingMainWithSuspense = withSuspense(LazyHomeShoppingMain, "홈쇼핑을 불러오는 중...");
export const HomeShoppingProductDetailWithSuspense = withSuspense(LazyHomeShoppingProductDetail, "상품 정보를 불러오는 중...");
export const RecipeDetailWithSuspense = withSuspense(LazyRecipeDetail, "레시피를 불러오는 중...");
export const RecipeRecommendationWithSuspense = withSuspense(LazyRecipeRecommendation, "레시피 추천을 불러오는 중...");
export const RecipeResultWithSuspense = withSuspense(LazyRecipeResult, "레시피 결과를 불러오는 중...");
export const MyPageWithSuspense = withSuspense(LazyMyPage, "마이페이지를 불러오는 중...");
export const CartWithSuspense = withSuspense(LazyCart, "장바구니를 불러오는 중...");
export const WishListWithSuspense = withSuspense(LazyWishList, "위시리스트를 불러오는 중...");
