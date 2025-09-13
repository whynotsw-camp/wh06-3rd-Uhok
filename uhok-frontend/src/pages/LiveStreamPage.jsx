// /live-stream 경로 페이지 (검색 → API → Player 연결)
// 라이브 스트림 페이지 컴포넌트

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { homeShoppingApi, getHomeshoppingIdFromScheduleData } from "../api/homeShoppingApi";
import LiveStreamPlayer from "../components/player/LiveStreamPlayer";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9001";

export default function LiveStream() {
  const [sp, setSp] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 전달받은 스트림 정보 확인
  const streamInfo = location.state;
  
  const initialUrl = sp.get("homeshopping_url") || streamInfo?.streamUrl || "";
  const [hsUrl, setHsUrl] = useState(initialUrl);
  const [m3u8, setM3u8] = useState(streamInfo?.streamUrl || "");
  
  // streamInfo에서 homeshopping_id 추출
  const homeshoppingId = streamInfo ? getHomeshoppingIdFromScheduleData(streamInfo) : null;
  
  const [meta, setMeta] = useState({ 
    channel: streamInfo?.homeshopping_name || streamInfo?.homeshoppingId || "-", 
    title: streamInfo?.product_name || streamInfo?.productName || "-", 
    source: streamInfo?.streamUrl || "-" 
  });
  const [status, setStatus] = useState(streamInfo?.streamUrl ? "준비됨" : "준비됨");
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const onStatus = useCallback((msg) => setStatus(msg), []);

  const canLoad = useMemo(() => hsUrl.trim().length > 0, [hsUrl]);

  // 현재 시간이 방송 시간 범위 내에 있는지 확인하는 함수
  const checkBroadcastStatus = useCallback((liveDate, startTime, endTime) => {
    if (!liveDate || !startTime || !endTime) {
      return false;
    }
    
    const now = new Date();
    
    // 현재 시간을 한국 시간으로 조정 (UTC+9)
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    // 방송 날짜와 시간을 파싱하여 한국 시간 기준으로 Date 객체 생성
    const [year, month, day] = liveDate.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // 한국 시간 기준으로 방송 시작/종료 시간 생성
    const liveStart = new Date(year, month - 1, day, startHour, startMinute);
    const liveEnd = new Date(year, month - 1, day, endHour, endMinute);
    
    // 현재 날짜가 방송 날짜와 같은지 확인
    const currentDate = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    const broadcastDate = new Date(year, month - 1, day);
    
    // 날짜가 다르면 false 반환
    if (currentDate.getTime() !== broadcastDate.getTime()) {
      return false;
    }
    
    // 현재 시간이 방송 시작 시간과 종료 시간 사이에 있는지 확인 (시작 시간 포함, 종료 시간 제외)
    return koreaTime >= liveStart && koreaTime < liveEnd;
  }, []);

  // homeshopping_id로 라이브 스트림을 조회하는 함수
  const loadStreamByHomeshoppingId = useCallback(async (id) => {
    try {
      const streamResponse = await homeShoppingApi.getLiveStreamUrl(id);
      
      if (!streamResponse?.stream_url) {
        throw new Error("응답에 m3u8 주소가 없습니다.");
      }
      
      // 방송 정보 설정
      if (streamResponse.live_date && streamResponse.live_start_time && streamResponse.live_end_time) {
        const broadcastData = {
          live_date: streamResponse.live_date,
          live_start_time: streamResponse.live_start_time,
          live_end_time: streamResponse.live_end_time
        };
        setBroadcastInfo(broadcastData);
        
        // 현재 시간이 방송 시간 범위 내에 있는지 확인
        const isCurrentlyLive = checkBroadcastStatus(
          broadcastData.live_date,
          broadcastData.live_start_time,
          broadcastData.live_end_time
        );
        setIsLive(isCurrentlyLive);
        
        if (!isCurrentlyLive) {
          setStatus("현재 방송 시간이 아닙니다.");
        }
      }
      
      setMeta({ 
        channel: streamResponse.channel || streamInfo?.homeshopping_name || "-", 
        title: streamResponse.title || streamInfo?.product_name || "-", 
        source: streamResponse.source || `homeshopping_id: ${id}` 
      });
      setM3u8(streamResponse.stream_url);
      
      if (isLive) {
        setStatus("준비됨");
      }
      
    } catch (e) {
      setStatus(`homeshopping_id 조회 실패: ${e.message}`);
    }
  }, [streamInfo, checkBroadcastStatus, isLive]);

  const load = useCallback(async () => {
    if (!canLoad) {
      setStatus("홈쇼핑 URL을 입력하세요.");
      return;
    }
    try {
      // API 명세서에 맞게 homeshopping_id 또는 src 파라미터로 호출
      let streamResponse;
      if (hsUrl.trim().startsWith('http')) {
        // URL이 직접 입력된 경우 src 파라미터로 사용
        streamResponse = await homeShoppingApi.getLiveStreamUrl(null, hsUrl.trim());
      } else {
        // 숫자인 경우 homeshopping_id로 사용
        const inputHomeshoppingId = parseInt(hsUrl.trim());
        if (isNaN(inputHomeshoppingId)) {
          throw new Error("유효한 homeshopping_id 또는 URL을 입력하세요.");
        }
        streamResponse = await homeShoppingApi.getLiveStreamUrl(inputHomeshoppingId);
      }
      
      if (!streamResponse?.stream_url) throw new Error("응답에 m3u8 주소가 없습니다.");
      
      // 방송 정보 설정
      if (streamResponse.live_date && streamResponse.live_start_time && streamResponse.live_end_time) {
        const broadcastData = {
          live_date: streamResponse.live_date,
          live_start_time: streamResponse.live_start_time,
          live_end_time: streamResponse.live_end_time
        };
        setBroadcastInfo(broadcastData);
        
        // 현재 시간이 방송 시간 범위 내에 있는지 확인
        const isCurrentlyLive = checkBroadcastStatus(
          broadcastData.live_date,
          broadcastData.live_start_time,
          broadcastData.live_end_time
        );
        setIsLive(isCurrentlyLive);
        
        if (!isCurrentlyLive) {
          setStatus("현재 방송 시간이 아닙니다.");
        }
      }
      
      setMeta({ 
        channel: streamResponse.channel || "-", 
        title: streamResponse.title || "-", 
        source: streamResponse.source || hsUrl.trim() 
      });
      setM3u8(streamResponse.stream_url);
      
      if (isLive) {
        setStatus("준비됨");
      }
      
      // URL 동기화
      const next = new URL(window.location.href);
      next.searchParams.set("homeshopping_url", hsUrl.trim());
      window.history.replaceState({}, "", next);
    } catch (e) {
      setStatus(`실패: ${e.message}`);
    }
  }, [canLoad, hsUrl, checkBroadcastStatus, isLive]);

  // 처음 들어올 때 전달받은 스트림 정보나 쿼리스트링이 있으면 자동 로드
  useEffect(() => {
    if (streamInfo?.streamUrl) {
      // 전달받은 스트림 URL이 있으면 바로 재생
      setM3u8(streamInfo.streamUrl);
      
      // 전달받은 방송 정보가 있으면 라이브 상태 확인
      if (streamInfo.live_date && streamInfo.live_start_time && streamInfo.live_end_time) {
        const broadcastData = {
          live_date: streamInfo.live_date,
          live_start_time: streamInfo.live_start_time,
          live_end_time: streamInfo.live_end_time
        };
        setBroadcastInfo(broadcastData);
        
        const isCurrentlyLive = checkBroadcastStatus(
          broadcastData.live_date,
          broadcastData.live_start_time,
          broadcastData.live_end_time
        );
        setIsLive(isCurrentlyLive);
        
        if (isCurrentlyLive) {
          setStatus("준비됨");
        } else {
          setStatus("현재 방송 시간이 아닙니다.");
        }
      } else {
        setStatus("준비됨");
      }
    } else if (homeshoppingId && !streamInfo?.streamUrl) {
      // homeshopping_id가 있지만 streamUrl이 없는 경우, API로 조회
      loadStreamByHomeshoppingId(homeshoppingId);
    } else if (initialUrl) {
      // 쿼리스트링에 URL이 있으면 로드
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeshoppingId, loadStreamByHomeshoppingId]);

  // 방송 상태에 따른 메시지 반환
  const getBroadcastStatusMessage = () => {
    if (!broadcastInfo) return "";
    
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const [year, month, day] = broadcastInfo.live_date.split('-').map(Number);
    const [startHour, startMinute] = broadcastInfo.live_start_time.split(':').map(Number);
    const [endHour, endMinute] = broadcastInfo.live_end_time.split(':').map(Number);
    
    const liveStart = new Date(year, month - 1, day, startHour, startMinute);
    const liveEnd = new Date(year, month - 1, day, endHour, endMinute);
    
    if (koreaTime < liveStart) {
      const timeDiff = liveStart - koreaTime;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `방송 예정: ${hours}시간 ${minutes}분 후`;
    } else if (koreaTime >= liveStart && koreaTime < liveEnd) {
      return "방송 중";
    } else {
      return "방송 종료";
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backButton}
        >
          ← 뒤로가기
        </button>
        <h1 style={styles.h1}>홈쇼핑 라이브 재생</h1>
      </div>

      <div style={styles.panel}>
        <div style={styles.controls}>
          <input
            value={hsUrl}
            onChange={(e) => setHsUrl(e.target.value)}
            placeholder="홈쇼핑 상품/방송 URL 입력"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <button onClick={load} style={styles.btnPrimary}>불러오기</button>
          <button
            onClick={() => {
              const v = sp.get("homeshopping_url") || hsUrl;
              setHsUrl(v || "");
              load();
            }}
            style={styles.btn}
          >
            다시 시도
          </button>
          <button
            onClick={() => {
              setStatus("음소거 토글 기능은 비디오 플레이어에서 직접 조작하세요");
            }}
            style={styles.btn}
          >
            음소거 토글
          </button>
        </div>
        <div style={styles.status}>{status}</div>
        
        {/* 방송 정보 표시 */}
        {broadcastInfo && (
          <div style={styles.broadcastInfo}>
            <div><strong>방송 날짜:</strong> {broadcastInfo.live_date}</div>
            <div><strong>방송 시간:</strong> {broadcastInfo.live_start_time} ~ {broadcastInfo.live_end_time}</div>
            <div><strong>방송 상태:</strong> {getBroadcastStatusMessage()}</div>
          </div>
        )}
      </div>

      {/* 라이브 상태일 때만 비디오 플레이어 표시 */}
      {isLive ? (
        <LiveStreamPlayer
          src={m3u8}
          autoPlay={false}
          muted={true}
          controls={true}
          width="100%"
          height="400px"
          onError={(error) => {
            setStatus(`스트림 오류: ${error.message || '알 수 없는 오류'}`);
          }}
          key={m3u8} // URL이 변경될 때마다 컴포넌트 재생성
        />
      ) : (
        <div style={styles.noLiveMessage}>
          <div style={styles.noLiveIcon}>📺</div>
          <div style={styles.noLiveText}>
            {broadcastInfo ? "현재 방송 시간이 아닙니다." : "방송 정보를 불러와주세요."}
          </div>
          {broadcastInfo && (
            <div style={styles.broadcastTimeInfo}>
              {getBroadcastStatusMessage()}
            </div>
          )}
        </div>
      )}

      {/* 스트림 오류 시 재시도 버튼 (라이브 상태일 때만) */}
      {isLive && status.includes('오류') && m3u8 && (
        <div style={styles.panel}>
          <div style={styles.status}>
            <strong>스트림 오류가 발생했습니다</strong>
            <br />
            <small>아래 버튼을 클릭하여 재시도하거나, 다른 스트림을 시도해보세요.</small>
          </div>
          <div style={styles.controls}>
            <button 
              onClick={() => {
                // URL을 강제로 변경하여 컴포넌트 재생성
                const currentUrl = m3u8;
                setM3u8('');
                setTimeout(() => setM3u8(currentUrl), 100);
              }} 
              style={styles.btnPrimary}
            >
              🔄 스트림 재시도
            </button>
            <button 
              onClick={() => {
                setM3u8('');
                setStatus('스트림이 중지되었습니다');
              }} 
              style={styles.btn}
            >
              ⏹️ 스트림 중지
            </button>
          </div>
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.meta}>
          <div><b>채널</b> {meta.channel}</div>
          <div><b>제목</b> {meta.title}</div>
          <div><b>원본</b> {meta.source}</div>
          <div><b>M3U8</b> {m3u8 || "-"}</div>
          <div><b>라이브 상태</b> {isLive ? "방송 중" : "방송 시간 아님"}</div>
        </div>
      </div>

      <p style={styles.footnote}>
        플레이 정보는 <code>{API_BASE}/api/homeshopping/schedule/live-stream</code> 에서 가져옵니다.
        <br />
        <small>homeshopping_id 또는 src 파라미터를 사용하여 스트림 정보를 조회합니다.</small>
      </p>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 960, margin: "0 auto", padding: 16, color: "#e7e7ea", background: "#0b0b0c", minHeight: "100vh", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  backButton: { padding: "8px 16px", borderRadius: 8, background: "#2b2b30", color: "white", border: "none", cursor: "pointer", fontSize: 14 },
  h1: { fontSize: 18, margin: 0, opacity: 0.9 },
  panel: { background: "#111114", border: "1px solid #23232a", borderRadius: 14, padding: 12, marginBottom: 12 },
  controls: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: { flex: "1 1 420px", padding: "10px 12px", borderRadius: 10, border: "1px solid #2b2b30", background: "#151518", color: "#f2f2f4" },
  btn: { padding: "10px 14px", borderRadius: 10, background: "#2b2b30", color: "white", border: "none", cursor: "pointer" },
  btnPrimary: { padding: "10px 14px", borderRadius: 10, background: "#3a5cff", color: "white", border: "none", cursor: "pointer" },
  status: { fontSize: 13, opacity: 0.85 },
  video: { width: "100%", maxHeight: "70vh", background: "black", borderRadius: 14, marginTop: 8 },
  meta: { fontSize: 14, opacity: 0.95, display: "flex", gap: 10, flexWrap: "wrap" },
  footnote: { fontSize: 13, opacity: 0.8 },
  broadcastInfo: { marginTop: 12, padding: "12px", background: "#1a1a1e", borderRadius: 8, fontSize: 13 },
  noLiveMessage: { 
    backgroundColor: "#1a1a1e", 
    border: "2px dashed #2b2b30",
    borderRadius: 14, 
    padding: 40, 
    textAlign: "center", 
    color: "#6c757d",
    marginBottom: 12
  },
  noLiveIcon: { fontSize: "48px", marginBottom: "16px" },
  noLiveText: { fontSize: "18px", marginBottom: "8px" },
  broadcastTimeInfo: { fontSize: "14px", opacity: 0.8 }
};
