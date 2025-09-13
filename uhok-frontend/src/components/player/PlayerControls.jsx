import React from 'react';

const PlayerControls = ({ 
  isPlaying, 
  onPlay, 
  onPause, 
  onFullscreen,
  onMute,
  isMuted,
  style = {}
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      ...style
    }}>
      <button
        onClick={isPlaying ? onPause : onPlay}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <button
        onClick={onMute}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      <button
        onClick={onFullscreen}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        ⛶
      </button>
    </div>
  );
};

export default PlayerControls;
