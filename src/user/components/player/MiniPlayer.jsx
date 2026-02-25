import React from 'react';
import { useAudio } from '../../context/AudioContext';
import RippleButton from '../common/RippleButton';

const MiniPlayer = () => {
  const { player, progress, duration, toggle, stop, seekBy, seek } = useAudio();

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    seek(newTime);
  };

  return (
    <div className="dash-player">
      <div className="player-left">
        <div className="mini-art">EP</div>
        <div className="mini-info">
          <div className="mini-title">{player.title}</div>
          <div className="mini-author muted">{player.author}</div>
        </div>
      </div>
      <div className="player-controls">
        <RippleButton className="ctrl" onClick={() => seekBy(-10)}>
          ◐
        </RippleButton>
        <RippleButton className="ctrl play" onClick={toggle}>
          {player.playing ? '▮▮' : '►'}
        </RippleButton>
        <RippleButton className="ctrl" onClick={() => seekBy(10)}>
          10s
        </RippleButton>
        <RippleButton className="ctrl cancel" onClick={stop} title="Stop / Cancel">
          ✕
        </RippleButton>
      </div>
      <div className="player-progress" onClick={handleSeek}>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;