# UHOK Frontend

## 🔐 **인증 및 토큰 관리**

### **401 Unauthorized 에러 해결**

#### **문제 상황**
- API 요청 시 `401 (Unauthorized)` 에러 발생
- 주문 내역 조회 등 인증이 필요한 API에서 토큰 인증 실패

#### **해결 방법**

##### **1. 자동 토큰 갱신**
- 토큰 만료 5분 전에 자동으로 갱신 시도
- `refresh_token`을 사용하여 `access_token` 갱신
- 갱신 성공 시 원래 요청 자동 재시도

##### **2. 사용자 경험 개선**
- 401 에러 발생 시 명확한 안내 메시지 제공
- 토큰 갱신 실패 시 자동으로 로그인 페이지로 이동
- 중복 알림 방지를 위한 플래그 관리

#### **구현된 기능**

##### **API 인터셉터 (`src/pages/api.js`)**
```javascript
// 요청 인터셉터: 토큰 자동 추가 및 만료 확인
api.interceptors.request.use(async (config) => {
  // 토큰 만료 시 자동 갱신 시도
  if (isTokenExpired(token)) {
    const refreshSuccess = await attemptTokenRefresh();
    // 갱신 성공 시 요청 계속, 실패 시 로그아웃
  }
});

// 응답 인터셉터: 401 에러 시 토큰 갱신 시도
api.interceptors.response.use(async (response) => {
  // 401 에러 발생 시 토큰 갱신 후 원래 요청 재시도
});
```

##### **UserContext (`src/contexts/UserContext.js`)**
```javascript
// 토큰 갱신 함수
const refreshToken = async () => {
  const success = await attemptTokenRefresh();
  if (success) {
    // 갱신 성공 시 사용자 상태 업데이트
    setUser(prev => ({ ...prev, token: newToken }));
    return true;
  } else {
    // 갱신 실패 시 로그아웃
    logout();
    return false;
  }
};
```

##### **OrderList 컴포넌트 (`src/pages/user/OrderList.js`)**
```javascript
// 401 에러 발생 시 토큰 갱신 시도
if (error.response?.status === 401) {
  const refreshSuccess = await refreshToken();
  if (refreshSuccess) {
    // 토큰 갱신 성공 시 API 재시도
    ordersResponse = await orderApi.getUserOrders(20);
  }
}
```

#### **개발용 토큰 테스트**

##### **토큰 생성**
```javascript
import { createDevToken } from './utils/authUtils';

// 60분 유효한 개발용 토큰 생성
const devToken = createDevToken(60);
localStorage.setItem('access_token', devToken);
```

##### **토큰 상태 확인**
```javascript
import { isTokenExpired, decodeToken } from './utils/authUtils';

// 토큰 만료 확인
const isExpired = isTokenExpired(token);

// 토큰 정보 디코딩
const tokenInfo = decodeToken(token);
```

#### **환경 설정**

##### **프록시 설정 (`package.json`)**
```json
{
  "proxy": "http://api2.uhok.com:80"
}
```

##### **백엔드 API 엔드포인트**
- 토큰 갱신: `POST /api/auth/refresh`
- 주문 내역: `GET /api/orders?limit=20`

#### **에러 처리 우선순위**

1. **토큰 자동 갱신** - 사용자 개입 없이 자동 처리
2. **사용자 안내** - 명확한 에러 메시지와 해결 방법 제시
3. **자동 리다이렉트** - 인증 실패 시 로그인 페이지로 이동
4. **폴백 데이터** - API 실패 시 기본 데이터로 UI 표시

#### **모니터링 및 로깅**

- 모든 토큰 관련 작업에 대한 상세 로그
- API 요청/응답 상태 추적
- 사용자 인증 이벤트 기록
- 에러 발생 시 상세 정보 수집

---

## 🚀 **Quick Start**

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 콕 결제 확인 API

### 개요
이 프로젝트는 콕 쇼핑몰의 결제 확인 기능을 제공하는 React 애플리케이션입니다.

### 주요 기능
- **단건 결제 확인**: 개별 콕 주문의 결제 상태를 PAYMENT_COMPLETED로 변경
- **주문 단위 결제 확인**: 특정 주문에 속한 모든 콕 주문의 결제 상태를 일괄 변경
- **비동기 처리**: 모든 API 호출은 비동기 방식으로 처리되어 사용자 경험 향상
- **에러 처리**: 다양한 HTTP 상태 코드에 대한 적절한 에러 처리 및 사용자 피드백

### API 엔드포인트

#### 1. 콕 결제 확인 (단건)
- **HTTP 메서드**: POST
- **엔드포인트**: `/api/orders/kok/{kok_order_id}/payment/confirm`
- **헤더**: `Authorization: Bearer {access_token}`
- **Path Parameter**: `kok_order_id`
- **응답 코드**: 200
- **설명**: 현재 상태가 PAYMENT_REQUESTED인 해당 kok_order_id의 주문을 PAYMENT_COMPLETED로 변경

#### 2. 결제 확인 (주문 단위)
- **HTTP 메서드**: POST
- **엔드포인트**: `/api/orders/kok/order-unit/{order_id}/payment/confirm`
- **헤더**: `Authorization: Bearer {access_token}`
- **Path Parameter**: `order_id`
- **응답 코드**: 200
- **설명**: 주어진 order_id에 속한 모든 KokOrder를 PAYMENT_COMPLETED로 변경

### 사용법

#### API 호출 예시
```javascript
import { kokApi } from './api/kokApi';

// 단건 결제 확인
const result = await kokApi.confirmKokPayment('12345');

// 주문 단위 결제 확인
const result = await kokApi.confirmOrderUnitPayment('ORD-001');
```

#### 응답 형식
```javascript
// 성공 시
{
  success: true,
  message: "결제 확인이 완료되었습니다.",
  data: "결제 확인이 완료되었습니다."
}

// 실패 시
{
  success: false,
  message: "에러 메시지",
  error: "ERROR_CODE"
}
```

### 컴포넌트

#### KokPayment.js
- 메인 결제 페이지
- 결제 방법 선택 및 카드 정보 입력
- 결제 처리 및 결제 확인 API 연동
- 실시간 결제 상태 표시

#### KokPaymentTest.js
- API 테스트용 컴포넌트
- 단건/주문 단위 결제 확인 테스트
- API 엔드포인트 정보 표시

### 스타일링
- `kok_payment.css`: 결제 페이지 및 테스트 컴포넌트 스타일
- 반응형 디자인 지원
- 결제 상태별 시각적 피드백

## 개발 환경 설정

### 백엔드 서버 설정
1. 백엔드 서버를 포트 80에서 실행하세요
2. 프록시 설정이 `package.json`에 `"proxy": "http://localhost:80"`으로 되어 있습니다
3. 백엔드 서버가 실행되지 않은 경우 모의 모드로 동작합니다

### 환경 변수
- `NODE_ENV=development`: 개발 환경에서 백엔드 연결 실패를 허용합니다
- `PORT=3001`: 프론트엔드 서버가 포트 3001에서 실행됩니다

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3001](http://localhost:3001) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

**주의사항**: 
- 백엔드 서버가 실행되지 않은 경우 모의 모드로 동작합니다.
- 실제 결제 처리를 위해서는 백엔드 서버가 포트 80에서 실행되어야 합니다.
- 프록시 설정: `package.json`에서 `"proxy": "http://localhost:80"`으로 설정되어 있습니다.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)



