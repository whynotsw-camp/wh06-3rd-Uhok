import { orderApi } from '../api/orderApi';

/**
 * 주문 정보에서 모든 주문 ID들을 수집하는 통일된 함수
 * @param {Object} orderInfo - 주문 정보 객체
 * @returns {Object} kok_order_ids와 hs_order_ids를 포함한 객체
 */
export const collectAllOrderIds = (orderInfo) => {
  const kokOrderIds = new Set(); // 중복 제거를 위해 Set 사용
  const hsOrderIds = new Set(); // 홈쇼핑 주문 ID들
  
     // 1. 백엔드 결제 응답의 kok_order_ids 배열을 우선적으로 사용 (가장 정확한 소스)
   if (orderInfo?.kok_order_ids && Array.isArray(orderInfo.kok_order_ids)) {
     orderInfo.kok_order_ids.forEach(id => {
       // 백엔드에서 받은 값이 정수인지 확인하고 추가
       const numericId = parseInt(id);
       if (!isNaN(numericId)) {
         kokOrderIds.add(numericId);
         console.log(`✅ 백엔드 결제 응답에서 kok_order_id 추가: ${numericId}`);
       } else {
         console.warn('⚠️ 백엔드에서 받은 kok_order_id가 유효한 숫자가 아닙니다:', id);
       }
     });
     console.log('🔍 백엔드 결제 응답에서 kok_order_ids 수집:', orderInfo.kok_order_ids);
   }
  
     // 2. 백엔드 결제 응답의 hs_order_id 처리 (홈쇼핑 주문)
   if (orderInfo?.hs_order_id) {
     const numericId = parseInt(orderInfo.hs_order_id);
     if (!isNaN(numericId)) {
       hsOrderIds.add(numericId);
       console.log('🔍 백엔드 결제 응답에서 hs_order_id 수집:', orderInfo.hs_order_id);
     } else {
       console.warn('⚠️ 백엔드에서 받은 hs_order_id가 유효한 숫자가 아닙니다:', orderInfo.hs_order_id);
     }
   }
  
  const result = {
    kok_order_ids: Array.from(kokOrderIds),
    hs_order_ids: Array.from(hsOrderIds)
  };
  
  console.log('🔍 최종 수집된 주문 ID들:', result);
  console.log('🔍 kok_order_ids 타입 확인:', result.kok_order_ids.map(id => ({ id, type: typeof id })));
  console.log('🔍 hs_order_ids 타입 확인:', result.hs_order_ids.map(id => ({ id, type: typeof id })));
  
  return result;
};

/**
 * 주문 정보에서 kok_order_id들을 수집하는 통일된 함수 (기존 호환성 유지)
 * @param {Object} orderInfo - 주문 정보 객체
 * @returns {Array} kok_order_id 배열
 */
export const collectKokOrderIds = (orderInfo) => {
  const allIds = collectAllOrderIds(orderInfo);
  return allIds.kok_order_ids;
};

/**
 * 주문 상태 자동 업데이트를 수행하는 통일된 함수
 * @param {Object} orderInfo - 주문 정보 객체
 * @returns {Object} 업데이트 결과 정보
 */
export const performOrderStatusUpdate = async (orderInfo) => {
  console.log('🚀 통일된 주문 상태 업데이트 시작');
  
  try {
    const allOrderIds = collectAllOrderIds(orderInfo);
    const { kok_order_ids, hs_order_ids } = allOrderIds;
    
    console.log('🔍 수집된 주문 ID들:', allOrderIds);
    console.log('🔍 kok_order_ids 개수:', kok_order_ids.length);
    console.log('🔍 hs_order_ids 개수:', hs_order_ids.length);
    console.log('🔍 주문 타입:', orderInfo?.fromCart ? '장바구니 주문' : '제품 상세 주문');
    
         // KOK 주문과 홈쇼핑 주문 중 하나만 처리 (혼합 주문은 없음)
     const orderIdsToProcess = kok_order_ids.length > 0 ? kok_order_ids : hs_order_ids;
     const orderType = kok_order_ids.length > 0 ? 'kok_order' : 'hs_order';
     
     if (orderIdsToProcess.length === 0) {
       console.log('⚠️ 주문 ID가 비어있어서 자동 상태 업데이트를 건너뜁니다.');
       return {
         success: true,
         totalCount: 0,
         successfulCount: 0,
         failedCount: 0,
         skipped: true,
         kokOrderCount: 0,
         hsOrderCount: 0
       };
     }
     
     console.log(`🔄 자동 상태 업데이트 시작 - ${orderType} 주문 처리`);
     console.log(`🔄 총 처리할 주문 ID 개수: ${orderIdsToProcess.length}`);
     
     // 주문 ID에 대해 일관된 방식으로 업데이트
     const updatePromises = orderIdsToProcess.map(async (orderId, index) => {
       console.log(`🔄 [${index + 1}/${orderIdsToProcess.length}] ${orderType} ${orderId} 상태 업데이트 중...`);
       
       // 재시도 로직: 최대 3회, 1초 간격
       const maxRetries = 3;
       const retryDelay = 1000; // 1초
       
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
           // 첫 번째 시도가 아닌 경우 지연
           if (attempt > 1) {
             console.log(`🔄 [${index + 1}/${orderIdsToProcess.length}] ${orderType} ${orderId} 재시도 ${attempt}/${maxRetries} - ${retryDelay}ms 대기 중...`);
             await new Promise(resolve => setTimeout(resolve, retryDelay));
           }
           
           const updateResponse = await orderApi.startAutoUpdate(orderId);
           console.log(`✅ [${index + 1}/${orderIdsToProcess.length}] ${orderType} ${orderId} 상태 업데이트 성공 (시도 ${attempt}):`, updateResponse);
           return { success: true, orderId, orderType, response: updateResponse, attempts: attempt };
         } catch (individualUpdateError) {
           console.error(`❌ [${index + 1}/${orderIdsToProcess.length}] ${orderType} ${orderId} 상태 업데이트 실패 (시도 ${attempt}):`, individualUpdateError);
           
           // 마지막 시도인 경우 실패로 처리
           if (attempt === maxRetries) {
             return { success: false, orderId, orderType, error: individualUpdateError, attempts: attempt };
           }
         }
       }
     });
    
    // 모든 업데이트 완료 대기
    const updateResults = await Promise.allSettled(updatePromises);
    
    // 결과 분석
    const successfulUpdates = updateResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failedUpdates = updateResults.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    ).length;
    
         // 주문 타입별 성공 개수 계산
     const orderTypeSuccess = updateResults.filter(result => 
       result.status === 'fulfilled' && result.value.success
     ).length;
     
     console.log(`✅ 통일된 주문 상태 업데이트 완료 - 성공: ${successfulUpdates}개, 실패: ${failedUpdates}개`);
     console.log(`📊 ${orderType} 주문 성공: ${orderTypeSuccess}개`);
    
    if (failedUpdates > 0) {
      console.warn(`⚠️ ${failedUpdates}개의 상태 업데이트가 실패했지만 결제는 성공으로 처리됩니다.`);
    }
    
         return {
       success: true,
       totalCount: orderIdsToProcess.length,
       successfulCount: successfulUpdates,
       failedCount: failedUpdates,
       skipped: false,
       orderType: orderType,
       orderTypeSuccess: orderTypeSuccess
     };
    
     } catch (error) {
     console.error('❌ 통일된 주문 상태 업데이트 실패:', error);
     return {
       success: false,
       error: error,
       totalCount: 0,
       successfulCount: 0,
       failedCount: 0,
       skipped: false,
       orderType: 'unknown'
     };
   }
};

/**
 * 주문 타입을 판별하는 헬퍼 함수
 * @param {Object} orderInfo - 주문 정보 객체
 * @returns {string} 주문 타입 ('cart' | 'product_detail' | 'unknown')
 */
export const getOrderType = (orderInfo) => {
  if (orderInfo?.fromCart) {
    return 'cart';
  } else if (orderInfo?.fromProductDetail || orderInfo?.productId) {
    return 'product_detail';
  }
  return 'unknown';
};
