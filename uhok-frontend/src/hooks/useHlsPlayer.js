// video ref + Hls.js attach 훅
// HLS 플레이어 관련 커스텀 훅

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function useHlsPlayer(m3u8Url, { onStatus } = {}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !m3u8Url) return;

    // 이전 인스턴스 정리
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    try {
      video.pause();
    } catch {}
    video.removeAttribute("src");
    video.load();

    const report = (msg) => onStatus && onStatus(msg);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_, data) => {
        report(`HLS 오류: ${data?.details || data?.type || "알 수 없음"}`);
        // 재시도 로직을 붙이고 싶으면 여기서 처리
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => report("미디어 연결됨"));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        report("재생 시작");
        video.muted = true; // 자동재생 허용을 위해 기본 음소거
        video.play().catch(() => report("자동재생 차단됨. ▶ 버튼을 눌러주세요"));
      });

      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 등 네이티브 HLS
      report("네이티브 HLS 재생");
      video.src = m3u8Url;
      video.muted = true;
      video.play().catch(() => report("자동재생 차단됨. ▶ 버튼을 눌러주세요"));
    } else {
      report("이 브라우저는 HLS를 지원하지 않습니다.");
    }

    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [m3u8Url, onStatus]);

  return { videoRef };
}
