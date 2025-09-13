// 콕 결제 확인 API 테스트 컴포넌트
import React, { useState } from 'react';
import { kokApi } from '../api/kokApi';
import '../styles/kok_payment.css';

const KokPaymentTest = () => {
  const [kokOrderId, setKokOrderId] = useState('12345');
  const [orderId, setOrderId] = useState('ORD-001');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 단건 결제 확인 테스트
  const testSinglePaymentConfirmation = async () => {
    if (!kokOrderId.trim()) {
      alert('콕 주문 ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setTestResult('');

    try {
      console.log(`단건 결제 확인 테스트 시작: kok_order_id = ${kokOrderId}`);
      
      const result = await kokApi.confirmKokPayment(kokOrderId);
      
      if (result.success) {
        setTestResult(`✅ 단건 결제 확인 성공!\n\n메시지: ${result.message}\n데이터: ${JSON.stringify(result.data, null, 2)}`);
      } else {
        setTestResult(`❌ 단건 결제 확인 실패!\n\n에러: ${result.error}\n메시지: ${result.message}`);
      }
    } catch (error) {
      console.error('단건 결제 확인 테스트 실패:', error);
      setTestResult(`❌ 단건 결제 확인 테스트 중 오류 발생!\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 주문 단위 결제 확인 테스트
  const testOrderUnitPaymentConfirmation = async () => {
    if (!orderId.trim()) {
      alert('주문 ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setTestResult('');

    try {
      console.log(`주문 단위 결제 확인 테스트 시작: order_id = ${orderId}`);
      
      const result = await kokApi.confirmOrderUnitPayment(orderId);
      
      if (result.success) {
        setTestResult(`✅ 주문 단위 결제 확인 성공!\n\n메시지: ${result.message}\n데이터: ${JSON.stringify(result.data, null, 2)}`);
      } else {
        setTestResult(`❌ 주문 단위 결제 확인 실패!\n\n에러: ${result.error}\n메시지: ${result.message}`);
      }
    } catch (error) {
      console.error('주문 단위 결제 확인 테스트 실패:', error);
      setTestResult(`❌ 주문 단위 결제 확인 테스트 중 오류 발생!\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-content">
        <h1>콕 결제 확인 API 테스트</h1>
        
        <div className="test-section">
          <h2>1. 단건 결제 확인 테스트</h2>
          <div className="form-group">
            <label>콕 주문 ID (kok_order_id):</label>
            <input
              type="text"
              value={kokOrderId}
              onChange={(e) => setKokOrderId(e.target.value)}
              placeholder="예: 12345"
              disabled={isLoading}
            />
          </div>
          <button 
            className="order-button"
            onClick={testSinglePaymentConfirmation}
            disabled={isLoading}
          >
            {isLoading ? '테스트 중...' : '단건 결제 확인 테스트'}
          </button>
        </div>

        <div className="test-section">
          <h2>2. 주문 단위 결제 확인 테스트</h2>
          <div className="form-group">
            <label>주문 ID (order_id):</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="예: ORD-001"
              disabled={isLoading}
            />
          </div>
          <button 
            className="order-button"
            onClick={testOrderUnitPaymentConfirmation}
            disabled={isLoading}
          >
            {isLoading ? '테스트 중...' : '주문 단위 결제 확인 테스트'}
          </button>
        </div>

        {testResult && (
          <div className="test-result">
            <h2>테스트 결과</h2>
            <pre>{testResult}</pre>
          </div>
        )}

        <div className="api-info">
          <h2>API 엔드포인트 정보</h2>
          <div className="endpoint-info">
            <h3>1. 콕 결제 확인 (단건)</h3>
            <p><strong>HTTP 메서드:</strong> POST</p>
            <p><strong>엔드포인트:</strong> /api/orders/kok/{kokOrderId}/payment/confirm</p>
            <p><strong>헤더:</strong> Authorization: Bearer {access_token}</p>
            <p><strong>Path Parameter:</strong> kok_order_id</p>
            <p><strong>응답 코드:</strong> 200</p>
            <p><strong>설명:</strong> 현재 상태가 PAYMENT_REQUESTED인 해당 kok_order_id의 주문을 PAYMENT_COMPLETED로 변경</p>
          </div>

          <div className="endpoint-info">
            <h3>2. 결제 확인 (주문 단위)</h3>
            <p><strong>HTTP 메서드:</strong> POST</p>
            <p><strong>엔드포인트:</strong> /api/orders/kok/order-unit/{orderId}/payment/confirm</p>
            <p><strong>헤더:</strong> Authorization: Bearer {access_token}</p>
            <p><strong>Path Parameter:</strong> order_id</p>
            <p><strong>응답 코드:</strong> 200</p>
            <p><strong>설명:</strong> 주어진 order_id에 속한 모든 KokOrder를 PAYMENT_COMPLETED로 변경</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KokPaymentTest;
