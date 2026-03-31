import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const VideoPlayer = forwardRef(({ videoUrl, videoType, onTimeUpdate, markers = [] }, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoType === 'youtube' && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(time, true);
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    getCurrentTime: () => currentTime,
    pause: () => {
      if (videoType === 'youtube' && youtubePlayerRef.current) {
        youtubePlayerRef.current.pauseVideo();
      } else if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    captureFrame: () => {
      if (videoType === 'youtube') {
        const iframe = document.getElementById('youtube-player');
        if (iframe) {
          return new Promise((resolve) => {
            import('html2canvas').then(({ default: html2canvas }) => {
              html2canvas(iframe).then(canvas => {
                resolve(canvas.toDataURL('image/png'));
              });
            });
          });
        }
      } else if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return Promise.resolve(canvas.toDataURL('image/png'));
      }
      return Promise.resolve(null);
    }
  }));

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    if (videoType === 'youtube') {
      const videoId = getYouTubeId(videoUrl);

      const createPlayer = () => {
        // 이전 플레이어가 있으면 제거
        if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }

        const playerEl = document.getElementById('youtube-player');
        if (!playerEl) return;

        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          events: {
            onReady: (event) => {
              setDuration(event.target.getDuration());
            }
          }
        });
      };

      // YouTube IFrame API가 이미 로드된 경우 (SPA 내비게이션)
      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        // API가 아직 로드되지 않은 경우 스크립트 추가
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
          createPlayer();
        };
      }

      // 시간 업데이트 인터벌
      const interval = setInterval(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
          const time = youtubePlayerRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time);
        }
      }, 100);

      return () => {
        clearInterval(interval);
        if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }
      };
    }
  }, [videoType, videoUrl]);

  if (videoType === 'youtube') {
    return (
      <div ref={containerRef} className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl">
        <div className="aspect-video">
          <div id="youtube-player" className="w-full h-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handlePlayPause}
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar with Markers */}
        <div className="relative mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          {/* Feedback Markers */}
          {markers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{ left: `${(marker.timestamp / duration) * 100}%` }}
              title={`${formatTime(marker.timestamp)}: ${marker.content?.slice(0, 30)}...`}
            />
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={skipBackward}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={skipForward}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
            
            <span className="text-white text-sm ml-4 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 font-medium"
              onClick={cyclePlaybackRate}
            >
              {playbackRate}x
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;