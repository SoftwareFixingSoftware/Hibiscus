// src/context/AudioContext.js
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import UserListeningHistoryService from '../services/UserListeningHistoryService';

const AudioContext = createContext(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const currentEpisodeIdRef = useRef(null);
  const completedEpisodesRef = useRef(new Set());
  const listenersRef = useRef({});

  const [player, setPlayer] = useState({
    playing: false,
    src: '',
    episodeId: null,
    title: '',
    author: '',
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false); // ← new loading state

  const normalizeUrl = (url) => {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  };

  const attachAudioListeners = (audio) => {
    if (!audio) return;

    if (listenersRef.current.audio && listenersRef.current.detach) {
      listenersRef.current.detach();
    }

    const updateTime = () => {
      if (audio.duration && !Number.isNaN(audio.currentTime)) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        const episodeId = currentEpisodeIdRef.current;
        if (episodeId && !completedEpisodesRef.current.has(episodeId)) {
          const secs = Math.floor(audio.currentTime || 0);
          try {
            UserListeningHistoryService.queueProgress(episodeId, secs);
          } catch (e) {}
        }
      }
    };

    const setAudioDuration = () => setDuration(audio.duration || 0);

    const onEnded = () => {
      setPlayer(p => ({ ...p, playing: false }));
      const episodeId = currentEpisodeIdRef.current;
      if (episodeId) {
        (async () => {
          try {
            await UserListeningHistoryService.flush();
          } catch (_) {}
          try {
            UserListeningHistoryService.markCompleted(episodeId);
            completedEpisodesRef.current.add(episodeId);
          } catch (e) {}
        })();
      }
    };

    const onPause = () => {
      setPlayer(p => ({ ...p, playing: false }));
      const episodeId = currentEpisodeIdRef.current;
      if (episodeId && audio && !completedEpisodesRef.current.has(episodeId)) {
        const secs = Math.floor(audio.currentTime || 0);
        try {
          UserListeningHistoryService.queueProgress(episodeId, secs);
          UserListeningHistoryService.flush().catch(() => {});
        } catch (e) {}
      }
    };

    const onPlay = () => {
      setPlayer(p => ({ ...p, playing: true }));
      setLoading(false); // audio started playing, loading done
    };

    const onCanPlay = () => {
      setLoading(false); // audio buffered enough to start
    };

    const onError = () => {
      setLoading(false);
      console.error('Audio error');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    listenersRef.current = {
      audio,
      detach: () => {
        try {
          audio.removeEventListener('timeupdate', updateTime);
          audio.removeEventListener('loadedmetadata', setAudioDuration);
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('pause', onPause);
          audio.removeEventListener('play', onPlay);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
        } catch (e) {}
        listenersRef.current = {};
      }
    };
  };

  useEffect(() => {
    return () => {
      if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();
      if (audioRef.current && typeof audioRef.current.pause === 'function') audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(async (src, metadata = {}) => {
    try {
      const normalizedSrc = normalizeUrl(src);
      const existingSrc = audioRef.current && audioRef.current.src ? normalizeUrl(audioRef.current.src) : null;

      // If switching tracks, save progress of old one
      if (audioRef.current && existingSrc && existingSrc !== normalizedSrc) {
        try {
          const oldEpId = currentEpisodeIdRef.current;
          if (oldEpId) {
            const a = audioRef.current;
            const secs = Math.floor(a.currentTime || 0);
            if (!completedEpisodesRef.current.has(oldEpId)) {
              UserListeningHistoryService.queueProgress(oldEpId, secs);
              try {
                await UserListeningHistoryService.flush();
              } catch (_) {}
            }
          }
        } catch (e) {}
        try { audioRef.current.pause(); } catch (_) {}
      }

      // Create new audio or reuse
      if (!audioRef.current || normalizeUrl(audioRef.current.src || '') !== normalizedSrc) {
        if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();
        audioRef.current = new Audio(src);
        attachAudioListeners(audioRef.current);
        setLoading(true); // start loading for new source
      }

      currentEpisodeIdRef.current = metadata?.episodeId ?? null;
      if (currentEpisodeIdRef.current) {
        completedEpisodesRef.current.delete(currentEpisodeIdRef.current);
      }

      // If already playing the same src, just ensure it's playing
      if (existingSrc === normalizedSrc && audioRef.current) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
        }
        // loading already false because it was already loaded
      } else {
        // New source – will trigger canplay/play events to set loading false
        try {
          await audioRef.current.play();
        } catch (err) {
          setLoading(false);
          throw err;
        }
      }

      setPlayer({
        playing: true,
        src: normalizedSrc,
        episodeId: metadata?.episodeId ?? null,
        title: metadata?.title ?? '',
        author: metadata?.author ?? '',
      });
    } catch (err) {
      console.error('Audio play error:', err);
      setLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (_) {}
    }
  }, []);

  const toggle = useCallback(() => {
    if (player.playing) pause();
    else if (audioRef.current) audioRef.current.play().catch(console.error);
  }, [player.playing, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        const epId = currentEpisodeIdRef.current;
        const a = audioRef.current;
        if (epId && a && !completedEpisodesRef.current.has(epId)) {
          const secs = Math.floor(a.currentTime || 0);
          try {
            UserListeningHistoryService.queueProgress(epId, secs);
            UserListeningHistoryService.flush().catch(() => {});
          } catch (_) {}
        }
      } catch (_) {}
      try {
        audioRef.current.pause();
      } catch (_) {}
      if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();
      audioRef.current = null;
    }

    currentEpisodeIdRef.current = null;
    setPlayer({ playing: false, src: '', episodeId: null, title: '', author: '' });
    setProgress(0);
    setDuration(0);
    setLoading(false); // stop loading
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      const epId = currentEpisodeIdRef.current;
      if (epId && completedEpisodesRef.current.has(epId)) {
        completedEpisodesRef.current.delete(epId);
      }
      if (epId) {
        try {
          UserListeningHistoryService.queueProgress(epId, Math.floor(time));
        } catch (_) {}
      }
    }
  }, []);

  const seekBy = useCallback((delta) => {
    if (audioRef.current) {
      audioRef.current.currentTime += delta;
      const epId = currentEpisodeIdRef.current;
      if (epId && completedEpisodesRef.current.has(epId)) {
        completedEpisodesRef.current.delete(epId);
      }
      if (epId) {
        try {
          UserListeningHistoryService.queueProgress(epId, Math.floor(audioRef.current.currentTime || 0));
        } catch (_) {}
      }
    }
  }, []);

  const value = {
    player,
    progress,
    duration,
    loading, // exposed for UI
    play,
    pause,
    toggle,
    stop,
    seek,
    seekBy,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};