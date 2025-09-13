// React 라이브러리 import
import React from 'react';
// React Router 관련 컴포넌트들 import
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 앱 전체 스타일 CSS 파일 import
import './styles/App.css';
// 사용자 Context Provider import
import { UserProvider } from './contexts/UserContext';

// ===== 페이지 컴포넌트들 import =====
// 사용자 관련 페이지
import Login from './pages/user/Login';
import Signup from './pages/user/Signup';
import Notification from './pages/user/Notification';
// 홈쇼핑 관련 페이지
import Main from './pages/home_shopping/main';
import Schedule from './pages/home_shopping/Schedule';
import HomeShoppingSearch from './pages/home_shopping/HomeShoppingSearch';
import HomeShoppingProductDetail from './pages/home_shopping/HomeShoppingProductDetail';

// KOK 쇼핑 관련 페이지
import KokMain from './pages/kok_shopping/KokMain';
import KokProductDetail from './pages/kok_shopping/KokProductDetail';
import KokProductListPage from './pages/kok_shopping/KokProductListPage';
import KokSearch from './pages/kok_shopping/KokSearch';

// 레시피 관련 페이지
import RecipeRecommendation from './pages/recipes/RecipeRecommendation';
import RecipeResult from './pages/recipes/RecipeResult';
import CartRecipeResult from './pages/recipes/CartRecipeResult';
import RecipeDetail from './pages/recipes/RecipeDetail';
import HomeShoppingRecipeRecommendation from './pages/recipes/HomeShoppingRecipeRecommendation';
// 라이브 스트림 관련 페이지
import LiveStreamPage from './pages/LiveStreamPage';

// 결제 관련 페이지
import KokPayment from './pages/user/KokPayment';

// ===== 전역 상태 관리 Provider import =====
// 마이페이지 컴포넌트 import
import MyPage from './pages/user/MyPage';
// 장바구니 컴포넌트 import
import Cart from './pages/user/Cart';
// 주문 내역 컴포넌트 import
import OrderList from './pages/user/OrderList';
// 찜한 상품 목록 컴포넌트 import
import WishList from './pages/user/WishList';
// 전역 알림 상태 관리 Provider import
// Header/Notification removed

// ===== 메인 앱 컴포넌트 =====
// React 애플리케이션의 최상위 컴포넌트
function App() {
  // 앱 전체 JSX 반환
  return (
    // 사용자 정보를 모든 하위 컴포넌트에서 사용할 수 있도록 Provider로 감싸기
    <UserProvider>
      {/* header/notification removed */}
        {/* 앱 전체 래퍼 컨테이너 */}
        <div className="wrapper">
          {/* 메인 앱 컨테이너 */}
          <div className="App">
            {/* React Router 설정 - 브라우저 라우팅 활성화 */}
            <Router>
              {/* 라우트 정의 컨테이너 */}
              <Routes>
              {/* ===== 메인 페이지 라우트 ===== */}
              {/* 루트 경로 (/) - 메인 페이지 */}
              <Route path="/" element={<Main />} />  
              
              {/* ===== 사용자 인증 라우트 ===== */}
              {/* 로그인 경로 (/login) - 로그인 페이지 */}
              <Route path="/login" element={<Login />} />
              {/* 회원가입 경로 (/signup) - 회원가입 페이지 */}
              <Route path="/signup" element={<Signup />} />
              
              {/* ===== 기타 라우트 ===== */}
              {/* 메인 경로 (/main) - Main 페이지로 설정 */}
              <Route path="/main" element={<Main />} />
              {/* 편성표 경로 (/schedule) - Schedule 페이지로 설정 */}
              <Route path="/schedule" element={<Schedule />} />
              {/* 홈쇼핑 검색 경로 (/homeshopping/search) - HomeShoppingSearch 페이지로 설정 */}
              <Route path="/homeshopping/search" element={<HomeShoppingSearch />} />
              {/* 홈쇼핑 상품 상세 경로 (/homeshopping/product/:live_id) - HomeShoppingProductDetail 페이지로 설정 */}
              <Route path="/homeshopping/product/:live_id" element={<HomeShoppingProductDetail />} />
              {/* 라이브 스트림 경로 (/live-stream) - 라이브 스트림 페이지 */}
              <Route path="/live-stream" element={<LiveStreamPage />} />

              {/* ===== KOK 라우트 ===== */}

              {/* KOK 메인 경로 (/kok) - KOK 메인 페이지 */}
              <Route path="/kok" element={<KokMain />} />
              {/* 제품 상세 경로 (/kok/product/:productId) - 제품 상세 페이지 */}
              <Route path="/kok/product/:productId" element={<KokProductDetail />} />
              {/* 제품 목록 경로 (/kok/products/:sectionType) - 제품 목록 페이지 */}
              <Route path="/kok/products/:sectionType" element={<KokProductListPage />} />
              {/* 콕 검색 경로 (/kok/search) - 콕 검색 페이지 */}
              <Route path="/kok/search" element={<KokSearch />} />
              
                              {/* 레시피 추천 경로 (/recipes) - 레시피 추천 페이지 */}
                <Route path="/recipes" element={<RecipeRecommendation />} />
                
                {/* 레시피 결과 경로 (/recipes/result) - 레시피 추천 결과 페이지 */}
                <Route path="/recipes/result" element={<RecipeResult />} />
                
                {/* 장바구니/마이페이지 레시피 결과 경로 (/recipes/cart-result) - 새로운 통일된 API 결과 페이지 */}
                <Route path="/recipes/cart-result" element={<CartRecipeResult />} />
                
                {/* 레시피 결과 경로 (/recipes/by-ingredients) - 레시피 추천 결과 페이지 (이전 버전 호환) */}
                <Route path="/recipes/by-ingredients" element={<RecipeResult />} />
                
                {/* 홈쇼핑 상품 기반 레시피 추천 경로 (/recipes/homeshopping-recommendation) */}
                <Route path="/recipes/homeshopping-recommendation" element={<HomeShoppingRecipeRecommendation />} />
                
                {/* 레시피 상세 경로 (/recipes/:recipeId) - 레시피 상세 페이지 */}
                <Route path="/recipes/:recipeId" element={<RecipeDetail />} />
              
              {/* 마이페이지 경로 (/mypage) - 마이페이지 */}
              <Route path="/mypage" element={<MyPage />} />
              {/* 장바구니 경로 (/cart) - 장바구니 페이지 */}
              <Route path="/cart" element={<Cart />} />
              {/* 주문 내역 경로 (/orderlist) - 주문 내역 페이지 */}
              <Route path="/orderlist" element={<OrderList />} />
              {/* 찜한 상품 목록 경로 (/wishlist) - 찜한 상품 목록 페이지 */}
              <Route path="/wishlist" element={<WishList />} />
              {/* 알림 경로 (/notifications) - 알림 페이지 */}
              <Route path="/notifications" element={<Notification />} />
              {/* KOK 결제 경로 (/kok/payment) - 결제 페이지 */}
              <Route path="/kok/payment" element={<KokPayment />} />
            </Routes>
          </Router>
        </div>
      </div>
      
    </UserProvider>
  );
}

// 앱 컴포넌트를 기본 export로 내보내기
export default App;