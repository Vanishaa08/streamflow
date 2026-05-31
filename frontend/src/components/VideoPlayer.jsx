import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ streamKey, isLive }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // HLS stream URL from our Nginx RTMP server
  const hlsUrl =  `/hls/${streamKey}.m3u8`;

  useEffect(() => {
    if (!streamKey || !isLive) {
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      // hls.js supported (Chrome, Firefox, Edge)
      const hls = new Hls({
        // Start from live edge — don't buffer from beginning
        liveSyncDurationCount: 3,
        // How often to poll the manifest for new segments (ms)
        manifestLoadingTimeOut: 10000,
      });

      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed, starting playback');
        setLoading(false);
        video.play().catch(err => {
          // Autoplay blocked by browser — user must click play
          console.log('[HLS] Autoplay blocked:', err.message);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('[HLS] Fatal error:', data.type, data.details);
          setError('Stream error — retrying...');
          // Try to recover
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play();
      });
    } else {
      setError('Your browser does not support HLS playback');
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamKey, isLive, hlsUrl]);

  if (!isLive) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📡</div>
          <p className="text-gray-400">Stream is offline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="text-purple-400 text-sm animate-pulse">
              Loading stream...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        muted
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;