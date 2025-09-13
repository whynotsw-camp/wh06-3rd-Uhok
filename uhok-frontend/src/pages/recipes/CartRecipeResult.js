import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../../layout/BottomNav';
import HeaderNavRecipeRecommendation from '../../layout/HeaderNavRecipeRecommendation';
import Loading from '../../components/Loading';
import IngredientTag from '../../components/IngredientTag';
import '../../styles/recipe_result.css';
import '../../styles/ingredient-tag.css';
import fallbackImg from '../../assets/no_items.png';
import bookmarkIcon from '../../assets/bookmark-icon.png';
import { recipeApi } from '../../api/recipeApi';

const CartRecipeResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 상태 관리
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('cart'); // cart 또는 mypage
  const [isInitialized, setIsInitialized] = useState(false);
  
  // RecipeResult.js와 동일한 추가 상태들
  const [combinationNumber, setCombinationNumber] = useState(1);
  const [hasMoreCombinations, setHasMoreCombinations] = useState(false);
  const [recipeIngredientsCache, setRecipeIngredientsCache] = useState(new Map());
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [isFetchingIngredients, setIsFetchingIngredients] = useState(false);
  const [seenRecipeIds, setSeenRecipeIds] = useState(new Set());
  
  // 조합별로 결과를 캐싱하여 중복 요청 방지
  const combinationCache = useMemo(() => new Map(), []);

  // 레시피별 상세 정보 가져오기 (재료 정보 + 제목 등) - 배치 처리로 개선
  const fetchRecipeIngredients = useCallback(async (recipeIds) => {
    if (isFetchingIngredients) {
      return;
    }

    // 이미 캐시된 레시피는 제외
    const uncachedIds = recipeIds.filter(id => !recipeIngredientsCache.has(id));
    if (uncachedIds.length === 0) {
      return;
    }

    try {
      setIsFetchingIngredients(true);
      setIngredientsLoading(true);
      
      // 최대 3개씩 배치로 처리
      const batchSize = 3;
      const newCache = new Map(recipeIngredientsCache);
      
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        
        // 병렬로 요청하되 각 배치 사이에 약간의 지연
        const promises = batch.map(async (recipeId) => {
          try {
            const recipeDetail = await recipeApi.getRecipeDetail(recipeId);
            if (recipeDetail) {
              return {
                recipeId,
                used_ingredients: recipeDetail.materials || [],
                total_ingredients: recipeDetail.materials ? recipeDetail.materials.length : 0,
                recipe_title: recipeDetail.recipe_title || recipeDetail.name || recipeDetail.title,
                cooking_introduction: recipeDetail.cooking_introduction,
                number_of_serving: recipeDetail.number_of_serving,
                scrap_count: recipeDetail.scrap_count || recipeDetail.scrapCount
              };
            }
          } catch (error) {
            console.log(`레시피 ${recipeId} 상세 정보 조회 실패:`, error);
          }
          return null;
        });
        
        const results = await Promise.all(promises);
        
        // 결과를 캐시에 저장
        results.forEach(result => {
          if (result) {
            newCache.set(result.recipeId, result);
          }
        });
        
        // 배치 간 약간의 지연 (서버 부하 방지)
        if (i + batchSize < uncachedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setRecipeIngredientsCache(newCache);
    } catch (error) {
      console.log('레시피 상세 정보 배치 조회 실패:', error);
    } finally {
      setIsFetchingIngredients(false);
      setIngredientsLoading(false);
    }
  }, [isFetchingIngredients, recipeIngredientsCache]);

  // 백엔드 응답의 이미지 키 다양성 대응 및 로컬 폴백 사용
  const getRecipeImageSrc = (recipe, idx) => {
    const candidates = [
      recipe?.thumbnail_url,
      recipe?.thumbnailUrl,
      recipe?.image_url,
      recipe?.img_url,
      recipe?.main_image_url,
      recipe?.image,
      recipe?.thumbnail,
    ].filter((v) => typeof v === 'string' && v.length > 0);
    if (candidates.length > 0) return candidates[0];
    return fallbackImg;
  };

  // keyword_extraction을 ingredient-tag에 표시하기 위한 정규화
  const displayIngredients = useMemo(() => {
    console.log('🔍 displayIngredients 처리 시작:', {
      ingredients: ingredients,
      타입: typeof ingredients,
      배열여부: Array.isArray(ingredients),
      길이: ingredients ? ingredients.length : 0
    });
    
    if (!Array.isArray(ingredients)) {
      console.log('⚠️ ingredients가 배열이 아님, 빈 배열 반환');
      return [];
    }
    
    const result = ingredients.map((ing, index) => {
      console.log(`🔍 ingredient ${index} 처리:`, {
        ingredient: ing,
        타입: typeof ing
      });
      
      // keyword_extraction은 문자열 배열이므로 그대로 사용
      if (typeof ing === 'string') {
        console.log(`✅ 문자열 ingredient ${index}:`, ing);
        return ing;
      }
      
      // 객체 형태인 경우 (기존 호환성 유지)
      const name = ing?.name ?? '';
      const amount = ing?.amount;
      const unit = ing?.unit;
      const amountPart = amount != null && amount !== '' ? ` ${amount}` : '';
      const unitPart = unit ? `${unit}` : '';
      const result = `${name}${amountPart}${unitPart}`.trim();
      console.log(`✅ 객체 ingredient ${index} 변환 결과:`, result);
      return result;
    });
    
    console.log('🔍 displayIngredients 최종 결과:', result);
    return result;
  }, [ingredients]);

  // 정렬: matched_ingredient_count가 있을 경우 내림차순 정렬하여 표시
  const sortedRecipes = useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    const hasMatched = recipes.some(r => typeof r?.matched_ingredient_count === 'number');
    if (!hasMatched) return recipes;
    return [...recipes].sort((a, b) => (b?.matched_ingredient_count || 0) - (a?.matched_ingredient_count || 0));
  }, [recipes]);

  useEffect(() => {
    // 이미 초기화되었으면 중복 실행 방지
    if (isInitialized) {
      return;
    }
    
    if (location.state) {
      console.log('CartRecipeResult - Location state received:', location.state);
      console.log('Recipes from state:', location.state.recipes);
      console.log('Ingredients from state:', location.state.ingredients);
      console.log('Ingredients type:', typeof location.state.ingredients);
      console.log('Ingredients is array:', Array.isArray(location.state.ingredients));
      
      const initialRecipes = location.state.recipes || [];
      const initialIngredients = location.state.ingredients || [];
      const initialPage = location.state.page || 1;
      
      // 에러 상태 확인
      if (location.state.error) {
        setError(location.state.errorMessage || '레시피 검색 중 오류가 발생했습니다.');
        setRecipes([]);
        setIngredients(initialIngredients);
        setTotal(0);
        setCurrentPage(initialPage);
        setCombinationNumber(1);
        setHasMoreCombinations(false);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
      
      // 초기 레시피 중복 체크 및 필터링
      const uniqueInitialRecipes = initialRecipes.filter(recipe => {
        const recipeId = recipe.recipe_id || recipe.id;
        if (seenRecipeIds.has(recipeId)) {
          console.log(`⚠️ 초기 로드에서 중복 레시피 제외: ${recipeId} - ${recipe.recipe_title || recipe.name}`);
          return false;
        }
        return true;
      });
      
      // 초기 레시피 ID들을 seenRecipeIds에 추가
      const initialRecipeIds = uniqueInitialRecipes.map(recipe => recipe.recipe_id || recipe.id);
      setSeenRecipeIds(prev => new Set([...prev, ...initialRecipeIds]));
      
      console.log(`🔍 초기 레시피 로드 확인:`, {
        totalRecipes: initialRecipes.length,
        uniqueRecipes: uniqueInitialRecipes.length,
        filteredOut: initialRecipes.length - uniqueInitialRecipes.length
      });
      
      setRecipes(uniqueInitialRecipes);
      setIngredients(initialIngredients);
      setTotal(location.state.total || 0);
      setCurrentPage(initialPage);
      setCombinationNumber(location.state.combination_number || 1);
      setHasMoreCombinations(location.state.has_more_combinations || false);
      setSearchType(location.state.searchType || 'cart'); // cart 또는 mypage
      
      // 초기 데이터를 캐시에 저장
      if (initialRecipes.length > 0) {
        const cacheKey = `${initialIngredients.join(',')}-${initialPage}`;
        const cacheData = {
          recipes: initialRecipes,
          combination_number: location.state.combination_number || initialPage,
          has_more_combinations: location.state.has_more_combinations || false,
          total: location.state.total || 0
        };
        combinationCache.set(cacheKey, cacheData);
        console.log(`초기 조합 ${initialPage} 데이터 캐시 저장`);
      }
      
      setLoading(false);
      setIsInitialized(true);
    } else {
      // state가 없으면 이전 페이지로 이동
      navigate('/recipes');
    }
  }, [location.state, navigate, combinationCache, isInitialized]);

  // 레시피 상세 정보 가져오기 (재료 정보 + 제목 등) - 배치 처리
  useEffect(() => {
    if (recipes.length > 0 && !isFetchingIngredients) {
      const recipeIds = recipes
        .map(recipe => recipe.recipe_id || recipe.id)
        .filter(id => id && !recipeIngredientsCache.has(id));
      
      if (recipeIds.length > 0) {
        fetchRecipeIngredients(recipeIds);
      }
    }
  }, [recipes, recipeIngredientsCache, fetchRecipeIngredients, isFetchingIngredients]);

  const handleBack = () => {
    // 검색 타입에 따라 다른 페이지로 이동
    if (searchType === 'cart') {
      navigate('/cart');
    } else if (searchType === 'mypage') {
      navigate('/mypage');
    } else {
      navigate('/recipes');
    }
  };

  const handleRecipeClick = (recipe) => {
    console.log('레시피 클릭:', recipe);
    // 레시피 상세 페이지로 이동
    const recipeId = recipe.RECIPE_ID || recipe.recipe_id || recipe.id;
    if (recipeId) {
      // 재료 상태 정보를 state로 전달
      navigate(`/recipes/${recipeId}`, {
        state: {
          ingredients: ingredients,
          recipeData: recipe
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="recipe-result-page">
        <HeaderNavRecipeRecommendation onBackClick={handleBack} />
        <div className="selected-ingredients-section">
          <div className="search-keyword-display">
            <span className="search-keyword">
              {Array.isArray(ingredients) && ingredients.map(ing => typeof ing === 'string' ? ing : ing.name).join(', ')}
            </span>
            <span className="recommendation-text">을 사용한 레시피를 추천드려요</span>
          </div>
        </div>
        <main className="recipe-list">
          <Loading message="레시피를 불러오는 중..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="recipe-result-page">
      {/* 헤더 */}
      <HeaderNavRecipeRecommendation onBackClick={handleBack} />

      {/* keyword_extraction을 ingredient-tag로 표시 */}
      <div className="selected-ingredients-section">
        <div className="search-keyword-display">
          <span className="search-keyword">
            {displayIngredients.map(ing => typeof ing === 'string' ? ing : ing.name).join(', ')}
          </span>
          <span className="recommendation-text">을 사용한 레시피를 추천드려요</span>
        </div>
      </div>

      {/* 레시피 목록 */}
      <main className="recipe-list">
        {loading && (
          <div className="loading-overlay">
            <Loading message="레시피를 추천받는 중... 잠시만 기다려주세요." />
          </div>
        )}
        {ingredientsLoading && (
          <div className="ingredients-loading">
            <Loading message="재료 정보를 불러오는 중..." />
          </div>
        )}
        {!loading && !ingredientsLoading && error && (
          <div className="recipe-card">
            <div className="recipe-info">
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
              <button 
                className="retry-btn" 
                onClick={handleBack}
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}
        {!loading && !ingredientsLoading && !error && sortedRecipes.length > 0 && (
          sortedRecipes.map((recipe, idx) => {
            // recipe 객체를 그대로 사용 (recipe_title 컬럼 사용)
            const recipeObj = recipe;
            
            // 디버깅을 위한 콘솔 로그 추가
            console.log(`🔍 레시피 ${idx + 1} 데이터:`, {
              전체_데이터: recipeObj,
              사용가능한_키: Object.keys(recipeObj),
              제목_필드들: {
                recipe_title: recipeObj.recipe_title,
                name: recipeObj.name,
                title: recipeObj.title
              }
            });
            
            // 상세 정보 가져오기 (캐시에서)
            const recipeDetail = recipeIngredientsCache.get(recipeObj.recipe_id || recipeObj.id);
            
            // 캐시된 상세 정보가 있으면 우선 사용, 없으면 기본 데이터 사용
            const displayTitle = recipeDetail?.recipe_title || recipeObj.recipe_title || recipeObj.cooking_introduction || '레시피';
            const displayDescription = recipeDetail?.cooking_introduction || recipeObj.cooking_introduction;
            const displayServing = recipeDetail?.number_of_serving || recipeObj.number_of_serving;
            const displayScrapCount = recipeDetail?.scrap_count || recipeObj.scrap_count || recipeObj.scrapCount || 0;
            const displayIngredients = recipeDetail?.used_ingredients || recipeObj.used_ingredients;
            
            return (
              <div key={recipeObj.recipe_id || recipeObj.id || idx} 
                   className="recipe-card cart-recipe-card" 
                   onClick={() => handleRecipeClick(recipeObj)}>
                <div className="recipe-image">
                  <img 
                    src={getRecipeImageSrc(recipeObj, idx)} 
                    alt={displayTitle} 
                    onError={(e)=>{ e.currentTarget.src = fallbackImg; }} 
                  />
                </div>
                <div className="recipe-info">
                  <h3 className="recipe-name" title={displayTitle}>
                    {displayTitle.length > 50 
                      ? displayTitle.substring(0, 50) + '...' 
                      : displayTitle}
                  </h3>
                  <div className="recipe-stats">
                    <span className="serving serving-small">{displayServing}</span>
                    <span className="separator"> | </span>
                    <span className="scrap-count">
                      <img className="bookmark-icon" src={bookmarkIcon} alt="북마크" />
                      <span className="bookmark-count">{displayScrapCount}</span>
                    </span>
                  </div>
                  
                  {/* 레시피 설명 표시 */}
                  {displayDescription && (
                    <p className="recipe-description">{displayDescription}</p>
                  )}
                  
                  {/* 재료 정보 표시 - homeshopping-recommendation 스타일 적용 */}
                  {displayIngredients && displayIngredients.length > 0 && (
                    <div className="used-ingredients-list">
                      {displayIngredients.slice(0, 3).map((ingredient, idx) => (
                        <span key={idx} className="used-ingredient-item">
                          {typeof ingredient === 'string' ? ingredient : ingredient.material_name || ingredient.name || ingredient}
                        </span>
                      ))}
                      {displayIngredients.length > 3 && (
                        <span className="more-ingredients">외 {displayIngredients.length - 3}개</span>
                      )}
                    </div>
                  )}
                  

                </div>
              </div>
            );
          })
        )}
        {!loading && !ingredientsLoading && !error && recipes.length === 0 && (
          <div className="no-results">
            <p>추천할 수 있는 레시피가 없습니다.</p>
            <p>다른 상품을 선택해보세요.</p>
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default CartRecipeResult;
