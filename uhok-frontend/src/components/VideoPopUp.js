import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/videoPopUp.css';

const VideoPopUp = ({ 
  videoUrl, 
  productName = '상품명', 
  homeshoppingName = '홈쇼핑',
  kokProductId = '',
  onClose,
  isVisible = false,
  broadcastStatus = null,
  thumbnailUrl = null
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // 비디오 로드 완료 시
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 비디오 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 재생/일시정지 토글
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 볼륨 변경
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // 음소거 토글
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 진행률 변경
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // 시간 포맷팅
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 콕 상품 상세 페이지로 이동
  const handleGoToKokProduct = () => {
    // 현재 URL에서 콕 상품 ID를 추출하거나, props로 받은 상품 ID를 사용
    const currentPath = window.location.pathname;
    if (currentPath.includes('/kok/product/')) {
      // 이미 콕 상품 페이지에 있는 경우 팝업만 닫기
      onClose();
    } else {
      // 홈쇼핑 페이지에서 온 경우 콕 상품 페이지로 이동
      // props로 받은 콕 상품 ID를 사용
      const productId = kokProductId || '1'; // 기본값으로 1 사용
      navigate(`/kok/product/${productId}`);
    }
  };

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="video-popup-overlay">
      <div className="video-popup-container">
        {/* 헤더 */}
        <div className="video-popup-header">
          <div className="video-popup-info">
            <div className="video-popup-title">
              <span className="video-popup-homeshopping">{homeshoppingName}</span>
              <span className="video-popup-separator">→</span>
              <span className="video-popup-product">{productName}</span>
            </div>
            <div className="video-popup-subtitle">
              콕에서 비슷한 상품을 확인해보세요!
            </div>
          </div>
          <div className="video-popup-controls">
            <button 
              className="video-popup-kok-button"
              onClick={handleGoToKokProduct}
            >
              콕 상품 보기
            </button>
            <button 
              className="video-popup-close-button"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 비디오 플레이어 */}
        <div className="video-popup-player">
          {(() => {
            // 방송 상태가 'live'이고 유효한 비디오 URL이 있을 때만 영상 표시
            const shouldShowVideo = videoUrl && broadcastStatus?.status === 'live';
            
            // 방송 예정이나 종료 상태일 때 메시지 표시
            const shouldShowStatusMessage = broadcastStatus && 
              (broadcastStatus.status === 'upcoming' || broadcastStatus.status === 'ended');
            
            if (shouldShowVideo) {
              return (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="video-popup-video"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  muted={isMuted}
                  volume={volume}
                />
              );
            } else if (shouldShowStatusMessage) {
              return (
                <div className="video-popup-no-video" style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* 썸네일 이미지 배경 */}
                  {thumbnailUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'brightness(0.3)'
                    }} />
                  )}
                  
                  {/* 방송 상태 메시지 오버레이 */}
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                    color: 'white'
                  }}>
                    <div className="no-video-icon">📺</div>
                    <div className="no-video-text">{broadcastStatus.text}</div>
                    <div className="no-video-subtext">
                      {broadcastStatus.status === 'upcoming' ? '방송 시작을 기다려주세요' : '방송이 종료되었습니다'}
                    </div>
                  </div>
                </div>
              );
            } else if (videoUrl) {
              return (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="video-popup-video"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  muted={isMuted}
                  volume={volume}
                />
              );
            } else {
              return (
                <div className="video-popup-no-video">
                  <div className="no-video-icon">📺</div>
                  <div className="no-video-text">영상을 불러올 수 없습니다</div>
                </div>
              );
            }
          })()}
          
          {/* 비디오 컨트롤 - 라이브 방송일 때만 표시 */}
          {videoUrl && broadcastStatus?.status === 'live' && (
            <div className="video-popup-controls-overlay">
              <div className="video-popup-progress">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="video-popup-progress-bar"
                />
              </div>
              
              <div className="video-popup-controls-bottom">
                <div className="video-popup-controls-left">
                  <button 
                    className="video-popup-play-button"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <div className="video-popup-time">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                <div className="video-popup-controls-right">
                  <div className="video-popup-volume">
                    <button 
                      className="video-popup-mute-button"
                      onClick={toggleMute}
                    >
                      {isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="video-popup-volume-bar"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPopUp;
