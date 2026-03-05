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
  const completedEpisodesRef = useRef(new Set()); // tracks episodes that have ended in this session
  const listenersRef = useRef({}); // keep references to listeners so we can remove them

  const [player, setPlayer] = useState({
    playing: false,
    src: '',
    episodeId: null,
    title: '',
    author: '',
  });
  const [progress, setProgress] = useState(0); // percent
  const [duration, setDuration] = useState(0); // seconds

  // Helper: normalize urls so comparisons are robust (handles relative vs absolute)
  const normalizeUrl = (url) => {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  };

  // Attach listeners to a given audio element (call immediately after creating new Audio())
  const attachAudioListeners = (audio) => {
    if (!audio) return;

    // Remove any previous listeners on the old audio (safety)
    if (listenersRef.current.audio && listenersRef.current.detach) {
      listenersRef.current.detach();
    }

    const updateTime = () => {
      if (audio.duration && !Number.isNaN(audio.currentTime)) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        const episodeId = currentEpisodeIdRef.current;
        // Only queue progress if the episode is NOT marked as completed in this session
        if (episodeId && !completedEpisodesRef.current.has(episodeId)) {
          const secs = Math.floor(audio.currentTime || 0);
          try {
            UserListeningHistoryService.queueProgress(episodeId, secs);
          } catch (e) {
            // swallow; service logs
          }
        }
      }
    };

    const setAudioDuration = () => setDuration(audio.duration || 0);

    const onEnded = () => {
      setPlayer(p => ({ ...p, playing: false }));
      const episodeId = currentEpisodeIdRef.current;
      if (episodeId) {
        // best-effort: flush pending progress for this episode then mark completed
        (async () => {
          try {
            await UserListeningHistoryService.flush();
          } catch (_) {}
          try {
            UserListeningHistoryService.markCompleted(episodeId);
            completedEpisodesRef.current.add(episodeId); // remember it's completed
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
          // Best-effort immediate flush so the pause position is sent quickly
          UserListeningHistoryService.flush().catch(() => {});
        } catch (e) {}
      }
    };

    const onPlay = () => setPlayer(p => ({ ...p, playing: true }));

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    // store a detach helper so we can remove listeners later
    listenersRef.current = {
      audio,
      detach: () => {
        try {
          audio.removeEventListener('timeupdate', updateTime);
          audio.removeEventListener('loadedmetadata', setAudioDuration);
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('pause', onPause);
          audio.removeEventListener('play', onPlay);
        } catch (e) {}
        listenersRef.current = {};
      }
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();
      if (audioRef.current && typeof audioRef.current.pause === 'function') audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(async (src, metadata = {}) => {
    try {
      // Normalize urls for comparison
      const normalizedSrc = normalizeUrl(src);
      const existingSrc = audioRef.current && audioRef.current.src ? normalizeUrl(audioRef.current.src) : null;

      // If switching from another track, save the old episode's position (unless it's completed)
      if (audioRef.current && existingSrc && existingSrc !== normalizedSrc) {
        try {
          const oldEpId = currentEpisodeIdRef.current;
          if (oldEpId) {
            const a = audioRef.current;
            const secs = Math.floor(a.currentTime || 0);
            // Only save progress if the old episode is not completed
            if (!completedEpisodesRef.current.has(oldEpId)) {
              UserListeningHistoryService.queueProgress(oldEpId, secs);
              // Wait a short period to try to flush before switching (reduce race)
              try {
                await UserListeningHistoryService.flush();
              } catch (_) {}
            }
          }
        } catch (e) {}
        try { audioRef.current.pause(); } catch (_) {}
      }

      // Create or reuse audio element
      if (!audioRef.current || normalizeUrl(audioRef.current.src || '') !== normalizedSrc) {
        // If there's an old audio instance, detach its listeners first
        if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();

        audioRef.current = new Audio(src);
        // attach listeners immediately so we don't miss events between creation and setPlayer
        attachAudioListeners(audioRef.current);
      }

      // Set current episode id and remove it from completed set (if present) because we're playing it again
      currentEpisodeIdRef.current = metadata?.episodeId ?? null;
      if (currentEpisodeIdRef.current) {
        completedEpisodesRef.current.delete(currentEpisodeIdRef.current);
      }

      // Play
      await audioRef.current.play();

      setPlayer({
        playing: true,
        src: normalizedSrc,
        episodeId: metadata?.episodeId ?? null,
        title: metadata?.title ?? '',
        author: metadata?.author ?? '',
      });
    } catch (err) {
      console.error('Audio play error:', err);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        // queue happens in pause handler (listener)
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
      // detach listeners and drop instance
      if (listenersRef.current && listenersRef.current.detach) listenersRef.current.detach();
      audioRef.current = null;
    }

    currentEpisodeIdRef.current = null;
    // don't clear completedEpisodesRef globally — keep knowledge for this session
    setPlayer({ playing: false, src: '', episodeId: null, title: '', author: '' });
    setProgress(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      const epId = currentEpisodeIdRef.current;
      // If seeking on a completed episode, allow progress again by removing from completed set
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
    play,
    pause,
    toggle,
    stop,
    seek,
    seekBy,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};