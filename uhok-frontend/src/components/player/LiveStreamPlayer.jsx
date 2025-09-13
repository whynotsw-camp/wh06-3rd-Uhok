import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const LiveStreamPlayer = ({ 
  src, 
  autoPlay = true, 
  muted = true, 
  controls = true, 
  width = '100%', 
  height = 'auto',
  onError,
  onLoadStart,
  onLoadedData,
  style = {}
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [networkStats, setNetworkStats] = useState({
    bandwidth: 0,
    latency: 0,
    droppedFrames: 0
  });

  useEffect(() => {
    // 스트림 URL 검증
    if (!src || !videoRef.current) {
      console.log('❌ LiveStreamPlayer: 유효하지 않은 src 또는 videoRef');
      return;
    }

    // 스트림 URL 유효성 검사
    const isValidUrl = src && 
      src.trim() !== '' && 
      src !== 'undefined' && 
      src !== 'null' &&
      (src.includes('http') || src.includes('m3u8') || src.includes('mp4'));
    
    if (!isValidUrl) {
      console.error('❌ LiveStreamPlayer: 유효하지 않은 스트림 URL:', src);
      const error = new Error(`유효하지 않은 스트림 URL: ${src}`);
      setError(error);
      onError?.(error);
      return;
    }

    const video = videoRef.current;
    
    // 디버깅 정보 초기화
    setDebugInfo({
      src: src,
      hlsSupported: Hls.isSupported(),
      videoReady: !!videoRef.current,
      timestamp: new Date().toISOString(),
      isValidUrl: isValidUrl
    });
    
    console.log('🎬 LiveStreamPlayer 초기화:', { 
      src, 
      hlsSupported: Hls.isSupported(),
      isValidUrl: isValidUrl
    });
    
    // HLS 지원 여부 확인
    if (Hls.isSupported()) {
      // HLS.js 사용
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      hlsRef.current = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        // 버퍼링 관련 설정 추가
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        // 네트워크 관련 설정
        maxLoadingDelay: 4,
        maxFragLookUpTolerance: 0.25,
        // 오류 복구 설정
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        // 타임아웃 설정
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
        // 품질 관련 설정
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7
      });

      console.log('🔧 HLS.js 인스턴스 생성 완료');
      hlsRef.current.loadSource(src);
      hlsRef.current.attachMedia(video);

      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, video ready to play');
        if (autoPlay) {
          video.play().catch(e => console.log('Auto-play prevented:', e));
        }
        setIsLoading(false);
        onLoadedData?.();
      });

      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        
        // bufferStalledError는 자동으로 복구 시도
        if (data.details === 'bufferStalledError' && !data.fatal) {
          console.log('🔄 bufferStalledError 감지, 자동 복구 시도...');
          // 잠시 대기 후 재시도
          setTimeout(() => {
            if (hlsRef.current && videoRef.current) {
              try {
                hlsRef.current.startLoad();
                console.log('✅ bufferStalledError 복구 완료');
              } catch (e) {
                console.error('❌ bufferStalledError 복구 실패:', e);
              }
            }
          }, 1000);
          return;
        }
        
        // 네트워크 오류는 재시도
        if (data.details === 'networkError' && !data.fatal) {
          console.log('🔄 네트워크 오류 감지, 재시도 중...');
          setTimeout(() => {
            if (hlsRef.current && videoRef.current) {
              try {
                hlsRef.current.startLoad();
                console.log('✅ 네트워크 오류 복구 완료');
              } catch (e) {
                console.error('❌ 네트워크 오류 복구 실패:', e);
              }
            }
          }, 2000);
          return;
        }
        
        const errorInfo = {
          type: 'HLS_ERROR',
          details: data,
          message: `HLS 오류: ${data.details || '알 수 없는 오류'}`,
          fatal: data.fatal
        };
        setError(errorInfo);
        setDebugInfo(prev => ({ ...prev, lastError: errorInfo }));
        setIsLoading(false);
        onError?.(errorInfo);
      });

      hlsRef.current.on(Hls.Events.LOADING, () => {
        setIsLoading(true);
        onLoadStart?.();
      });

      hlsRef.current.on(Hls.Events.LOADED, () => {
        setIsLoading(false);
      });

      // 스트림 상태 모니터링 추가
      hlsRef.current.on(Hls.Events.FRAG_LOADING, () => {
        // console.log('📡 프래그먼트 로딩 중...');
      });

      hlsRef.current.on(Hls.Events.FRAG_LOADED, () => {
        // console.log('✅ 프래그먼트 로딩 완료');
      });

      hlsRef.current.on(Hls.Events.BUFFER_STALLED, () => {
        console.log('⚠️ 버퍼 정지 감지, 복구 시도...');
        // 버퍼 정지 시 자동 복구
        setTimeout(() => {
          if (hlsRef.current && videoRef.current) {
            try {
              hlsRef.current.startLoad();
              console.log('✅ 버퍼 정지 복구 완료');
            } catch (e) {
              console.error('❌ 버퍼 정지 복구 실패:', e);
            }
          }
        }, 500);
      });

      hlsRef.current.on(Hls.Events.BUFFER_EOS, () => {
        console.log('📺 버퍼 끝에 도달');
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari에서 네이티브 HLS 지원
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        console.log('Native HLS loaded');
        setIsLoading(false);
        onLoadedData?.();
      });
      
      video.addEventListener('error', (e) => {
        console.error('Native HLS error:', e);
        setError(e);
        setIsLoading(false);
        onError?.(e);
      });
    } else {
      // HLS를 지원하지 않는 경우
      const error = new Error('HLS is not supported in this browser');
      setError(error);
      onError?.(error);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, onError, onLoadStart, onLoadedData]);

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setError(e);
    onError?.(e);
  };

  if (error) {
    return (
      <div style={{
        width,
        height,
        backgroundColor: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        ...style
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>스트림을 로드할 수 없습니다</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>
            {error.message || '알 수 없는 오류'}
          </div>
          {/* 디버깅 정보 표시 */}
          <details style={{ fontSize: '12px', opacity: 0.6, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>디버깅 정보</summary>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <div>스트림 URL: {debugInfo.src || '없음'}</div>
          <div>HLS 지원: {debugInfo.hlsSupported ? '예' : '아니오'}</div>
          <div>비디오 준비: {debugInfo.videoReady ? '예' : '아니오'}</div>
          <div>에러 타입: {error.type || '알 수 없음'}</div>
          {error.fatal !== undefined && <div>치명적 오류: {error.fatal ? '예' : '아니오'}</div>}
          <div>시간: {debugInfo.timestamp || '알 수 없음'}</div>
          {error.details && (
            <>
              <div>오류 상세: {error.details.details || '없음'}</div>
              <div>오류 코드: {error.details.code || '없음'}</div>
              <div>오류 메시지: {error.details.message || '없음'}</div>
            </>
          )}
        </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <video
        ref={videoRef}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          backgroundColor: '#000',
          ...style
        }}
        onError={handleVideoError}
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          스트림 로딩 중...
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
