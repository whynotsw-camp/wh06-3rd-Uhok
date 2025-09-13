import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { homeShoppingApi } from '../../api/homeShoppingApi';
import BottomNav from '../../layout/BottomNav';
import HeaderNavRecipeRecommendation from '../../layout/HeaderNavRecipeRecommendation';
import Loading from '../../components/Loading';
import ModalManager, { showNoRecipeNotification, showLoginRequiredNotification, hideModal } from '../../components/LoadingModal';
import { useUser } from '../../contexts/UserContext';
import '../../styles/recipe_result.css';
import fallbackImg from '../../assets/no_items.png';
import bookmarkIcon from '../../assets/bookmark-icon.png';

const HomeShoppingRecipeRecommendation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: userLoading } = useUser();
  
  // 상태 관리
  const [recipes, setRecipes] = useState([]);
  const [productInfo, setProductInfo] = useState(null);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({ isVisible: false, modalType: 'loading' });
  
  // 로그인 상태 체크 및 레시피 추천 데이터 가져오기
  useEffect(() => {
    // 사용자 로딩이 완료될 때까지 대기
    if (userLoading) {
      return;
    }
    
    // 로그인하지 않은 경우 로그인 필요 모달 표시
    if (!user || !user.isLoggedIn) {
      console.log('❌ 로그인하지 않은 사용자, 레시피 추천 접근 차단');
      setModalState(showLoginRequiredNotification());
      setLoading(false);
      return;
    }
    
    const fetchRecipeRecommendations = async () => {
      try {
        setLoading(true);
        setError('');
        
        // location.state에서 product_id와 product_name 가져오기
        const { product_id, product_name } = location.state || {};
        
        if (!product_id) {
          setError('상품 정보가 없습니다.');
          setLoading(false);
          return;
        }
        
        // 상품 정보 설정
        setProductInfo({ product_id, product_name });
        
        console.log('🔍 홈쇼핑 상품 기반 레시피 추천 API 호출:', { product_id, product_name });
        
        // 레시피 추천 API 호출
        const response = await homeShoppingApi.getRecipeRecommendations(product_id);
        console.log('✅ 레시피 추천 API 응답:', response);
        
        if (response && response.recipes) {
          setRecipes(response.recipes);
          
          // extracted_keywords가 있으면 설정
          if (response.extracted_keywords && response.extracted_keywords.length > 0) {
            setExtractedKeywords(response.extracted_keywords);
            // console.log('🔑 추출된 키워드:', response.extracted_keywords);
          }
          
          // 레시피가 0개인 경우 모달 표시
          if (response.recipes.length === 0) {
            setModalState(showNoRecipeNotification());
          }
        } else {
          setRecipes([]);
          // 레시피가 없는 경우 모달 표시
          setModalState(showNoRecipeNotification());
        }
        
      } catch (error) {
        console.error('❌ 레시피 추천 가져오기 실패:', error);
        setError('레시피 추천을 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipeRecommendations();
  }, [location.state, user, userLoading]);
  
  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setModalState(hideModal());
    
    // 로그인 필요 모달인 경우 직전 페이지로 돌아가기
    if (modalState.modalType === 'alert' && modalState.alertMessage === '로그인이 필요한 서비스입니다.') {
      navigate(-1);
    }
  };

  // 레시피 클릭 시 상세 페이지로 이동
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };
  
  // 뒤로 가기
  const handleBackClick = () => {
    navigate(-1);
  };
  
  // 검색 페이지로 이동
  const handleSearchClick = () => {
    navigate('/recipes/recommendation');
  };
  
  // 모달 닫기 함수
  const closeModal = () => {
    setModalState(hideModal());
    // 모달 닫기 후 이전 페이지로 이동
    navigate(-1);
  };
  
  // 로딩 상태
  if (loading) {
    return (
      <div className="recipe-result-page">
        <HeaderNavRecipeRecommendation 
          onBackClick={handleBackClick}
          onSearchClick={handleSearchClick}
        />
        <div className="loading-container">
          <Loading message="레시피 추천을 불러오는 중..." />
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (error) {
    return (
      <div className="recipe-result-page">
        <HeaderNavRecipeRecommendation 
          onBackClick={handleBackClick}
          onSearchClick={handleSearchClick}
        />
                 <div className="error-container">
           <h2 className="error-title">레시피 추천을 불러올 수 없습니다</h2>
           <p className="error-message">{error}</p>
           <button className="retry-button" onClick={() => window.location.reload()}>
             다시 시도
           </button>
         </div>
      </div>
    );
  }
  
  return (
    <div className="recipe-result-page">
      {/* 헤더 */}
      <HeaderNavRecipeRecommendation 
        onBackClick={handleBackClick}
        onSearchClick={handleSearchClick}
      />
      
                    {/* 상품 정보 섹션 */}
        {productInfo && (
          <div className="product-info-section">
                                                                                                                                               <div className="search-keyword-title">
                <span className="keyword-text">
                  {extractedKeywords && extractedKeywords.length > 0 
                    ? extractedKeywords.join(', ')
                    : productInfo.product_name
                  }
                </span>
                <span className="recipe-suggestion-text">의 레시피를 추천드려요</span>
              </div>
          </div>
        )}
       
              {/* 레시피 목록 */}
       <main className="recipe-list">
         {recipes.length > 0 ? (
           recipes.map((recipe, index) => (
             <div 
               key={recipe.recipe_id || index}
               className="recipe-card"
               onClick={() => handleRecipeClick(recipe.recipe_id)}
             >
               {/* 레시피 이미지 */}
               <div className="recipe-image">
                 <img 
                   src={recipe.recipe_image_url || fallbackImg}
                   alt={recipe.recipe_name}
                   onError={(e) => {
                     e.target.src = fallbackImg;
                   }}
                 />
               </div>
               
               {/* 레시피 정보 */}
               <div className="recipe-info">
                 <h3 className="recipe-name" title={recipe.recipe_name}>
                   {recipe.recipe_name && recipe.recipe_name.length > 50 
                     ? recipe.recipe_name.substring(0, 50) + '...' 
                     : recipe.recipe_name}
                 </h3>
                 
                 {/* 인분수, 스크랩 수를 한 줄로 표시 */}
                 {(recipe.number_of_serving || recipe.scrap_count) && (
                   <div className="recipe-stats">
                     {recipe.number_of_serving && (
                       <span className="serving serving-small">{recipe.number_of_serving}</span>
                     )}
                     {recipe.number_of_serving && recipe.scrap_count && (
                       <span className="separator"> | </span>
                     )}
                     {recipe.scrap_count && (
                       <span className="scrap-count">
                         <img className="bookmark-icon" src={bookmarkIcon} alt="북마크" />
                         <span className="bookmark-count">{recipe.scrap_count}</span>
                       </span>
                     )}
                   </div>
                 )}
                 
                 {/* 설명 */}
                 {recipe.description && (
                   <p className="recipe-description">{recipe.description}</p>
                 )}
                 
                 {/* 재료 정보 */}
                 {recipe.ingredients && recipe.ingredients.length > 0 && (
                   <div className="used-ingredients-list">
                     {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
                       <span key={idx} className="used-ingredient-item">
                         {ingredient}
                       </span>
                     ))}
                     {recipe.ingredients.length > 3 && (
                       <span className="more-ingredients">외 {recipe.ingredients.length - 3}개</span>
                     )}
                   </div>
                 )}
               </div>
             </div>
           ))
         ) : (
           <div className="no-results">
             <p>추천 레시피가 없습니다</p>
             <p>이 상품으로 만들 수 있는 레시피를 찾을 수 없습니다.</p>
           </div>
         )}
       </main>
      
      {/* 하단 네비게이션 */}
      <BottomNav />
      
      {/* 모달 관리자 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default HomeShoppingRecipeRecommendation;
