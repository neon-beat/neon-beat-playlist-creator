import { useEffect, useRef, useState } from 'react';
import { Button, Card, Flex, InputNumber, Slider, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CheckOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface VideoPreviewProps {
  videoId: string;
  onTimeRangeSelect?: (startMs: number, endMs: number) => void;
  initialStartMs?: number;
  initialEndMs?: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoId,
  onTimeRangeSelect,
  initialStartMs = 0,
  initialEndMs = 30000
}) => {
  const playerRef = useRef<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(initialStartMs);
  const [endTime, setEndTime] = useState(initialEndMs);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (!isAPIReady || !videoId) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        controls: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (event: any) => {
          setPlayer(event.target);
          setDuration(event.target.getDuration() * 1000);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
          }
        }
      }
    });

    return () => {
      if (newPlayer && typeof newPlayer.destroy === 'function') {
        newPlayer.destroy();
      }
    };
  }, [isAPIReady, videoId]);

  // Update current time
  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime() * 1000;
        setCurrentTime(time);

        // Auto-pause when reaching end time
        if (time >= endTime) {
          player.pauseVideo();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlaying, endTime]);

  const handlePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handlePlayRange = () => {
    if (!player) return;

    player.seekTo(startTime / 1000, true);
    player.playVideo();
  };

  const handleSetStartTime = () => {
    if (!player) return;
    const time = player.getCurrentTime() * 1000;
    setStartTime(Math.floor(time));
  };

  const handleSetEndTime = () => {
    if (!player) return;
    const time = player.getCurrentTime() * 1000;
    setEndTime(Math.floor(time));
  };

  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setStartTime(value[0]);
      setEndTime(value[1]);
    }
  };

  const handleConfirm = () => {
    if (onTimeRangeSelect) {
      onTimeRangeSelect(startTime, endTime);
    }

    // Reset states
    if (player) {
      player.pauseVideo();
      player.seekTo(0, true);
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setStartTime(initialStartMs);
    setEndTime(initialEndMs);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card style={{ width: '100%' }}>
      <Flex vertical gap="large">
        <Title level={4}>Video Preview & Time Range Selection</Title>

        {/* YouTube Player */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <div
            ref={playerRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>

        {/* Current Time Display */}
        <Flex justify="space-between" align="center">
          <Text>
            Current Time: <strong>{formatTime(currentTime)}</strong>
          </Text>
          <Text>
            Duration: <strong>{formatTime(duration)}</strong>
          </Text>
        </Flex>

        {/* Playback Controls */}
        <Flex gap="small" wrap="wrap">
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button onClick={handlePlayRange}>
            Play Selected Range
          </Button>
        </Flex>

        {/* Time Range Slider */}
        <div>
          <Text strong>Select Time Range (ms):</Text>
          <Slider
            range
            min={0}
            max={duration || 300000}
            value={[startTime, endTime]}
            onChange={handleSliderChange}
            tooltip={{ formatter: (value) => formatTime(value || 0) }}
            style={{ marginTop: '16px' }}
          />
        </div>

        {/* Start Time Controls */}
        <Flex gap="middle" align="center" wrap="wrap">
          <Text strong>Start Time (ms):</Text>
          <InputNumber
            min={0}
            max={endTime - 1000}
            value={startTime}
            onChange={(value) => setStartTime(value || 0)}
            style={{ width: '150px' }}
          />
          <Text type="secondary">{formatTime(startTime)}</Text>
          <Button size="small" onClick={handleSetStartTime}>
            Set to Current Time
          </Button>
        </Flex>

        {/* End Time Controls */}
        <Flex gap="middle" align="center" wrap="wrap">
          <Text strong>End Time (ms):</Text>
          <InputNumber
            min={startTime + 1000}
            max={duration}
            value={endTime}
            onChange={(value) => setEndTime(value || 30000)}
            style={{ width: '150px' }}
          />
          <Text type="secondary">{formatTime(endTime)}</Text>
          <Button size="small" onClick={handleSetEndTime}>
            Set to Current Time
          </Button>
        </Flex>

        {/* Range Info */}
        <Card size="small" style={{ backgroundColor: '#f0f0f0' }}>
          <Flex vertical gap="small">
            <Text className="text-black">
              <strong>Selected Range:</strong> {formatTime(startTime)} → {formatTime(endTime)}
            </Text>
            <Text className="text-black">
              <strong>Duration:</strong> {formatTime(endTime - startTime)}
            </Text>
          </Flex>
        </Card>

        {/* Confirm Button */}
        {onTimeRangeSelect && (
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            onClick={handleConfirm}
            block
          >
            Confirm Time Range
          </Button>
        )}
      </Flex>
    </Card>
  );
};

export default VideoPreview;
