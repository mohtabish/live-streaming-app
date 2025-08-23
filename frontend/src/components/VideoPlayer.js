import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

const VideoPlayer = ({ streamUrl, overlays, onOverlayUpdate, isLoading }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Drag state
  const [draggedOverlay, setDraggedOverlay] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [streamUrl]);

  // Set video source when streamUrl changes
  useEffect(() => {
    if (videoRef.current && streamUrl) {
      videoRef.current.src = streamUrl;
      videoRef.current.load();
    }
  }, [streamUrl]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  };

  // Overlay drag handlers
  const handleOverlayMouseDown = (e, overlay) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const videoRect = containerRef.current?.getBoundingClientRect();
    
    if (!videoRect) return;

    setDraggedOverlay(overlay._id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedOverlay || !isDragging) return;
    
    const videoRect = containerRef.current?.getBoundingClientRect();
    if (!videoRect) return;

    const overlay = overlays.find(o => o._id === draggedOverlay);
    if (!overlay) return;

    // Calculate new position relative to video container
    const newX = e.clientX - videoRect.left - dragOffset.x;
    const newY = e.clientY - videoRect.top - dragOffset.y;

    // Constrain to video bounds
    const maxX = videoRect.width - overlay.size.width;
    const maxY = videoRect.height - overlay.size.height;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    // Update overlay position
    if (onOverlayUpdate) {
      onOverlayUpdate(draggedOverlay, {
        position: { x: Math.round(constrainedX), y: Math.round(constrainedY) }
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedOverlay(null);
    setIsDragging(false);
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const visibleOverlays = overlays.filter(overlay => overlay.visible !== false);

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden shadow-2xl group"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Video Element */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          crossOrigin="anonymous"
          playsInline
        >
          Your browser does not support video playback.
        </video>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading stream...</p>
            </div>
          </div>
        )}

        {/* Play button overlay (when paused) */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black bg-opacity-75 hover:bg-opacity-90 text-white rounded-full p-6 transition-all duration-200 hover:scale-110"
            >
              <Play size={40} />
            </button>
          </div>
        )}

        {/* Overlays */}
        {visibleOverlays.map((overlay) => (
          <div
            key={overlay._id}
            className={`overlay-container absolute cursor-move select-none transition-all duration-150 ${
              draggedOverlay === overlay._id ? 'dragging z-50 shadow-2xl' : 'z-10'
            }`}
            style={{
              left: `${overlay.position.x}px`,
              top: `${overlay.position.y}px`,
              width: `${overlay.size.width}px`,
              height: `${overlay.size.height}px`,
            }}
            onMouseDown={(e) => handleOverlayMouseDown(e, overlay)}
          >
            {overlay.type === 'text' ? (
              <div 
                className="overlay-text w-full h-full flex items-center justify-center text-center"
                style={{ 
                  fontSize: overlay.style?.fontSize || '16px',
                  color: overlay.style?.color || '#ffffff',
                  fontWeight: overlay.style?.fontWeight || '600',
                  backgroundColor: overlay.style?.backgroundColor || 'rgba(0,0,0,0.7)',
                  borderRadius: overlay.style?.borderRadius || '6px',
                  ...overlay.style
                }}
              >
                {overlay.content}
              </div>
            ) : (
              <img 
                src={overlay.content} 
                alt="Logo overlay" 
                className="overlay-logo w-full h-full"
                draggable={false}
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load overlay image:', overlay.content);
                }}
              />
            )}
          </div>
        ))}

        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="bg-white bg-opacity-30 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            {/* Left controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} />
                )}
              </button>

              <button
                onClick={restartVideo}
                className="hover:text-blue-400 transition-colors"
                title="Restart"
              >
                <RotateCcw size={18} />
              </button>
              
              {/* Volume controls */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleMute} 
                  className="hover:text-blue-400 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-blue-500 opacity-75 hover:opacity-100 transition-opacity"
                />
                <span className="text-sm text-gray-300 min-w-[2rem]">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Center - Time display */}
            <div className="flex items-center space-x-2 text-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-400">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-3">
              {/* Overlay count */}
              {visibleOverlays.length > 0 && (
                <div className="bg-white/20 px-2 py-1 rounded text-xs">
                  {visibleOverlays.length} overlay{visibleOverlays.length !== 1 ? 's' : ''}
                </div>
              )}

              <button
                onClick={toggleFullscreen}
                className="hover:text-blue-400 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stream info overlay (top) */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      </div>

      {/* Drag helper text */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
          Drag to reposition overlay
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;