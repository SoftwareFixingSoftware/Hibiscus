import React from 'react';
import { useAudio } from '../../context/AudioContext';
import RippleButton from '../common/RippleButton';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaStop, FaSpinner } from 'react-icons/fa';

const MiniPlayer = () => {
  const { player, progress, duration, toggle, stop, seekBy, seek, loading } = useAudio();

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    seek(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!player.src) return null; // don't show if nothing is playing

  return (
    <div className="user-mini-player-overlay">
      <div className="user-mini-player-card">
        <div className="user-mini-art-large">
          <span>EP</span>
        </div>

        <div className="user-mini-info">
          <div className="user-mini-title">{player.title || 'No track'}</div>
          <div className="user-mini-author">{player.author || 'Unknown'}</div>
        </div>

        <div className="user-player-controls">
          <RippleButton
            className="user-ctrl"
            onClick={() => seekBy(-10)}
            aria-label="Rewind 10 seconds"
          >
            <FaStepBackward />
          </RippleButton>

          <RippleButton
            className="user-ctrl user-play"
            onClick={toggle}
            disabled={loading}
            aria-label={player.playing ? 'Pause' : 'Play'}
          >
            {loading ? <FaSpinner className="user-spinner" /> : player.playing ? <FaPause /> : <FaPlay />}
          </RippleButton>

          <RippleButton
            className="user-ctrl"
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds"
          >
            <FaStepForward />
          </RippleButton>

          <RippleButton
            className="user-ctrl user-stop"
            onClick={stop}
            aria-label="Stop"
          >
            <FaStop />
          </RippleButton>
        </div>

        <div className="user-player-progress" onClick={handleSeek}>
          <div className="user-progress-bar">
            <div className="user-progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="user-time-display">
            <span>{formatTime((progress * duration) / 100)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;