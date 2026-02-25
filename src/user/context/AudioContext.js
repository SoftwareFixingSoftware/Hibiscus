import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [player, setPlayer] = useState({
    playing: false,
    src: '',
    episodeId: null,
    title: '',
    author: '',
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update progress
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const updateTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const setAudioDuration = () => setDuration(audio.duration || 0);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
    };
  }, [player.src]);

  const play = useCallback(async (src, metadata) => {
    try {
      if (!audioRef.current || audioRef.current.src !== src) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(src);
      }
      await audioRef.current.play();
      setPlayer({
        playing: true,
        src,
        episodeId: metadata.episodeId,
        title: metadata.title,
        author: metadata.author,
      });
      audioRef.current.onended = () => setPlayer(p => ({ ...p, playing: false }));
      audioRef.current.onpause = () => setPlayer(p => ({ ...p, playing: false }));
      audioRef.current.onplay = () => setPlayer(p => ({ ...p, playing: true }));
    } catch (err) {
      console.error('Audio play error:', err);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayer(p => ({ ...p, playing: false }));
    }
  }, []);

  const toggle = useCallback(() => {
    if (player.playing) pause();
    else if (audioRef.current) audioRef.current.play().catch(console.error);
  }, [player.playing, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayer({ playing: false, src: '', episodeId: null, title: '', author: '' });
    setProgress(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const seekBy = useCallback((delta) => {
    if (audioRef.current) audioRef.current.currentTime += delta;
  }, []);

  const value = {
    player,
    progress,
    duration,
    play,
    pause,
    toggle,
    stop,
    seek,
    seekBy,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};