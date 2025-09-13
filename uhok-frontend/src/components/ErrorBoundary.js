import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 에러가 발생하면 상태를 업데이트하여 다음 렌더링에서 fallback UI를 보여줍니다
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 에러가 발생했을 때 보여줄 fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          margin: '10px'
        }}>
          <h3>😅 컴포넌트 로딩 중 문제가 발생했습니다</h3>
          <p>잠시 후 다시 시도해주세요.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
