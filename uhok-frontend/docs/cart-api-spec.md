# 장바구니 API 명세서

## 기본 정보
- Base URL: `http://localhost:9000`
- Content-Type: `application/json`
- Authorization: `Bearer {access_token}` (인증이 필요한 엔드포인트)

## 1. 장바구니 추가

| 항목 | 내용 |
|------|------|
| 기능 | 장바구니 추가 |
| 설명 | 사용자가 상품을 장바구니에 추가한다. (수량은 1개로 고정, 기존 상품이 있으면 추가하지 않음) |
| HTTP 메서드 | POST |
| 엔드포인트 URL | `/api/kok/carts` |
| Header | `Authorization: Bearer <access_token>`<br>`Content-Type: application/json` |
| Query Parameter | - |
| Request body | ```json<br>{<br>  "kok_product_id": 0,<br>  "kok_quantity": 1,<br>  "recipe_id": 0<br>}``` |
| Responses Code | 201 |
| Responses Value | ```json<br>{<br>  "kok_cart_id": 0,<br>  "message": "string"<br>}``` |

**Request body 필드 설명:**
- `kok_product_id` (필수): 콕 상품 ID (정수)
- `kok_quantity` (필수): 수량 (정수, 고정값: 1)
- `recipe_id` (선택): 레시피 ID (정수, 기본값: 0)

**응답 필드 설명:**
- `kok_cart_id`: 생성된 장바구니 항목 ID
- `message`: 성공 메시지

**에러 응답:**
- `400 Bad Request`: 잘못된 요청 (이미 장바구니에 있는 상품 등)
- `401 Unauthorized`: 인증 실패
- `422 Unprocessable Content`: 데이터 유효성 검증 실패
- `500 Internal Server Error`: 서버 내부 오류

### 2. 장바구니 상품 조회

| 항목 | 내용 |
|------|------|
| 기능 | 장바구니 상품 조회 |
| 설명 | 사용자가 담아놓은 상품 전체를 조회한다. |
| HTTP 메서드 | GET |
| 엔드포인트 URL | `/api/kok/carts` |
| Header | `Authorization: Bearer <access_token>` |
| Query Parameter | `limit` (선택): 조회할 상품 개수 (기본값: 50) |
| Request body | - |
| Responses Code | 200 |
| Responses Value | ```json<br>{<br>  "cart_items": [<br>    {<br>      "kok_cart_id": 1,<br>      "kok_product_id": 123,<br>      "kok_product_name": "상품명",<br>      "kok_thumbnail": "https://example.com/thumbnail.jpg",<br>      "kok_product_price": 15000,<br>      "kok_discount_rate": 10,<br>      "kok_discounted_price": 13500,<br>      "kok_store_name": "스토어명",<br>      "kok_quantity": 2<br>    }<br>  ]<br>}``` |

### 3. 장바구니 상품 수량 변경

| 항목 | 내용 |
|------|------|
| 기능 | 장바구니 상품 수량 변경 |
| 설명 | 장바구니에서 상품의 수량을 변경한다. |
| HTTP 메서드 | PATCH |
| 엔드포인트 URL | `/api/kok/carts/{cartItemId}` |
| Header | `Authorization: Bearer <access_token>`<br>`Content-Type: application/json` |
| Query Parameter | - |
| Request body | ```json<br>{<br>  "kok_quantity": 3<br>}``` |
| Responses Code | 200 |
| Responses Value | ```json<br>{<br>  "kok_cart_id": 123,<br>  "kok_quantity": 3,<br>  "message": "수량이 3개로 변경되었습니다."<br>}``` |

### 4. 장바구니 상품 삭제

| 항목 | 내용 |
|------|------|
| 기능 | 장바구니 상품 삭제 |
| 설명 | 장바구니에서 상품을 삭제한다. |
| HTTP 메서드 | DELETE |
| 엔드포인트 URL | `/api/kok/carts/{kok_cart_id}` |
| Header | `Authorization: Bearer <access_token>` |
| Query Parameter | - |
| Request body | - |
| Responses Code | 200 |
| Responses Value | ```json<br>{<br>  "message": "장바구니에서 상품이 삭제되었습니다."<br>}``` |

### 5. 콕 결제 확인 (단건)

| 항목 | 내용 |
|------|------|
| 기능 | 콕 결제 확인 (단건) |
| 설명 | 현재 상태가 PAYMENT_REQUESTED인 해당 kok_order_id의 주문을 PAYMENT_COMPLETED로 변경한다. |
| HTTP 메서드 | POST |
| 엔드포인트 URL | `/api/orders/kok/{kok_order_id}/payment/confirm` |
| Header | `Authorization: Bearer <access_token>` |
| Query Parameter | - |
| Path Parameter | `kok_order_id`: 콕 주문 ID |
| Request body | - |
| Responses Code | 200 |
| Responses Value | `"결제 확인이 완료되었습니다."` |

### 6. 결제 확인 (주문 단위)

| 항목 | 내용 |
|------|------|
| 기능 | 결제 확인 (주문 단위) |
| 설명 | 주어진 order_id에 속한 모든 KokOrder를 PAYMENT_COMPLETED로 변경한다. |
| HTTP 메서드 | POST |
| 엔드포인트 URL | `/api/orders/kok/order-unit/{order_id}/payment/confirm` |
| Header | `Authorization: Bearer <access_token>` |
| Query Parameter | - |
| Path Parameter | `order_id`: 주문 ID |
| Request body | - |
| Responses Code | 200 |
| Responses Value | `"주문 단위 결제 확인이 완료되었습니다."` |

## 에러 응답 형식

모든 API에서 에러 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "error": "에러 메시지",
  "error_code": "ERROR_CODE",
  "details": "상세 에러 정보"
}
```

### 주요 에러 코드
- `UNAUTHORIZED`: 인증 실패
- `FORBIDDEN`: 권한 없음
- `NOT_FOUND`: 리소스를 찾을 수 없음
- `BAD_REQUEST`: 잘못된 요청
- `INTERNAL_SERVER_ERROR`: 서버 내부 오류
- `CART_ITEM_NOT_FOUND`: 장바구니 상품을 찾을 수 없음
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_QUANTITY`: 잘못된 수량

## 상태 코드

- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류
