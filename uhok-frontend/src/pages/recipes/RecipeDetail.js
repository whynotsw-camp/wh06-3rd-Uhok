import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNav from '../../layout/BottomNav';
import HeaderNavRecipeDetail from '../../layout/HeaderNavRecipeDetail';
import '../../styles/recipe_detail.css';
import fallbackImg from '../../assets/no_items.png';
import { recipeApi } from '../../api/recipeApi';
// LoadingModal import
import ModalManager, { showAlert, hideModal } from '../../components/LoadingModal';
import IngredientProductRecommendation from '../../components/IngredientProductRecommendation';
import { cartApi } from '../../api/cartApi';

// 새로운 API 구조에서는 이미 올바른 재료 상태가 반환되므로 별도의 처리 함수가 필요 없음

const RecipeDetail = () => {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const location = useLocation();
  
  // 상태 관리
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [kokProducts, setKokProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // ===== 모달 상태 관리 =====
  const [modalState, setModalState] = useState({ isVisible: false });

  // ===== 모달 핸들러 =====
  const handleModalClose = () => {
    setModalState(hideModal());
  };
  const [ingredientsStatus, setIngredientsStatus] = useState({
    ingredients_status: {
      owned: [],
      cart: [],
      not_owned: []
    },
    summary: {
      total_ingredients: 0,
      owned_count: 0,
      cart_count: 0,
      not_owned_count: 0
    }
  });

  // 레시피 상세 정보 조회
  useEffect(() => {
    const fetchRecipeDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 레시피 상세 정보 조회
        const recipeData = await recipeApi.getRecipeDetail(recipeId);
        setRecipe(recipeData);
        
        // 별점 정보 조회
        try {
          const ratingData = await recipeApi.getRecipeRating(recipeId);
          setRating(ratingData);
        } catch (ratingError) {
          console.log('별점 정보 조회 실패:', ratingError);
        }
        
        // 재료 상태 조회
        try {
          const statusData = await recipeApi.getRecipeIngredientStatus(recipeId);
          console.log('🔍 재료 상태 API 응답 데이터:', statusData);
          
          // 새로운 API 응답 구조 처리
          if (statusData && statusData.ingredients) {
            // ingredients 배열을 owned, cart, not_owned로 분류
            const ingredientsStatus = {
              owned: [],
              cart: [],
              not_owned: []
            };
            
            // 소진 희망 재료 검색에서 온 경우 입력한 재료들을 보유로 처리
            const inputIngredients = location.state?.searchType === 'ingredient' && location.state?.ingredients 
              ? location.state.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing.material_name).filter(Boolean)
              : [];
            
            console.log('🔍 입력된 재료들 (보유 처리):', inputIngredients);
            
            statusData.ingredients.forEach(ingredient => {
              const ingredientData = {
                material_name: ingredient.material_name,
                order_info: ingredient.order_info,
                cart_info: ingredient.cart_info
              };
              
              // 입력한 재료인지 확인 (대소문자 구분 없이)
              const isInputIngredient = inputIngredients.some(inputIng => 
                inputIng.toLowerCase().trim() === ingredient.material_name.toLowerCase().trim()
              );
              
              // 7일 이내 구매 상품인지 확인
              const isRecentPurchase = ingredient.order_info && ingredient.order_info.purchase_date ? 
                (() => {
                  const purchaseDate = new Date(ingredient.order_info.purchase_date);
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return purchaseDate >= sevenDaysAgo;
                })() : false;
              
              // 입력한 재료이거나 7일 이내 구매 상품이거나 API에서 owned로 반환된 경우 보유로 처리
              if (isInputIngredient || isRecentPurchase || ingredient.status === 'owned') {
                ingredientsStatus.owned.push(ingredientData);
                const reason = isInputIngredient ? '입력한 재료' : 
                              isRecentPurchase ? '7일 이내 구매' : 'API owned';
                console.log(`✅ ${ingredient.material_name} - 보유 (${reason})`);
              } else if (ingredient.status === 'cart') {
                ingredientsStatus.cart.push(ingredientData);
                console.log(`🛒 ${ingredient.material_name} - 장바구니`);
              } else {
                ingredientsStatus.not_owned.push(ingredientData);
                console.log(`❌ ${ingredient.material_name} - 미보유`);
              }
            });
            
            // summary 계산
            const summary = {
              total_ingredients: statusData.ingredients.length,
              owned_count: ingredientsStatus.owned.length,
              cart_count: ingredientsStatus.cart.length,
              not_owned_count: ingredientsStatus.not_owned.length
            };
            
            const processedStatusData = {
              ingredients_status: ingredientsStatus,
              summary: summary
            };
            
            console.log('🔍 처리된 재료 상태 데이터:', processedStatusData);
            setIngredientsStatus(processedStatusData);
          } else {
            console.warn('재료 상태 API 응답이 예상과 다릅니다:', statusData);
            setIngredientsStatus({
              ingredients_status: {
                owned: [],
                cart: [],
                not_owned: []
              },
              summary: {
                total_ingredients: 0,
                owned_count: 0,
                cart_count: 0,
                not_owned_count: 0
              }
            });
          }
        } catch (statusError) {
          console.log('재료 상태 조회 실패:', statusError);
          // API 호출 실패 시 기본값 설정
          if (recipeData.materials) {
            const defaultStatus = {
              ingredients_status: {
                owned: [],
                cart: [],
                not_owned: recipeData.materials.map(material => ({ material_name: material.material_name }))
              },
              summary: {
                total_ingredients: recipeData.materials.length,
                owned_count: 0,
                cart_count: 0,
                not_owned_count: recipeData.materials.length
              }
            };
            setIngredientsStatus(defaultStatus);
          }
        }
        
        // 재료별 콕 쇼핑몰 상품 조회 (임시 비활성화 - API 명세서에 없음)
        // TODO: 백엔드 개발자에게 올바른 콕 상품 조회 API 엔드포인트 확인 필요
        /*
        if (recipeData.materials && recipeData.materials.length > 0) {
          const productsPromises = recipeData.materials.map(async (material) => {
            try {
              const products = await recipeApi.getKokProducts(material.material_name);
              return { materialName: material.material_name, products };
            } catch (error) {
              console.log(`${material.material_name} 상품 조회 실패:`, error);
              return { materialName: material.material_name, products: [] };
            }
          });
          
          const productsResults = await Promise.all(productsPromises);
          const productsMap = {};
          productsResults.forEach(({ materialName, products }) => {
            productsMap[materialName] = products;
          });
          setKokProducts(productsMap);
        }
        */
        
      } catch (err) {
        console.error('레시피 상세 정보 조회 실패:', err);
        setError('레시피 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipeDetail();
    }
  }, [recipeId]);

  // 별점 선택 (임시)
  const handleStarClick = (star) => {
    setUserRating(star);
  };

  // 별점 등록 (확인 버튼 클릭 시)
  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      setModalState(showAlert('별점을 선택해주세요.'));
      return;
    }
    
    try {
      const result = await recipeApi.postRecipeRating(recipeId, userRating);
      setRating(result);
      setModalState(showAlert('별점이 등록되었습니다.'));
    } catch (error) {
      console.error('별점 등록 실패:', error);
      setModalState(showAlert('별점 등록에 실패했습니다.'));
    }
  };

  // 만개의 레시피로 이동
  const handleGoToExternalRecipe = () => {
    if (recipe?.recipe_url) {
      window.open(recipe.recipe_url, '_blank');
    }
  };

  // 뒤로가기
  const handleBack = () => {
    navigate(-1);
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  // 장바구니 클릭 핸들러
  const handleCartClick = () => {
    navigate('/cart');
  };

  // 재료 클릭 시 상품 추천 토글 (라디오버튼 형식 - 한 번에 하나만 열림)
  const [expandedIngredient, setExpandedIngredient] = useState(null);
  const handleIngredientClick = (ingredientName) => {
    setExpandedIngredient(prev => {
      // 이미 열린 재료를 다시 클릭하면 닫기
      if (prev === ingredientName) {
        return null;
      } else {
        // 새로운 재료를 클릭하면 이전 토글은 닫고 새 토글만 열기
        return ingredientName;
      }
    });
  };

  if (loading) {
    return (
      <div className="recipe-detail-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-detail-page">
        <HeaderNavRecipeDetail 
          onBackClick={handleBack}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleBack}>뒤로 가기</button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-page">
        <HeaderNavRecipeDetail 
          onBackClick={handleBack}
          onNotificationClick={handleNotificationClick}
          onCartClick={handleCartClick}
        />
        <div className="error-message">
          <p>레시피를 찾을 수 없습니다.</p>
          <button onClick={handleBack}>뒤로 가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-detail-page">
      {/* 헤더 */}
      <HeaderNavRecipeDetail 
        onBackClick={handleBack}
        onNotificationClick={handleNotificationClick}
        onCartClick={handleCartClick}
      />

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="recipe-content-scrollable">
        {/* 레시피 헤더 */}
        <div className="recipe-header">
          <h1 className="recipe-title">{recipe.recipe_title}</h1>
          <div className="recipe-tags-container">
            <div className="recipe-tags">
              <span className="recipe-tag">{recipe.cooking_category_name}</span>
              <span className="recipe-tag">{recipe.cooking_case_name}</span>
            </div>
            <div className="recipe-bookmark">
              <img className="bookmark-icon" src={require('../../assets/bookmark-icon.png')} alt="북마크" />
              <span className="bookmark-count">{recipe.scrap_count || 15}</span>
            </div>
          </div>
        </div>

        {/* 레시피 이미지 */}
        <div className="recipe-image-section">
          <img 
            src={recipe.thumbnail_url || fallbackImg} 
            alt={recipe.recipe_title} 
            onError={(e) => { e.currentTarget.src = fallbackImg; }}
          />
        </div>

        {/* 레시피 소개 */}
        <div className="recipe-introduction">
          <p>{recipe.cooking_introduction || "새해가 되면 뜨끈한 떡국 한 그릇이 생각나는데요. 오늘은 집에서 간단하게 요리할 수 있는 멸치육수로 끓이는법을 준비했어요."}</p>
        </div>

        {/* 재료 섹션 */}
        <div className="ingredients-section">
          <div className="ingredients-header">
            <h3 className="section-title">재료</h3>
            <span 
              className="ingredients-info-icon" 
              onClick={() => setShowDescription(!showDescription)}
              style={{ cursor: 'pointer' }}
            >
              ⓘ
            </span>
            {showDescription && (
              <p className="ingredients-description">장바구니에 없는 재료는 관련 상품을 추천해드려요</p>
            )}
          </div>
          

          <div className="ingredients-list">
            {recipe.materials
              ?.map((material, index) => {
                // 디버깅: material 데이터 구조 확인
                console.log(`🔍 Material ${index}:`, {
                  material_name: material.material_name,
                  measure_amount: material.measure_amount,
                  material_unit: material.material_unit,
                  measure_unit: material.measure_unit,
                  전체데이터: material
                });
                
                // 재료 상태 확인
                let status = 'not-owned';
                let statusText = '미보유';
                let priority = 3; // 정렬 우선순위 (1: 보유, 2: 장바구니, 3: 미보유)
                
                // API 명세서에 따른 새로운 구조 확인
                if (ingredientsStatus && ingredientsStatus.ingredients) {
                  const ingredientData = ingredientsStatus.ingredients.find(
                    item => item.material_name === material.material_name
                  );
                  if (ingredientData) {
                    status = ingredientData.status;
                    switch (ingredientData.status) {
                      case 'owned':
                        statusText = '보유';
                        priority = 1;
                        break;
                      case 'cart':
                        statusText = '장바구니';
                        priority = 2;
                        break;
                      case 'not_owned':
                      default:
                        statusText = '미보유';
                        priority = 3;
                        break;
                    }
                  }
                }
                // 기존 구조도 지원 (하위 호환성)
                else if (ingredientsStatus && ingredientsStatus.ingredients_status) {
                  const { owned = [], cart = [], not_owned = [] } = ingredientsStatus.ingredients_status;
                  
                  if (owned.some(item => item.material_name === material.material_name)) {
                    status = 'owned';
                    statusText = '보유';
                    priority = 1;
                  } else if (cart.some(item => item.material_name === material.material_name)) {
                    status = 'cart';
                    statusText = '장바구니';
                    priority = 2;
                  } else if (not_owned.some(item => item.material_name === material.material_name)) {
                    status = 'not-owned';
                    statusText = '미보유';
                    priority = 3;
                  }
                }
                
                return {
                  material,
                  index,
                  status,
                  statusText,
                  priority
                };
              })
              .sort((a, b) => a.priority - b.priority) // 우선순위에 따라 정렬
              .map(({ material, index, status, statusText }) => (
                <React.Fragment key={index}>
                  <div className="ingredient-item">
                    <div className="ingredient-info">
                      <div className="ingredient-name-amount">
                        {/* 핑크색 밑줄과 핑크색 글씨 부분을 클릭 가능하게 만들기 */}
                        {status === 'not-owned' ? (
                          <div 
                            className="ingredient-clickable-area"
                            onClick={() => handleIngredientClick(material.material_name)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={`ingredient-name ${status}`}>{material.material_name}</span>
                          </div>
                        ) : (
                          <div className="ingredient-static-area">
                            <span className={`ingredient-name ${status}`}>{material.material_name}</span>
                          </div>
                        )}
                      </div>
                      {/* 버튼 옆에 수량 표시 */}
                      <span className={`ingredient-amount-next-to-button ${status}`}>
                        {material.measure_amount} {material.material_unit || material.measure_unit || ''}
                      </span>
                      <span 
                        className={`ingredient-status ${status}`}
                        style={{
                          backgroundColor: status === 'owned' ? '#000000' : 
                                          status === 'cart' ? '#000000' : '#FA5F8C',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          minWidth: '80px',
                          textAlign: 'center',
                          display: 'inline-block'
                        }}
                      >
                        {statusText}
                      </span>
                    </div>
                  </div>
                  
                  {/* 미보유 재료일 때만 상품 추천 토글 표시 - 재료 항목들 사이에 배치 */}
                  {status === 'not-owned' && expandedIngredient === material.material_name && (
                    <div className="ingredient-recommendation-toggle">
                      <div className="ingredient-products-section">
                        <IngredientProductRecommendation 
                          ingredientName={material.material_name}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
          </div>
        </div>

                 {/* 구분선 */}
         <div className="section-divider"></div>





        {/* 만드는 방법 섹션 */}
        <div className="instructions-section">
          <div className="instructions-header">
            <h3 className="section-title">만드는 방법</h3>
            <span 
              className="instructions-info-icon"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              ⓘ
            </span>
            {showInstructions && (
              <span className="instructions-description">만드는 방법은 '만개의 레시피'에서 확인할 수 있어요</span>
            )}
          </div>
          <button className="instruction-main-btn" onClick={handleGoToExternalRecipe}>
            만드는 방법 보러가기
          </button>
        </div>

        {/* 별점 섹션 */}
        <div className="rating-section">
          <h3 className="section-title">별점</h3>
          <div className="rating-container">
            <div className="rating-display">
              <img className="rating-star" src={require('../../assets/rating_start.png')} alt="별점" />
              <span className="rating-score">{rating?.rating || 4.4}</span>
            </div>
            
            {/* 별점 분포 그래프 */}
            <div className="rating-distribution">
            <div className="rating-bar">
              <span className="rating-label">5점</span>
              <div className="rating-bar-bg">
                <div className="rating-bar-fill" style={{width: '80%'}}></div>
              </div>
            </div>
            <div className="rating-bar">
              <span className="rating-label">4점</span>
              <div className="rating-bar-bg">
                <div className="rating-bar-fill" style={{width: '0%'}}></div>
              </div>
            </div>
            <div className="rating-bar">
              <span className="rating-label">3점</span>
              <div className="rating-bar-bg">
                <div className="rating-bar-fill" style={{width: '0%'}}></div>
              </div>
            </div>
            <div className="rating-bar">
              <span className="rating-label">2점</span>
              <div className="rating-bar-bg">
                <div className="rating-bar-fill" style={{width: '0%'}}></div>
              </div>
            </div>
            <div className="rating-bar">
              <span className="rating-label">1점</span>
              <div className="rating-bar-bg">
                <div className="rating-bar-fill" style={{width: '0%'}}></div>
              </div>
            </div>
          </div>
          </div>

          {/* 내 별점 입력 */}
          <div className="my-rating-section">
            <div className="rating-input-row">
              <span className="my-rating-label">내 별점:</span>
                             <div className="star-input">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button
                     key={star}
                     className={`star-btn ${userRating >= star ? 'active' : ''}`}
                     onClick={() => handleStarClick(star)}
                   >
                     ★
                   </button>
                 ))}
               </div>
              <button 
                className="rating-submit-btn"
                onClick={handleRatingSubmit}
                disabled={userRating === 0}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav modalState={modalState} setModalState={setModalState} />
      
      {/* 모달 컴포넌트 */}
      <ModalManager
        {...modalState}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default RecipeDetail;
