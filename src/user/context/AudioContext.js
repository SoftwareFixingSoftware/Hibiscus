// src/context/AudioContext.js
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import UserListeningHistoryService from '../services/UserListeningHistoryService';  

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const currentEpisodeIdRef = useRef(null); // track current episodeId for event handlers
  const [player, setPlayer] = useState({
    playing: false,
    src: '',
    episodeId: null,
    title: '',
    author: '',
  });
  const [progress, setProgress] = useState(0); // percent (0-100)
  const [duration, setDuration] = useState(0); // seconds

  // Update progress & queue backend save on timeupdate
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const updateTime = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        // send buffered progress (fire-and-forget)
        const episodeId = currentEpisodeIdRef.current;
        if (episodeId) {
          const currentSeconds = Math.floor(audio.currentTime);
          try {
            UserListeningHistoryService.queueProgress(episodeId, currentSeconds, false);
          } catch (e) {
            // swallow: service already logs failures
            // console.warn('queueProgress error', e);
          }
        }
      }
    };

    const setAudioDuration = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setPlayer(p => ({ ...p, playing: false }));
      const episodeId = currentEpisodeIdRef.current;
      if (episodeId) {
        // mark completed (fire-and-forget)
        try {
          UserListeningHistoryService.markCompleted(episodeId);
        } catch (e) {}
      }
    };

    const onPause = () => {
      setPlayer(p => ({ ...p, playing: false }));
      // best-effort immediate save on pause
      const episodeId = currentEpisodeIdRef.current;
      if (episodeId) {
        const secs = Math.floor(audio.currentTime || 0);
        try {
          UserListeningHistoryService.updateProgressImmediate({ episodeId, progressSeconds: secs })
            .catch(() => {});
        } catch (e) {}
      }
    };

    const onPlay = () => {
      setPlayer(p => ({ ...p, playing: true }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [player.src]); // rebind listeners when source changes

  const play = useCallback(async (src, metadata) => {
    try {
      // create or reuse audio element
      if (!audioRef.current || audioRef.current.src !== src) {
        if (audioRef.current) {
          // try to persist last position before replacing audio
          try {
            const a = audioRef.current;
            const epId = currentEpisodeIdRef.current;
            if (epId) {
              UserListeningHistoryService.updateProgressImmediate({
                episodeId: epId,
                progressSeconds: Math.floor(a.currentTime || 0),
              }).catch(() => {});
            }
          } catch (_) {}
          audioRef.current.pause();
        }
        audioRef.current = new Audio(src);
      }

      // set currentEpisodeIdRef so handlers know which episode to record
      currentEpisodeIdRef.current = metadata?.episodeId ?? null;

      await audioRef.current.play();

      setPlayer({
        playing: true,
        src,
        episodeId: metadata?.episodeId ?? null,
        title: metadata?.title ?? '',
        author: metadata?.author ?? '',
      });

      // attach ended/pause/play/onended are handled in the effect above
    } catch (err) {
      console.error('Audio play error:', err);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayer(p => ({ ...p, playing: false }));
      // updateProgressImmediate happens in pause event handler
    }
  }, []);

  const toggle = useCallback(() => {
    if (player.playing) pause();
    else if (audioRef.current) audioRef.current.play().catch(console.error);
  }, [player.playing, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        // best-effort immediate save before destroying audio
        const a = audioRef.current;
        const epId = currentEpisodeIdRef.current;
        if (epId) {
          try {
            UserListeningHistoryService.updateProgressImmediate({
              episodeId: epId,
              progressSeconds: Math.floor(a.currentTime || 0),
            }).catch(() => {});
          } catch (_) {}
        }
      } catch (_) {}
      audioRef.current.pause();
      audioRef.current = null;
    }
    // clear local state
    currentEpisodeIdRef.current = null;
    setPlayer({ playing: false, src: '', episodeId: null, title: '', author: '' });
    setProgress(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      // immediately queue progress for new position (no UI notice)
      const epId = currentEpisodeIdRef.current;
      if (epId) {
        try {
          UserListeningHistoryService.queueProgress(epId, Math.floor(time), false);
        } catch (_) {}
      }
    }
  }, []);

  const seekBy = useCallback((delta) => {
    if (audioRef.current) {
      audioRef.current.currentTime += delta;
      const epId = currentEpisodeIdRef.current;
      if (epId) {
        try {
          UserListeningHistoryService.queueProgress(epId, Math.floor(audioRef.current.currentTime || 0), false);
        } catch (_) {}
      }
    }
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