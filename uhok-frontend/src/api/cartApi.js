import api from '../pages/api';
import { recipeApi } from './recipeApi';

// 장바구니 API 함수들
export const cartApi = {
  // ===== 장바구니 관련 =====
  
  // 장바구니에 상품 추가
  addToCart: async (productData) => {
    // 입력 데이터 유효성 검증
    if (!productData || !productData.kok_product_id) {
      throw new Error('상품 ID가 필요합니다.');
    }
    
    // kok_product_id가 유효한 숫자인지 확인
    const productId = parseInt(productData.kok_product_id);
    if (isNaN(productId) || productId <= 0) {
      throw new Error(`유효하지 않은 상품 ID: ${productData.kok_product_id}`);
    }
    
    // API 명세서에 맞는 요청 데이터 형식
    const requestData = {
      kok_product_id: productId,
      kok_quantity: parseInt(productData.kok_quantity) || 1, // 전달받은 수량 사용, 없으면 1
      recipe_id: parseInt(productData.recipe_id) || 0
    };
    
    try {
      console.log('🛒 장바구니 추가 API 요청:', productData);
      console.log('🔍 요청 데이터 형식 확인:', requestData);
      console.log('🔍 입력 데이터 상세:', {
        productData: productData,
        kok_product_id: productData.kok_product_id,
        kok_product_id_type: typeof productData.kok_product_id,
        kok_product_id_parsed: productId,
        kok_quantity: productData.kok_quantity,
        kok_quantity_type: typeof productData.kok_quantity,
        kok_quantity_parsed: parseInt(productData.kok_quantity) || 1,
        recipe_id: productData.recipe_id,
        recipe_id_parsed: parseInt(productData.recipe_id) || 0
      });
      
      const response = await api.post('/api/kok/carts', requestData);
      
      // 201 상태 코드 확인 (API 명세서 기준)
      if (response.status === 201) {
        console.log('✅ 장바구니 추가 API 응답 (201):', response.data);
        return response.data;
      } else {
        console.log('⚠️ 장바구니 추가 API 응답 (예상과 다른 상태 코드):', response.status, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 장바구니 추가 실패:', error);
      
      // 백엔드 서버 연결 실패 시 에러 발생
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      // 422 에러는 백엔드 서버가 실행 중이지만 데이터 유효성 검증에 실패한 경우
      if (error.response?.status === 422) {
        console.error('❌ 422 에러 - 데이터 유효성 검증 실패');
        throw error; // 422 에러는 그대로 전달
      }
      
      // API 명세서에 따른 에러 처리 (500 에러는 이미 위에서 처리됨)
      if (error.response?.status === 400) {
        console.log('400 에러 - 이미 장바구니에 있는 상품일 수 있습니다.');
      } else if (error.response?.status === 401) {
        console.log('401 에러 - 인증이 필요합니다.');
      } else if (error.response?.status === 422) {
        console.error('❌ 422 유효성 검증 에러:', {
          responseData: error.response.data
        });
        
        // 필드별 에러 상세 분석
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          error.response.data.detail.forEach((err, index) => {
            console.error(`❌ 필드 에러 ${index + 1}:`, {
              type: err.type,
              location: err.loc,
              message: err.msg,
              input: err.input
            });
          });
        }
      }
      
      throw error;
    }
  },

  // 장바구니 상품 조회
  getCartItems: async (limit = 20) => {
    try {
      console.log('🛒 장바구니 조회 API 요청:', { limit });
      const response = await api.get(`/api/kok/carts?limit=${limit}`);
      
      // 200 상태 코드 확인 (API 명세서 기준)
      if (response.status === 200) {
        console.log('✅ 장바구니 조회 API 응답 (200):', response.data);
        return response.data;
      } else {
        console.log('⚠️ 장바구니 조회 API 응답 (예상과 다른 상태 코드):', response.status, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 장바구니 조회 실패:', error);
      
      // 백엔드 서버 연결 실패 시 에러 발생
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error;
    }
  },

  // 장바구니 상품 수량 변경
  updateCartItemQuantity: async (cartItemId, quantity) => {
    // 수량 범위 검증 (1-10) - API 명세서에 맞춤
    const validQuantity = Math.max(1, Math.min(10, parseInt(quantity)));
    
    try {
      console.log('🛒 장바구니 수량 변경 API 요청:', { cartItemId, quantity });
      
      // API 명세서에 맞는 요청 데이터 형식
      const requestData = {
        kok_quantity: validQuantity
      };
      
      console.log('🔍 수량 변경 요청 데이터:', requestData);
      
      const response = await api.patch(`/api/kok/carts/${cartItemId}`, requestData);
      
      // 200 상태 코드 확인 (API 명세서 기준)
      if (response.status === 200) {
        console.log('✅ 장바구니 수량 변경 API 응답 (200):', response.data);
        return response.data;
      } else {
        console.log('⚠️ 장바구니 수량 변경 API 응답 (예상과 다른 상태 코드):', response.status, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 장바구니 수량 변경 실패:', error);
      
      // 백엔드 서버 연결 실패 시 에러 발생
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error;
    }
  },

  // 장바구니 상품 삭제
  removeFromCart: async (cartItemId) => {
    try {
      console.log('🛒 장바구니 상품 삭제 API 요청:', { cartItemId });
      const response = await api.delete(`/api/kok/carts/${cartItemId}`);
      
      // 200 상태 코드 확인 (API 명세서 기준)
      if (response.status === 200) {
        console.log('✅ 장바구니 상품 삭제 API 응답 (200):', response.data);
        return response.data;
      } else {
        console.log('⚠️ 장바구니 상품 삭제 API 응답 (예상과 다른 상태 코드):', response.status, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 장바구니 상품 삭제 실패:', error);
      
      // 백엔드 서버 연결 실패 시 에러 발생
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error;
    }
  },

  // ===== 주문 관련 =====
  
  // 선택된 상품들로 주문 생성
  createOrder: async (selectedItems) => {
    // 각 아이템의 구조를 자세히 로깅
    selectedItems.forEach((item, index) => {
      console.log(`🔍 아이템 ${index}:`, {
        cart_id: item.cart_id,
        kok_cart_id: item.kok_cart_id,
        quantity: item.quantity,
        kok_quantity: item.kok_quantity,
        전체_아이템: item
      });
    });
    
    // API 명세서에 맞는 요청 데이터 형식으로 변환
    const requestData = {
      selected_items: selectedItems.map(item => {
        const cartId = item.kok_cart_id || item.cart_id;
        const quantity = item.kok_quantity || item.quantity;
        
        console.log('🔄 변환 중:', { 
          원본_cart_id: item.cart_id, 
          원본_kok_cart_id: item.kok_cart_id,
          변환된_kok_cart_id: cartId,
          원본_quantity: item.quantity,
          원본_kok_quantity: item.kok_quantity,
          변환된_quantity: quantity
        });
        
        // 데이터 유효성 검증
        if (!cartId || cartId <= 0) {
          throw new Error(`유효하지 않은 장바구니 ID: ${cartId}`);
        }
        
        if (!quantity || quantity <= 0 || quantity > 10) {
          throw new Error(`유효하지 않은 수량: ${quantity} (1-10 범위여야 함)`);
        }
        
        return {
          kok_cart_id: parseInt(cartId),
          quantity: parseInt(quantity)
        };
      })
    };
    
    try {
      console.log('🛒 주문 생성 API 요청:', { selectedItems });
      console.log('🔍 최종 변환된 요청 데이터:', JSON.stringify(requestData, null, 2));
      
      const response = await api.post('/api/orders/kok/carts/order', requestData);
      
      // 201 상태 코드 확인 (API 명세서 기준)
      if (response.status === 201) {
        console.log('✅ 주문 생성 API 응답 (201):', response.data);
        return response.data;
      } else {
        console.log('⚠️ 주문 생성 API 응답 (예상과 다른 상태 코드):', response.status, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 주문 생성 실패:', error);
      
      // 에러 상세 정보 로깅
      if (error.response?.data) {
        console.error('🔍 에러 상세 정보:', {
          status: error.response.status,
          data: error.response.data,
          validationErrors: error.response.data.validation_errors
        });
        
        // 422 에러 특별 처리
        if (error.response.status === 422) {
          console.error('❌ 422 유효성 검증 에러 상세:', {
            requestData: requestData,
            responseData: error.response.data,
            detail: error.response.data.detail
          });
          
          // 필드별 에러 상세 분석
          if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
            error.response.data.detail.forEach((err, index) => {
              console.error(`❌ 필드 에러 ${index + 1}:`, {
                type: err.type,
                location: err.loc,
                message: err.msg,
                input: err.input
              });
            });
          }
        }
      }
      
      throw error;
    }
  },

  // ===== 레시피 추천 =====
  
  // 선택된 장바구니 상품들로 레시피 추천 (통일된 API)
  getRecipeRecommendations: async (selectedCartIds, page = 1, size = 5) => {
    try {
      console.log('🛒 레시피 추천 API 요청:', { selectedCartIds, page, size });
      
      // 먼저 장바구니 아이템들을 조회하여 상품 ID를 추출
      const cartResponse = await api.get('/api/kok/carts?limit=20');
      const cartItems = cartResponse.data?.cart_items || [];
      
      console.log('🔍 전체 장바구니 아이템:', cartItems);
      
      // 모든 상품 ID를 product_id로 통일하여 추출
      const productIds = [];
      
      selectedCartIds.forEach(cartId => {
        const cartItem = cartItems.find(item => 
          item.kok_cart_id === cartId || item.cart_id === cartId || item.id === cartId
        );
        
        if (cartItem) {
          // 상품 ID 추출 (KOK 상품 ID 또는 홈쇼핑 상품 ID 모두 product_id로 통일)
          const productId = cartItem.kok_product_id || 
                           cartItem.homeshopping_product_id || 
                           cartItem.home_shopping_product_id || 
                           cartItem.product_id;
          
          if (productId) {
            productIds.push(productId);
            console.log('🔍 장바구니 ID', cartId, '에서 상품 ID 추출:', productId);
          }
        } else {
          console.warn('⚠️ 장바구니 ID', cartId, '에 해당하는 상품을 찾을 수 없습니다.');
        }
      });
      
      if (productIds.length === 0) {
        throw new Error('선택된 장바구니 아이템에서 상품 ID를 찾을 수 없습니다.');
      }
      
      console.log('🔍 추출된 상품 ID들:', productIds);
      
      // GET 요청만 사용 (POST는 지원되지 않음)
      // product_id로 통일하여 전송
      // 중복 제거
      const uniqueProductIds = [...new Set(productIds)];
      const productIdsParam = uniqueProductIds.join(',');
      
      // Query 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append('product_ids', productIdsParam);
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      
      const response = await api.get(`/api/kok/carts/recipe-recommend?${queryParams.toString()}`);
      
      console.log('✅ 레시피 추천 API 응답:', response.data);
      
      // 실제 응답 데이터 구조 상세 분석
      if (response.data && response.data.recipes) {
        console.log('🔍 레시피 데이터 구조 분석:');
        response.data.recipes.forEach((recipe, index) => {
          console.log(`레시피 ${index + 1}:`, {
            전체_데이터: recipe,
            사용가능한_키: Object.keys(recipe),
            제목_필드들: {
              recipe_title: recipe.recipe_title,
              name: recipe.name,
              title: recipe.title,
              recipe_title: recipe.recipe_title
            },
            이미지_필드들: {
              thumbnail_url: recipe.thumbnail_url,
              image_url: recipe.image_url,
              img_url: recipe.img_url,
              image: recipe.image,
              thumbnail: recipe.thumbnail,
              main_image: recipe.main_image,
              main_image_url: recipe.main_image_url
            },
            인분_필드들: {
              number_of_serving: recipe.number_of_serving,
              serving: recipe.serving
            },
            스크랩_필드들: {
              scrap_count: recipe.scrap_count,
              scrapCount: recipe.scrapCount
            }
          });
          
          // 실제 이미지 필드 값들 상세 확인
          console.log(`🔍 레시피 ${index + 1} 이미지 필드 상세:`, {
            recipe_title: recipe.recipe_title ,
            thumbnail_url: recipe.thumbnail_url,
            image_url: recipe.image_url,
            img_url: recipe.img_url,
            image: recipe.image,
            thumbnail: recipe.thumbnail,
            main_image: recipe.main_image,
            main_image_url: recipe.main_image_url,
            모든_이미지_필드_값: {
              thumbnail_url: recipe.thumbnail_url,
              image_url: recipe.image_url,
              img_url: recipe.img_url,
              image: recipe.image,
              thumbnail: recipe.thumbnail,
              main_image: recipe.main_image,
              main_image_url: recipe.main_image_url
            }
          });
        });
        
        // CartRecipeResult.js에서 기대하는 형식으로 데이터 정규화
        const normalizedRecipes = await Promise.all(response.data.recipes.map(async (recipe) => {
          const recipeId = recipe.recipe_id || recipe.id || recipe.RECIPE_ID;
          
          // 레시피 ID가 있으면 실제 레시피 상세 정보를 가져와서 이미지 URL과 재료 정보 추출
          let actualImageUrl = null;
          let actualMaterials = null;
          let actualTotalIngredients = 0;
          let actualMatchedIngredients = 0;
          
          if (recipeId) {
            try {
              console.log('🔍 레시피 ID로 실제 이미지 조회:', recipeId);
              const recipeDetail = await recipeApi.getRecipeDetail(recipeId);
              
              // 실제 이미지 URL 추출
              actualImageUrl = recipeDetail.thumbnail_url || 
                              recipeDetail.image_url || 
                              recipeDetail.img_url || 
                              recipeDetail.image || 
                              recipeDetail.thumbnail || 
                              recipeDetail.main_image || 
                              recipeDetail.main_image_url;
              
              // 실제 재료 정보 추출
              actualMaterials = recipeDetail.materials || recipeDetail.ingredients || [];
              actualTotalIngredients = actualMaterials.length;
              
              // 레시피 재료 상태 조회 (보유 + 장바구니 수 계산)
              try {
                const ingredientStatus = await recipeApi.getRecipeIngredientStatus(recipeId);
                const summary = ingredientStatus?.summary;
                if (summary) {
                  // 보유 + 장바구니 수를 matched_ingredient_count로 사용
                  actualMatchedIngredients = (summary.owned_count || 0) + (summary.cart_count || 0);
                  console.log('✅ 레시피 ID', recipeId, '재료 상태:', {
                    owned_count: summary.owned_count || 0,
                    cart_count: summary.cart_count || 0,
                    matched_ingredients: actualMatchedIngredients
                  });
                } else {
                  // 재료 상태 정보가 없으면 API에서 받은 값 사용
                  actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
                }
              } catch (statusError) {
                console.warn('⚠️ 레시피 ID', recipeId, '재료 상태 조회 실패:', statusError);
                // 재료 상태 조회 실패 시 API에서 받은 값 사용
                actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
              }
              
              console.log('✅ 레시피 ID', recipeId, '실제 이미지 URL:', actualImageUrl);
              console.log('✅ 레시피 ID', recipeId, '실제 재료 정보:', {
                total_ingredients: actualTotalIngredients,
                matched_ingredients: actualMatchedIngredients,
                materials_count: actualMaterials.length
              });
            } catch (detailError) {
              console.warn('⚠️ 레시피 ID', recipeId, '상세 정보 조회 실패:', detailError);
            }
          }
          
          return {
            recipe_id: recipeId,
            recipe_title: recipe.recipe_title,
            cooking_introduction: recipe.cooking_introduction || recipe.description || recipe.introduction || '',
            thumbnail_url: actualImageUrl || recipe.thumbnail_url || recipe.image_url || recipe.img_url || recipe.image || recipe.thumbnail || recipe.main_image || recipe.main_image_url || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000),
            number_of_serving: recipe.number_of_serving || recipe.serving || recipe.cooking_serving || '2인분',
            scrap_count: recipe.scrap_count || recipe.scrapCount || recipe.bookmark_count || 0,
            matched_ingredient_count: actualMatchedIngredients !== null ? actualMatchedIngredients : (recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : (recipe.matched_count !== undefined ? recipe.matched_count : 1)),
            total_ingredients_count: actualTotalIngredients || recipe.total_ingredients_count || recipe.total_count || recipe.ingredients_count || 5,
            used_ingredients: actualMaterials || recipe.used_ingredients || recipe.ingredients || recipe.materials || []
          };
        }));
        
        console.log('✅ 정규화된 레시피 데이터:', normalizedRecipes);
        
        // 정규화된 이미지 URL 확인
        normalizedRecipes.forEach((recipe, index) => {
          console.log(`🔍 정규화된 레시피 ${index + 1} 이미지 URL:`, {
            recipe_title: recipe.recipe_title,
            thumbnail_url: recipe.thumbnail_url,
            이미지_URL_타입: typeof recipe.thumbnail_url,
            이미지_URL_길이: recipe.thumbnail_url ? recipe.thumbnail_url.length : 0
          });
        });
        
        // 요청하신 응답 구조로 반환
        return {
          recipes: normalizedRecipes,
          total_count: response.data.total_count || normalizedRecipes.length,
          page: page,
          size: size,
          total_pages: response.data.total_pages || Math.ceil((response.data.total_count || normalizedRecipes.length) / size),
          keyword_extraction: response.data.keyword_extraction || []
        };
      }
      
      // 백엔드 응답이 없는 경우 기본 구조로 반환
      return {
        recipes: [],
        total_count: 0,
        page: page,
        size: size,
        total_pages: 0,
        keyword_extraction: []
      };
    } catch (error) {
      console.error('❌ 레시피 추천 실패:', error);
      throw error;
    }
  },

  // 마이페이지용 레시피 추천 (최근 주문 상품 기반)
  getMyPageRecipeRecommendations: async (recentOrders, page = 1, size = 5) => {
    try {
      console.log('🛒 마이페이지 레시피 추천 API 요청:', { recentOrders, page, size });
      
      // 실제 데이터 구조 확인을 위한 로그
      console.log('🔍 recentOrders 데이터 구조 확인:', recentOrders);
      if (recentOrders.length > 0) {
        console.log('🔍 첫 번째 주문 데이터 예시:', recentOrders[0]);
        console.log('🔍 첫 번째 주문의 모든 키:', Object.keys(recentOrders[0]));
      }
      
      // 최근 주문에서 KOK 상품과 홈쇼핑 상품 ID를 구분하여 추출
      const kokProductIds = [];
      const homeshoppingProductIds = [];
      
      // 각 주문에서 직접 상품 ID를 추출 (mypage-product-info에서)
      for (const order of recentOrders) {
        console.log('🔍 주문에서 상품 ID 추출 시도:', order);
        
        // 주문 타입을 확인하여 KOK 상품인지 홈쇼핑 상품인지 구분
        const orderType = order.order_type || order.type || 'kok'; // 기본값은 KOK
        
        if (orderType === 'homeshopping' || orderType === 'home_shopping') {
          // 홈쇼핑 상품 ID 추출
          const productId = order.product_id || 
                           order.homeshopping_product_id || 
                           order.home_shopping_product_id ||
                           order.id || 
                           order.productId;
          
          if (productId && productId > 0) {
            homeshoppingProductIds.push(productId);
            console.log('✅ 홈쇼핑 상품 ID 추출:', productId);
          }
        } else {
          // KOK 상품 ID 추출
          const productId = order.product_id || 
                           order.kok_product_id || 
                           order.id || 
                           order.productId ||
                           order.item_id ||
                           order.kok_item_id;
          
          if (productId && productId > 0) {
            kokProductIds.push(productId);
            console.log('✅ KOK 상품 ID 추출:', productId);
          }
        }
        
        // 상품 타입이 명확하지 않은 경우, 기존 로직으로 KOK 상품으로 처리
        if (!order.order_type && !order.type) {
          const productId = order.product_id || 
                           order.kok_product_id || 
                           order.id || 
                           order.productId ||
                           order.item_id ||
                           order.kok_item_id;
          
          if (productId && productId > 0) {
            kokProductIds.push(productId);
            console.log('✅ 기본값으로 KOK 상품 ID 추출:', productId);
          }
        }
      }
      
      // 상품 ID를 찾지 못한 경우 주문 상세 정보를 조회하여 상품 ID를 가져옴
      if (kokProductIds.length === 0 && homeshoppingProductIds.length === 0) {
        console.log('🔍 상품 ID를 찾지 못해 주문 상세 정보를 조회합니다.');
        
        for (const order of recentOrders) {
          try {
            console.log('🔍 주문 상세 정보 조회:', order.order_id || order.id);
            
            // 주문 상세 정보 조회
            const orderDetailResponse = await api.get(`/api/orders/${order.order_id || order.id}`);
            const orderDetail = orderDetailResponse.data;
            
            console.log('🔍 주문 상세 정보:', orderDetail);
            
            // 주문 상세에서 상품 ID들을 추출
            if (orderDetail.items && Array.isArray(orderDetail.items)) {
              orderDetail.items.forEach(item => {
                const orderType = item.order_type || item.type || 'kok';
                
                if (orderType === 'homeshopping' || orderType === 'home_shopping') {
                  const productId = item.homeshopping_product_id || item.home_shopping_product_id || item.product_id;
                  if (productId && productId > 0) {
                    homeshoppingProductIds.push(productId);
                    console.log('✅ 주문 상세에서 홈쇼핑 상품 ID 추출:', productId);
                  }
                } else {
                  const productId = item.kok_product_id || item.product_id;
                  if (productId && productId > 0) {
                    kokProductIds.push(productId);
                    console.log('✅ 주문 상세에서 KOK 상품 ID 추출:', productId);
                  }
                }
              });
            }
          } catch (detailError) {
            console.warn('⚠️ 주문 상세 정보 조회 실패:', detailError);
          }
        }
      }
      
      console.log('🔍 추출된 KOK 상품 ID들:', kokProductIds);
      console.log('🔍 추출된 홈쇼핑 상품 ID들:', homeshoppingProductIds);
      
      if (kokProductIds.length === 0 && homeshoppingProductIds.length === 0) {
        console.warn('⚠️ 상품 ID를 찾을 수 없어 상품명에서 키워드를 추출합니다.');
        
        // 상품명에서 키워드 추출
        const keywords = recentOrders
          .map(order => order.product_name)
          .filter(name => name && name.trim() !== '')
          .slice(0, 3) // 최대 3개까지만 사용
          .map(name => {
            // 특수문자 제거하고 간소화
            return name
              .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
              .replace(/\s+/g, ' ') // 연속된 공백을 하나로
              .trim()
              .split(' ')
              .slice(0, 2) // 첫 2개 단어만 사용
              .join(' ');
          });
        
        console.log('🔍 상품명에서 추출한 키워드들:', keywords);
        
        // 키워드가 있으면 더미 상품 ID 사용 (1, 2, 3)
        if (keywords.length > 0) {
          const dummyProductIds = [1, 2, 3].slice(0, keywords.length);
          console.log('🔍 더미 상품 ID 사용:', dummyProductIds);
          
                                           // 백엔드 API 호출 (더미 상품 ID 사용)
            const uniqueDummyProductIds = [...new Set(dummyProductIds)];
            const kokProductIds = uniqueDummyProductIds.join(',');
            const requestUrl = `/api/kok/carts/recipe-recommend?kok_product_ids=${kokProductIds}&page=${page}&size=${size}`;
           
           console.log('🔍 마이페이지 레시피 추천 API 요청 URL (더미 ID):', requestUrl);
           console.log('🔍 요청 파라미터 확인 (더미 ID):', {
             kok_product_ids: kokProductIds,
             page: page,
             size: size,
             원본_dummyProductIds: dummyProductIds
           });
           
           const apiResponse = await api.get(requestUrl);
          
          console.log('✅ 마이페이지 레시피 추천 API 응답 (더미 ID):', apiResponse.data);
          
          // 백엔드 응답 구조에 맞게 반환하되, keyword_extraction을 상품명에서 추출한 키워드로 대체
          if (apiResponse.data && apiResponse.data.recipes) {
            // CartRecipeResult.js에서 기대하는 형식으로 데이터 정규화
            const normalizedRecipes = await Promise.all(apiResponse.data.recipes.map(async (recipe) => {
              const recipeId = recipe.recipe_id || recipe.id || recipe.RECIPE_ID;
              
              // 레시피 ID가 있으면 실제 레시피 상세 정보를 가져와서 이미지 URL과 재료 정보 추출
              let actualImageUrl = null;
              let actualMaterials = null;
              let actualTotalIngredients = 0;
              let actualMatchedIngredients = 0;
              
              if (recipeId) {
                try {
                  console.log('🔍 레시피 ID로 실제 이미지 조회:', recipeId);
                  const recipeDetail = await recipeApi.getRecipeDetail(recipeId);
                  
                  // 실제 이미지 URL 추출
                  actualImageUrl = recipeDetail.thumbnail_url || 
                                  recipeDetail.image_url || 
                                  recipeDetail.img_url || 
                                  recipeDetail.image || 
                                  recipeDetail.thumbnail || 
                                  recipeDetail.main_image || 
                                  recipeDetail.main_image_url;
                  
                  // 실제 재료 정보 추출
                  actualMaterials = recipeDetail.materials || recipeDetail.ingredients || [];
                  actualTotalIngredients = actualMaterials.length;
                  
                  // 레시피 재료 상태 조회 (보유 + 장바구니 수 계산)
                  try {
                    const ingredientStatus = await recipeApi.getRecipeIngredientStatus(recipeId);
                    const summary = ingredientStatus?.summary;
                    if (summary) {
                      // 보유 + 장바구니 수를 matched_ingredient_count로 사용
                      actualMatchedIngredients = (summary.owned_count || 0) + (summary.cart_count || 0);
                      console.log('✅ 레시피 ID', recipeId, '재료 상태:', {
                        owned_count: summary.owned_count || 0,
                        cart_count: summary.cart_count || 0,
                        matched_ingredients: actualMatchedIngredients
                      });
                    } else {
                      // 재료 상태 정보가 없으면 API에서 받은 값 사용
                      actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
                    }
                  } catch (statusError) {
                    console.warn('⚠️ 레시피 ID', recipeId, '재료 상태 조회 실패:', statusError);
                    // 재료 상태 조회 실패 시 API에서 받은 값 사용
                    actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
                  }
                  
                  console.log('✅ 레시피 ID', recipeId, '실제 이미지 URL:', actualImageUrl);
                  console.log('✅ 레시피 ID', recipeId, '실제 재료 정보:', {
                    total_ingredients: actualTotalIngredients,
                    matched_ingredients: actualMatchedIngredients,
                    materials_count: actualMaterials.length
                  });
                } catch (detailError) {
                  console.warn('⚠️ 레시피 ID', recipeId, '상세 정보 조회 실패:', detailError);
                }
              }
              
              return {
                recipe_id: recipeId,
                recipe_title: recipe.recipe_title ,
                cooking_introduction: recipe.cooking_introduction || recipe.description || recipe.introduction || '',
                thumbnail_url: actualImageUrl || recipe.thumbnail_url || recipe.image_url || recipe.img_url || recipe.image || recipe.thumbnail || recipe.main_image || recipe.main_image_url || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000),
                number_of_serving: recipe.number_of_serving || recipe.serving || recipe.cooking_serving || '2인분',
                scrap_count: recipe.scrap_count || recipe.scrapCount || recipe.bookmark_count || 0,
                matched_ingredient_count: actualMatchedIngredients !== null ? actualMatchedIngredients : (recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : (recipe.matched_count !== undefined ? recipe.matched_count : 1)),
                total_ingredients_count: actualTotalIngredients || recipe.total_ingredients_count || recipe.total_count || recipe.ingredients_count || 5,
                used_ingredients: actualMaterials || recipe.used_ingredients || recipe.ingredients || recipe.materials || []
              };
            }));
            
            console.log('✅ 정규화된 레시피 데이터:', normalizedRecipes);
            
                         console.log('🔍 더미 ID 사용 시 keyword_extraction 확인:', {
               상품명에서_추출한_키워드: keywords,
               타입: typeof keywords,
               배열여부: Array.isArray(keywords),
               길이: keywords ? keywords.length : 0
             });
             
             // 요청하신 응답 구조로 반환하되, keyword_extraction을 상품명에서 추출한 키워드로 대체
             const result = {
               recipes: normalizedRecipes,
               total_count: apiResponse.data.total_count || normalizedRecipes.length,
               page: page,
               size: size,
               total_pages: apiResponse.data.total_pages || Math.ceil((apiResponse.data.total_count || normalizedRecipes.length) / size),
               keyword_extraction: keywords // 상품명에서 추출한 키워드 사용
             };
             
             console.log('🔍 더미 ID 사용 시 최종 반환할 결과의 keyword_extraction:', {
               keyword_extraction: result.keyword_extraction,
               타입: typeof result.keyword_extraction,
               배열여부: Array.isArray(result.keyword_extraction),
               길이: result.keyword_extraction ? result.keyword_extraction.length : 0
             });
             
             return result;
          }
          
          // 백엔드 응답이 없는 경우 기본 구조로 반환하되, keyword_extraction을 상품명에서 추출한 키워드로 대체
          return {
            recipes: [],
            total_count: 0,
            page: page,
            size: size,
            total_pages: 0,
            keyword_extraction: keywords // 상품명에서 추출한 키워드 사용
          };
        }
        
        throw new Error('선택된 주문에서 상품 ID를 찾을 수 없고, 상품명도 없습니다.');
      }
      
      // 백엔드 API 호출 (product_ids로 통일)
      // 모든 상품 ID를 product_ids로 통일
      const allProductIds = [...kokProductIds, ...homeshoppingProductIds];
      const uniqueProductIds = [...new Set(allProductIds)];
      const productIdsParam = uniqueProductIds.join(',');
      
      // Query 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append('product_ids', productIdsParam);
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      
      const requestUrl = `/api/kok/carts/recipe-recommend?${queryParams.toString()}`;
      
      console.log('🔍 마이페이지 레시피 추천 API 요청 URL:', requestUrl);
      console.log('🔍 요청 파라미터 확인:', {
        product_ids: productIdsParam,
        page: page,
        size: size,
        원본_kokProductIds: kokProductIds,
        원본_homeshoppingProductIds: homeshoppingProductIds
      });
       
       const apiResponse = await api.get(requestUrl);
      
      console.log('✅ 마이페이지 레시피 추천 API 응답:', apiResponse.data);
      
      // 백엔드 응답 구조에 맞게 반환
      if (apiResponse.data && apiResponse.data.recipes) {
        // CartRecipeResult.js에서 기대하는 형식으로 데이터 정규화
        const normalizedRecipes = await Promise.all(apiResponse.data.recipes.map(async (recipe) => {
          const recipeId = recipe.recipe_id || recipe.id || recipe.RECIPE_ID;
          
          // 레시피 ID가 있으면 실제 레시피 상세 정보를 가져와서 이미지 URL과 재료 정보 추출
          let actualImageUrl = null;
          let actualMaterials = null;
          let actualTotalIngredients = 0;
          let actualMatchedIngredients = 0;
          
          if (recipeId) {
            try {
              console.log('🔍 레시피 ID로 실제 이미지 조회:', recipeId);
              const recipeDetail = await recipeApi.getRecipeDetail(recipeId);
              
              // 실제 이미지 URL 추출
              actualImageUrl = recipeDetail.thumbnail_url || 
                              recipeDetail.image_url || 
                              recipeDetail.img_url || 
                              recipeDetail.image || 
                              recipeDetail.thumbnail || 
                              recipeDetail.main_image || 
                              recipeDetail.main_image_url;
              
              // 실제 재료 정보 추출
              actualMaterials = recipeDetail.materials || recipeDetail.ingredients || [];
              actualTotalIngredients = actualMaterials.length;
              
              // 레시피 재료 상태 조회 (보유 + 장바구니 수 계산)
              try {
                const ingredientStatus = await recipeApi.getRecipeIngredientStatus(recipeId);
                const summary = ingredientStatus?.summary;
                if (summary) {
                  // 보유 + 장바구니 수를 matched_ingredient_count로 사용
                  actualMatchedIngredients = (summary.owned_count || 0) + (summary.cart_count || 0);
                  console.log('✅ 레시피 ID', recipeId, '재료 상태:', {
                    owned_count: summary.owned_count || 0,
                    cart_count: summary.cart_count || 0,
                    matched_ingredients: actualMatchedIngredients
                  });
                } else {
                  // 재료 상태 정보가 없으면 API에서 받은 값 사용
                  actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
                }
              } catch (statusError) {
                console.warn('⚠️ 레시피 ID', recipeId, '재료 상태 조회 실패:', statusError);
                // 재료 상태 조회 실패 시 API에서 받은 값 사용
                actualMatchedIngredients = recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : 0;
              }
              
              console.log('✅ 레시피 ID', recipeId, '실제 이미지 URL:', actualImageUrl);
              console.log('✅ 레시피 ID', recipeId, '실제 재료 정보:', {
                total_ingredients: actualTotalIngredients,
                matched_ingredients: actualMatchedIngredients,
                materials_count: actualMaterials.length
              });
            } catch (detailError) {
              console.warn('⚠️ 레시피 ID', recipeId, '상세 정보 조회 실패:', detailError);
            }
          }
          
          return {
            recipe_id: recipeId,
            recipe_title: recipe.recipe_title ,
            cooking_introduction: recipe.cooking_introduction || recipe.description || recipe.introduction || '',
            thumbnail_url: actualImageUrl || recipe.thumbnail_url || recipe.image_url || recipe.img_url || recipe.image || recipe.thumbnail || recipe.main_image || recipe.main_image_url || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000),
            number_of_serving: recipe.number_of_serving || recipe.serving || recipe.cooking_serving || '2인분',
            scrap_count: recipe.scrap_count || recipe.scrapCount || recipe.bookmark_count || 0,
            matched_ingredient_count: actualMatchedIngredients !== null ? actualMatchedIngredients : (recipe.matched_ingredient_count !== undefined ? recipe.matched_ingredient_count : (recipe.matched_count !== undefined ? recipe.matched_count : 1)),
            total_ingredients_count: actualTotalIngredients || recipe.total_ingredients_count || recipe.total_count || recipe.ingredients_count || 5,
            used_ingredients: actualMaterials || recipe.used_ingredients || recipe.ingredients || recipe.materials || []
          };
        }));
        
        console.log('✅ 정규화된 레시피 데이터:', normalizedRecipes);
        
        console.log('🔍 백엔드 응답에서 keyword_extraction 확인:', {
          원본_keyword_extraction: apiResponse.data.keyword_extraction,
          타입: typeof apiResponse.data.keyword_extraction,
          배열여부: Array.isArray(apiResponse.data.keyword_extraction),
          길이: apiResponse.data.keyword_extraction ? apiResponse.data.keyword_extraction.length : 0
        });
        
        // 요청하신 응답 구조로 반환
        const result = {
          recipes: normalizedRecipes,
          total_count: apiResponse.data.total_count || normalizedRecipes.length,
          page: page,
          size: size,
          total_pages: apiResponse.data.total_pages || Math.ceil((apiResponse.data.total_count || normalizedRecipes.length) / size),
          keyword_extraction: apiResponse.data.keyword_extraction || []
        };
        
        console.log('🔍 최종 반환할 결과의 keyword_extraction:', {
          keyword_extraction: result.keyword_extraction,
          타입: typeof result.keyword_extraction,
          배열여부: Array.isArray(result.keyword_extraction),
          길이: result.keyword_extraction ? result.keyword_extraction.length : 0
        });
        
        return result;
      }
      
      // 백엔드 응답이 없는 경우 기본 구조로 반환
      return {
        recipes: [],
        total_count: 0,
        page: page,
        size: size,
        total_pages: 0,
        keyword_extraction: []
      };
      
    } catch (error) {
      console.error('❌ 마이페이지 레시피 추천 실패:', error);
      throw error;
    }
  },

  // ===== 장바구니 일괄 처리 =====
  
  // 선택된 상품들 일괄 삭제
  removeSelectedItems: async (cartItemIds) => {
    try {
      console.log('🛒 선택된 상품들 일괄 삭제 API 요청:', { cartItemIds });
      
      // 병렬로 모든 상품 삭제 (Promise.all 사용)
      const deletePromises = cartItemIds.map(id => 
        api.delete(`/api/kok/carts/${id}`)
      );
      
      const responses = await Promise.all(deletePromises);
      console.log('✅ 선택된 상품들 일괄 삭제 API 응답:', responses.map(r => r.data));
      
      return {
        success: true,
        message: `${cartItemIds.length}개 상품이 삭제되었습니다.`,
        deletedCount: cartItemIds.length
      };
    } catch (error) {
      console.error('❌ 선택된 상품들 일괄 삭제 실패:', error);
      throw error;
    }
  },

  // 선택된 상품들 수량 일괄 변경
  updateSelectedItemsQuantity: async (cartItemUpdates) => {
    try {
      console.log('🛒 선택된 상품들 수량 일괄 변경 API 요청:', { cartItemUpdates });
      
      // 병렬로 모든 상품 수량 변경 (Promise.all 사용)
      const updatePromises = cartItemUpdates.map(({ cartId, quantity }) =>
        api.patch(`/api/kok/carts/${cartId}`, { kok_quantity: quantity })
      );
      
      const responses = await Promise.all(updatePromises);
      console.log('✅ 선택된 상품들 수량 일괄 변경 API 응답:', responses.map(r => r.data));
      
      return {
        success: true,
        message: `${cartItemUpdates.length}개 상품의 수량이 변경되었습니다.`,
        updatedCount: cartItemUpdates.length
      };
    } catch (error) {
      console.error('❌ 선택된 상품들 수량 일괄 변경 실패:', error);
      throw error;
    }
  },

  // ===== 장바구니 통계 =====
  
  // 장바구니 통계 정보 조회
  getCartStats: async () => {
    try {
      console.log('🛒 장바구니 통계 API 요청');
      
      // 장바구니 상품 조회
      const cartResponse = await api.get('/api/kok/carts?limit=20');
      const cartItems = cartResponse.data?.cart_items || [];
      
      // 통계 계산
      const stats = {
        totalItems: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.kok_quantity, 0),
        totalPrice: cartItems.reduce((sum, item) => sum + (item.kok_discounted_price * item.kok_quantity), 0),
        totalOriginalPrice: cartItems.reduce((sum, item) => sum + (item.kok_product_price * item.kok_quantity), 0),
        totalDiscount: cartItems.reduce((sum, item) => sum + ((item.kok_product_price - item.kok_discounted_price) * item.kok_quantity), 0),
        storeCount: new Set(cartItems.map(item => item.kok_store_name)).size
      };
      
      console.log('✅ 장바구니 통계 계산 완료:', stats);
      return stats;
    } catch (error) {
      console.error('❌ 장바구니 통계 조회 실패:', error);
      throw error;
    }
  },

  // ===== API 연결 테스트 =====
  
  // 장바구니 API 연결 상태 테스트
  testApiConnection: async () => {
    try {
      console.log('🧪 장바구니 API 연결 테스트 시작');
      
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // 1. 장바구니 조회 테스트
      try {
        console.log('🧪 테스트 1: 장바구니 조회');
        const cartResponse = await api.get('/api/kok/carts?limit=1');
        testResults.tests.cartRead = {
          success: true,
          status: cartResponse.status,
          data: cartResponse.data
        };
        console.log('✅ 장바구니 조회 테스트 성공');
      } catch (error) {
        testResults.tests.cartRead = {
          success: false,
          error: {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
          }
        };
        console.log('❌ 장바구니 조회 테스트 실패:', error.response?.status);
      }
      
      // 2. 인증 상태 확인
      const token = localStorage.getItem('access_token');
      testResults.auth = {
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      };
      
      console.log('🧪 API 연결 테스트 완료:', testResults);
      return testResults;
      
    } catch (error) {
      console.error('❌ API 연결 테스트 실패:', error);
      throw error;
    }
  }
};

export default cartApi;
