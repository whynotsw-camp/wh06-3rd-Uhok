# API 명세서

## 개요
이 문서는 U+hok 프론트엔드 애플리케이션에서 사용하는 API 엔드포인트들의 명세를 정의합니다.

## 인증
- JWT 토큰 기반 인증
- `Authorization: Bearer <access_token>` 헤더 사용
- 토큰은 로컬 스토리지에 저장

## API 엔드포인트

### 1. 회원가입
- **기능**: 사용자가 이메일, 비밀번호, 사용자이름을 입력하여 회원가입을 진행
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/user/signup`
- **Header**: -
- **Query Parameter**: -
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "string",
    "username": "string"
  }
  ```
- **Response Code**: 201
- **Response Value**:
  ```json
  {
    "user_id": 0,
    "email": "user@example.com",
    "username": "string",
    "created_at": "2025-08-10T02:44:56.611Z"
  }
  ```

### 2. 이메일 중복 확인
- **기능**: 회원가입 중 입력한 email의 중복을 확인
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/user/signup/email/check`
- **Header**: -
- **Query Parameter**: `email`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "email": "user@example.com",
    "is_duplicate": true,
    "message": "string"
  }
  ```

### 3. 로그인
- **기능**: 이메일과 비밀번호를 입력하여 로그인을 진행
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/user/login`
- **Header**: -
- **Query Parameter**: -
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "bearer"
  }
  ```

### 4. 로그아웃
- **기능**: 사용자의 현재 세션을 종료하고 JWT 토큰을 블랙리스트에 추가하여 재사용을 방지
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/user/logout`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: -
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "message": "로그아웃이 완료되었습니다."
  }
  ```

### 5. 사용자 정보 조회
- **기능**: 로그인한 사용자의 기본 정보를 조회
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/user/info`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: -
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "user_id": 0,
    "email": "user@example.com",
    "username": "string",
    "created_at": "2025-08-10T02:48:48.352Z"
  }
  ```

### 6. 선택된 상품들로 주문 생성
- **기능**: 프론트엔드에서 선택된 상품들과 수량으로 주문 생성
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/orders/kok/carts/order`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: -
- **Request Body**:
  ```json
  {
    "selected_items": [
      {
        "cart_id": 1,
        "quantity": 2
      },
      {
        "cart_id": 3,
        "quantity": 1
      }
    ]
  }
  ```
- **Response Code**: 201
- **Response Value**:
  ```json
  {
    "order_id": 0,
    "total_amount": 0,
    "order_count": 0,
    "order_details": [
      {
        "kok_order_id": 0,
        "kok_product_id": 0,
        "kok_product_name": "string",
        "quantity": 0,
        "unit_price": 0,
        "total_price": 0
      }
    ],
    "message": "string",
    "order_time": "2025-08-27T05:26:01.650Z"
  }
  ```

### 7. 콕 주문 상태 업데이트 (수동)
- **기능**: 주문의 상태를 새로운 상태로 변경하고 이력을 기록합니다.
- **HTTP 메서드**: PATCH
- **엔드포인트 URL**: `/api/orders/kok/{kok_order_id}/status`
- **Header**: `Authorization: Bearer {access_token}`
- **Query Parameter**: `kok_order_id`
- **Request Body**:
  ```json
  {
    "new_status_code": "SHIPPING",
    "changed_by": 1
  }
  ```
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "kok_order_id": 5,
    "current_status": {
      "status_id": 3,
      "status_code": "SHIPPING",
      "status_name": "배송중"
    },
    "status_history": [
      {
        "history_id": 4,
        "kok_order_id": 5,
        "status": {
          "status_id": 3,
          "status_code": "SHIPPING",
          "status_name": "배송중"
        },
        "changed_at": "2025-08-07T14:30:10",
        "changed_by": 1
      }
    ]
  }
  ```

### 8. 콕 주문 상태 조회
- **기능**: 특정 콕 주문의 현재 상태와 모든 상태 변경 이력을 조회합니다.
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/orders/kok/{kok_order_id}/status`
- **Header**: `Authorization: Bearer {access_token}`
- **Query Parameter**: `kok_order_id`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "kok_order_id": 5,
    "current_status": {
      "status_id": 2,
      "status_code": "PREPARING",
      "status_name": "상품준비중"
    },
    "status_history": [
      {
        "history_id": 3,
        "kok_order_id": 5,
        "status": {
          "status_id": 2,
          "status_code": "PREPARING",
          "status_name": "상품준비중"
        },
        "changed_at": "2025-08-07T14:30:05",
        "changed_by": 1
      },
      {
        "history_id": 2,
        "kok_order_id": 5,
        "status": {
          "status_id": 1,
          "status_code": "PAYMENT_COMPLETED",
          "status_name": "결제완료"
        },
        "changed_at": "2025-08-07T14:30:00",
        "changed_by": 6
      }
    ]
  }
  ```

### 9. 콕 주문과 상태 함께 조회
- **기능**: 주문 상세 정보와 현재 상태를 한 번에 조회합니다.
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/orders/kok/{kok_order_id}/with-status`
- **Header**: `Authorization: Bearer {access_token}`
- **Query Parameter**: `kok_order_id`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "kok_order": {
      "kok_order_id": 5,
      "kok_price_id": 1,
      "kok_product_id": 1,
      "quantity": 2,
      "order_price": 50000
    },
    "current_status": {
      "status_id": 3,
      "status_code": "SHIPPING",
      "status_name": "배송중"
    }
  }
  ```

### 10. 콕 주문 자동 상태 업데이트
- **기능**: 특정 주문의 자동 상태 업데이트를 수동으로 시작합니다.
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/orders/kok/{kok_order_id}/auto-update`
- **Header**: `Authorization: Bearer {access_token}`
- **Query Parameter**: `kok_order_id`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  "string"
  ```

### 11. 로그 기록
- **기능**: 사용자 로그 적재 (USER_LOG 테이블에 기록)
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/log`
- **Header**: -
- **Query Parameter**: -
- **Request Body**:
  ```json
  {
    "user_id": 0,
    "event_type": "string",
    "event_data": {
      "additionalProp1": {}
    }
  }
  ```
- **Response Code**: 201
- **Response Value**:
  ```json
  {
    "user_id": 0,
    "event_type": "string",
    "event_data": {
      "additionalProp1": {}
    },
    "log_id": 0,
    "created_at": "2025-08-10T02:49:20.762Z"
  }
  ```

### 12. 사용자 로그 조회
- **기능**: 특정 사용자의 최근 로그 조회
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/log/user/{user_id}`
- **Header**: -
- **Query Parameter**: `user_id`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  [
    {
      "user_id": 0,
      "event_type": "string",
      "event_data": {
        "additionalProp1": {}
      },
      "log_id": 0,
      "created_at": "2025-08-10T02:49:49.693Z"
    }
  ]
  ```

### 13. 사용자 주문 목록 조회
- **기능**: 사용자의 주문내역을 불러온다. 주문번호별로 묶여 있으며, 상품별 정보와 총 결제 금액을 포함한다.
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/orders`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: `limit` (기본값: 10)
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "limit": 0,
    "total_count": 0,
    "order_groups": [
      {
        "order_id": 0,
        "order_number": "string",
        "order_date": "string",
        "total_amount": 0,
        "item_count": 0,
        "items": [
          {
            "product_name": "string",
            "product_image": "string",
            "price": 0,
            "quantity": 0,
            "delivery_status": "string",
            "delivery_date": "string",
            "recipe_related": false,
            "recipe_title": "string",
            "recipe_rating": 0,
            "recipe_scrap_count": 0,
            "recipe_description": "string",
            "ingredients_owned": 0,
            "total_ingredients": 0
          }
        ]
      }
    ]
  }
  ```

### 14. 결제요청 (롱폴링+웹훅) v2
- **기능**: v2(롱폴링) 결제확인 API - 클라이언트가 결제하기를 누르면 백엔드로 결제처리 요청, 백엔드에서 결제서버로 롱폴링 방식으로 결제확인, 웹훅으로 결제완료 응답을 받으면 진행사항 반영
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/orders/payment/{order_id}/confirm/v2`
- **Header**: `Authorization: Bearer <access_token>`
- **Path Parameter**: `order_id`
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "payment_id": "string",
    "order_id": 0,
    "kok_order_ids": [],
    "hs_order_id": 0,
    "status": "string",
    "payment_amount": 0,
    "method": "string",
    "confirmed_at": "2025-09-02T05:05:58.792Z",
    "order_id_internal": 0,
    "tx_id": "string"
  }
  ```

## 구현된 기능

### 프론트엔드 API 모듈
- `src/api/userApi.js`: 사용자 인증 관련 API 함수들
- `src/api/logApi.js`: 로그 관련 API 함수들
- `src/api/cartApi.js`: 장바구니 관련 API 함수들 (기존)

### 상품 찜&알림 등록/해제
- **기능**: 사용자가 특정 상품을 찜하거나, 이미 찜 한 경우 취소한다. 찜 할 경우에 알림이 설정되고, 찜을 취소하면 알림도 취소된다.
- **HTTP 메서드**: POST
- **엔드포인트 URL**: `/api/homeshopping/likes/toggle`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: -
- **Request Body**:
  ```json
  {
    "live_id": 0
  }
  ```
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "liked": true,
    "message": "string"
  }
  ```

### 찜한 상품 API 응답 구조

#### 홈쇼핑 찜한 상품 목록 조회
- **기능**: 사용자가 찜한 모든 상품을 조회한다.
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/homeshopping/likes`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: `limit` (1 ~ 50)
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "liked_products": [
      {
        "live_id": 0,
        "product_id": 0,
        "product_name": "string",
        "store_name": "string",
        "dc_price": 0,
        "dc_rate": 0,
        "thumb_img_url": "string",
        "homeshopping_like_created_at": "2025-09-10T05:50:22.016Z",
        "homeshopping_id": 0,
        "live_date": "2025-09-10",
        "live_start_time": "05:50:22.016Z",
        "live_end_time": "05:50:22.016Z"
      }
    ]
  }
  ```

#### 콕 쇼핑몰 찜한 상품 목록 조회
- **기능**: 사용자가 찜한 콕 쇼핑몰 상품 목록을 조회
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/kok/likes`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameter**: `limit` (기본값: 50)
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "liked_products": [
      {
        "kok_product_id": 0,
        "kok_product_name": "string",
        "kok_store_name": "string",
        "kok_discounted_price": 0,
        "kok_discount_rate": 0,
        "kok_thumbnail": "string",
        "kok_like_created_at": "2025-08-30T03:04:55.605Z"
      }
    ]
  }
  ```

### 9. 식재료 기반 홈쇼핑 상품 추천
- **기능**: 해당 식재료 관련 콕쇼핑몰과 홈쇼핑 내 관련 상품 정보 제공
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/recipes/{ingredient}/product-recommend`
- **Header**: `Authorization: Bearer <access_token>`
- **Path Parameter**: `ingredient` (string, 필수): 식재료명
- **Query Parameter**: -
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "ingredient": "string",
    "recommendations": [
      {
        "source": "string",
        "name": "string",
        "id": 0,
        "thumb_img_url": "string",
        "image_url": "string",
        "brand_name": "string",
        "price": 0,
        "homeshopping_id": 0,
        "kok_discount_rate": 0,
        "kok_review_cnt": 0,
        "kok_review_score": 0,
        "dc_rate": 0
      }
    ],
    "total_count": 0
  }
  ```
- **사용 예시**:
  ```
  GET /api/recipes/양파/product-recommend
  ```

### 10. 레시피 추천
- **기능**: 선택된 상품들(KOK 상품, 홈쇼핑 상품)을 기반으로 레시피를 추천
- **HTTP 메서드**: GET
- **엔드포인트 URL**: `/api/kok/carts/recipe-recommend`
- **Header**: `Authorization: Bearer <access_token>`
- **Query Parameters**:
  - `product_ids` (string, 필수): 상품 ID 목록 (쉼표로 구분) - 예시: "35390738,123456,12345,67890"
  - `page` (integer, 필수): 페이지 번호 (1부터 시작) - 예시: 1
  - `size` (integer, 필수): 페이지당 레시피 수 (1-100) - 예시: 5
- **Request Body**: -
- **Response Code**: 200
- **Response Value**:
  ```json
  {
    "recipes": [
      {
        "recipe_id": 0,
        "recipe_title": "string",
        "cooking_introduction": "string",
        "thumbnail_url": "string",
        "number_of_serving": "string",
        "scrap_count": 0,
        "matched_ingredient_count": 0,
        "total_ingredients_count": 0,
        "used_ingredients": []
      }
    ],
    "total_count": 0,
    "page": 1,
    "size": 5,
    "total_pages": 0,
    "keyword_extraction": ["string"]
  }
  ```
- **사용 예시**:
  ```
  GET /api/kok/carts/recipe-recommend?product_ids=35390738,123456,12345,67890&page=1&size=5
  ```

### 수정된 컴포넌트
- `src/pages/user/Login.js`: 새로운 API에 맞게 수정
- `src/pages/user/Signup.js`: 새로운 API에 맞게 수정
- `src/pages/user/Logout.js`: 새로운 API에 맞게 생성
- `src/pages/user/MyPage.js`: 새로운 API에 맞게 수정
- `src/contexts/UserContext.js`: 로그 기능 추가

### 주요 변경사항
1. **API 엔드포인트 통일**: 명세서에 맞는 엔드포인트 사용
2. **비동기 처리**: async/await 패턴으로 일관성 있는 비동기 처리
3. **에러 핸들링**: 체계적인 에러 처리 및 로깅
4. **로그 기능**: 사용자 활동 로그 기록 및 조회
5. **토큰 관리**: JWT 토큰 자동 저장/제거 및 만료 처리

## 사용 예시

### 로그인
```javascript
import { userApi } from '../api/userApi';

const handleLogin = async (email, password) => {
  try {
    const response = await userApi.login({ email, password });
    console.log('로그인 성공:', response);
  } catch (error) {
    console.error('로그인 실패:', error);
  }
};
```

### 사용자 정보 조회
```javascript
import { userApi } from '../api/userApi';

const getUserInfo = async () => {
  try {
    const userInfo = await userApi.getUserInfo();
    console.log('사용자 정보:', userInfo);
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
  }
};
```

### 로그 기록
```javascript
import { logApi } from '../api/logApi';

const logUserActivity = async (userId, eventType, eventData) => {
  try {
    await logApi.createUserLog({
      user_id: userId,
      event_type: eventType,
      event_data: eventData
    });
    console.log('로그 기록 완료');
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
};
```
