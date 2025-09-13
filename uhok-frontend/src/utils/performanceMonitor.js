// 성능 모니터링 유틸리티
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  // 페이지 로드 시간 측정
  measurePageLoad(pageName) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        this.metrics.set(`${pageName}_load_time`, loadTime);
        console.log(`📊 ${pageName} 로드 시간: ${loadTime.toFixed(2)}ms`);
        
        // 느린 로딩 경고
        if (loadTime > 3000) {
          console.warn(`⚠️ ${pageName} 로딩이 느립니다: ${loadTime.toFixed(2)}ms`);
        }
        
        return loadTime;
      }
    };
  }

  // API 호출 시간 측정
  measureApiCall(apiName) {
    const startTime = performance.now();
    
    return {
      end: (success = true) => {
        const endTime = performance.now();
        const callTime = endTime - startTime;
        
        const key = `${apiName}_${success ? 'success' : 'error'}`;
        this.metrics.set(key, callTime);
        
        console.log(`🌐 ${apiName} API 호출 시간: ${callTime.toFixed(2)}ms`);
        
        // 느린 API 경고
        if (callTime > 2000) {
          console.warn(`⚠️ ${apiName} API가 느립니다: ${callTime.toFixed(2)}ms`);
        }
        
        return callTime;
      }
    };
  }

  // 컴포넌트 렌더링 시간 측정
  measureRender(componentName) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.metrics.set(`${componentName}_render_time`, renderTime);
        
        if (renderTime > 100) {
          console.warn(`⚠️ ${componentName} 렌더링이 느립니다: ${renderTime.toFixed(2)}ms`);
        }
        
        return renderTime;
      }
    };
  }

  // 메모리 사용량 모니터링
  measureMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      
      console.log(`💾 메모리 사용량: ${usedMB}MB / ${totalMB}MB`);
      
      // 메모리 사용량이 높으면 경고
      if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.8) {
        console.warn('⚠️ 메모리 사용량이 높습니다. 가비지 컬렉션을 고려하세요.');
      }
      
      return { used: usedMB, total: totalMB };
    }
    return null;
  }

  // 모든 메트릭 가져오기
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // 메트릭 초기화
  clearMetrics() {
    this.metrics.clear();
  }

  // 성능 리포트 생성
  generateReport() {
    const metrics = this.getAllMetrics();
    const memory = this.measureMemory();
    
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      memory,
      recommendations: this.generateRecommendations(metrics)
    };
    
    console.log('📊 성능 리포트:', report);
    return report;
  }

  // 성능 개선 권장사항 생성
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // 느린 페이지 로딩
    Object.entries(metrics).forEach(([key, value]) => {
      if (key.includes('_load_time') && value > 3000) {
        recommendations.push(`${key}: 페이지 로딩이 느립니다. 코드 스플리팅을 고려하세요.`);
      }
      
      if (key.includes('_api_call') && value > 2000) {
        recommendations.push(`${key}: API 호출이 느립니다. 캐싱을 고려하세요.`);
      }
      
      if (key.includes('_render_time') && value > 100) {
        recommendations.push(`${key}: 컴포넌트 렌더링이 느립니다. React.memo를 고려하세요.`);
      }
    });
    
    return recommendations;
  }
}

// 전역 성능 모니터 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// React Hook으로 성능 모니터링
export const usePerformanceMonitor = (componentName) => {
  const measureRender = useCallback(() => {
    return performanceMonitor.measureRender(componentName);
  }, [componentName]);

  const measureApiCall = useCallback((apiName) => {
    return performanceMonitor.measureApiCall(apiName);
  }, []);

  return {
    measureRender,
    measureApiCall,
    measureMemory: performanceMonitor.measureMemory.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor)
  };
};
