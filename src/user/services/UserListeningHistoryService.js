// src/services/UserListeningHistoryService.js
import api from './api';

const basePath = '/secure/user/history';
const DEFAULT_FLUSH_INTERVAL_MS = 15000;   // 15 seconds
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;  // 5 minutes
const STORAGE_KEY = 'listeningHistoryPending';

// Internal queue: Map<episodeId, Entry>
// Entry: { episodeId, progressSeconds?, type: 'progress'|'complete', retryCount, lastAttemptMs, requestId, updatedAtMs }
const pendingMap = new Map();
let flushTimer = null;
let flushInterval = DEFAULT_FLUSH_INTERVAL_MS;
let isShuttingDown = false;

// ----------------------------- Persistence helpers -----------------------------
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const entries = JSON.parse(stored);
      entries.forEach(entry => {
        if (entry && entry.episodeId) {
          pendingMap.set(entry.episodeId, {
            ...entry,
            // ensure numeric timestamps
            lastAttemptMs: entry.lastAttemptMs ? Number(entry.lastAttemptMs) : null,
            updatedAtMs: entry.updatedAtMs ? Number(entry.updatedAtMs) : Date.now(),
            retryCount: entry.retryCount || 0,
            requestId: entry.requestId || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load pending history from storage', e);
  }
}

function saveToStorage() {
  try {
    const entries = Array.from(pendingMap.values()).map(entry => ({
      episodeId: entry.episodeId,
      progressSeconds: entry.progressSeconds,
      type: entry.type,
      retryCount: entry.retryCount,
      lastAttemptMs: entry.lastAttemptMs || null,
      requestId: entry.requestId,
      updatedAtMs: entry.updatedAtMs || Date.now(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save pending history to storage', e);
  }
}

// ----------------------------- Send helpers (with simple success handling) -----------------------------
async function sendProgress(entry) {
  const { episodeId, progressSeconds } = entry;
  try {
    await api.post(`${basePath}/progress`, {
      episodeId,
      progressSeconds,
    });
    // On success remove only if same requestId (ensures we don't remove newer updates)
    const current = pendingMap.get(episodeId);
    if (current && current.requestId === entry.requestId && current.type === 'progress') {
      pendingMap.delete(episodeId);
      saveToStorage();
    }
    return true;
  } catch (err) {
    console.warn(`Failed to send progress for episode ${episodeId}`, err);
    return false;
  }
}

async function sendComplete(entry) {
  const { episodeId } = entry;
  try {
    await api.post(`${basePath}/episodes/${episodeId}/complete`);
    const current = pendingMap.get(episodeId);
    if (current && current.requestId === entry.requestId && current.type === 'complete') {
      pendingMap.delete(episodeId);
      saveToStorage();
    }
    return true;
  } catch (err) {
    console.warn(`Failed to mark completed for episode ${episodeId}`, err);
    return false;
  }
}

// ----------------------------- Retry / scheduling -----------------------------
function scheduleRetry(entry) {
  const retryCount = entry.retryCount || 0;
  const delay = Math.min(Math.pow(2, retryCount) * 1000, MAX_RETRY_DELAY_MS);
  setTimeout(() => {
    const current = pendingMap.get(entry.episodeId);
    if (!current || current.requestId !== entry.requestId) return;

    const attemptAndReschedule = (fn, type) => {
      fn(current).then(success => {
        if (!success) {
          // bump retry and set lastAttemptMs and new requestId so future updates are distinguishable
          const updated = {
            ...current,
            retryCount: (current.retryCount || 0) + 1,
            lastAttemptMs: Date.now(),
            requestId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            updatedAtMs: Date.now(),
          };
          pendingMap.set(entry.episodeId, updated);
          saveToStorage();
          scheduleRetry(updated);
        }
      });
    };

    if (current.type === 'progress') attemptAndReschedule(sendProgress, 'progress');
    else if (current.type === 'complete') attemptAndReschedule(sendComplete, 'complete');
  }, delay);
}

// ----------------------------- Flush (attempt send of everything) -----------------------------
export async function flush() {
  if (pendingMap.size === 0) return;

  const entries = Array.from(pendingMap.values());
  // try all in parallel
  const results = await Promise.allSettled(entries.map(entry => {
    if (entry.type === 'progress') return sendProgress(entry);
    return sendComplete(entry);
  }));

  results.forEach((res, idx) => {
    const entry = entries[idx];
    const failed = (res.status === 'rejected') || (res.status === 'fulfilled' && res.value === false);
    if (failed) {
      const updated = {
        ...entry,
        retryCount: (entry.retryCount || 0) + 1,
        lastAttemptMs: Date.now(),
        requestId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        updatedAtMs: Date.now(),
      };
      pendingMap.set(entry.episodeId, updated);
      scheduleRetry(updated);
    }
  });

  saveToStorage();
}

// ----------------------------- Public API (queue-only for progress; complete creates entry) -----------------------------
export function queueProgress(episodeId, progressSeconds) {
  if (!episodeId || isNaN(Number(progressSeconds))) return;

  const existing = pendingMap.get(episodeId);
  // If there's a pending completion, the user is listening again – discard it
  if (existing && existing.type === 'complete') {
    pendingMap.delete(episodeId);
  }

  const nowMs = Date.now();
  const requestId = `${nowMs}_${Math.random().toString(36).slice(2)}`;

  // new entry replaces any existing progress entry (latest wins)
  pendingMap.set(episodeId, {
    episodeId,
    progressSeconds: Math.floor(Number(progressSeconds)),
    type: 'progress',
    retryCount: 0,
    lastAttemptMs: existing ? (existing.lastAttemptMs || null) : null,
    requestId,
    updatedAtMs: nowMs,
  });

  saveToStorage();
  ensureFlushTimer();
}

export function updateProgressImmediate({ episodeId, progressSeconds }) {
  if (!episodeId) throw new Error('episodeId required');
  if (isNaN(Number(progressSeconds))) throw new Error('progressSeconds required (number)');

  // immediate fire (no retry). Keep for rare cases but prefer queueProgress.
  return api.post(`${basePath}/progress`, {
    episodeId,
    progressSeconds: Math.floor(Number(progressSeconds)),
  });
}

export function markCompleted(episodeId) {
  if (!episodeId) throw new Error('episodeId required');

  // remove any pending progress entry; completed overrides
  pendingMap.delete(episodeId);

  const nowMs = Date.now();
  const requestId = `${nowMs}_${Math.random().toString(36).slice(2)}`;
  const entry = {
    episodeId,
    type: 'complete',
    retryCount: 0,
    lastAttemptMs: null,
    requestId,
    updatedAtMs: nowMs,
  };

  pendingMap.set(episodeId, entry);
  saveToStorage();

  // attempt immediate send; if fails schedule retry
  sendComplete(entry).then(success => {
    if (!success) {
      const updated = {
        ...entry,
        retryCount: 1,
        lastAttemptMs: Date.now(),
        requestId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        updatedAtMs: Date.now(),
      };
      pendingMap.set(episodeId, updated);
      saveToStorage();
      scheduleRetry(updated);
    }
  });

  ensureFlushTimer();
}

// ----------------------------- Flush timer management -----------------------------
function ensureFlushTimer() {
  if (flushTimer || isShuttingDown) return;
  const tick = async () => {
    try {
      await flush();
    } catch (err) {
      console.warn('Periodic flush error', err);
    }
    if (!isShuttingDown) {
      flushTimer = setTimeout(tick, flushInterval);
    }
  };
  flushTimer = setTimeout(tick, flushInterval);
}

function stopFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export function configure({ intervalMs = DEFAULT_FLUSH_INTERVAL_MS } = {}) {
  flushInterval = Number(intervalMs) || DEFAULT_FLUSH_INTERVAL_MS;
  if (flushTimer) {
    stopFlushTimer();
    ensureFlushTimer();
  }
}

// ----------------------------- Unload/sendBeacon fallback -----------------------------
export async function shutdown({ timeoutMs = 3000 } = {}) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  stopFlushTimer();
  const flushPromise = flush();
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeoutMs));
  await Promise.race([flushPromise, timeoutPromise]);
}

function tryUnloadSend() {
  if (pendingMap.size === 0) return;

  // Prefer navigator.sendBeacon (best for unload)
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const entries = Array.from(pendingMap.values());
    for (const entry of entries) {
      try {
        if (entry.type === 'progress') {
          const url = `${basePath}/progress`;
          const body = JSON.stringify({
            episodeId: entry.episodeId,
            progressSeconds: entry.progressSeconds,
          });
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          const url = `${basePath}/episodes/${entry.episodeId}/complete`;
          const body = JSON.stringify({}); // send non-empty JSON for safety
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        }
      } catch (e) {
        // ignore beacon errors
      }
    }
    pendingMap.clear();
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  // Fallback: fetch with keepalive (best-effort)
  const entries = Array.from(pendingMap.values());
  for (const entry of entries) {
    try {
      if (entry.type === 'progress') {
        fetch(`${basePath}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episodeId: entry.episodeId, progressSeconds: entry.progressSeconds }),
          keepalive: true,
        }).catch(() => {});
      } else {
        fetch(`${basePath}/episodes/${entry.episodeId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // swallow
    }
  }
  pendingMap.clear();
  localStorage.removeItem(STORAGE_KEY);
}

// ----------------------------- Initialization -----------------------------
if (typeof window !== 'undefined') {
  loadFromStorage();

  // On online, try flush immediately
  window.addEventListener('online', () => {
    try {
      flush().catch(() => {});
    } catch (_) {}
  }, { passive: true });

  // Best-effort send on unload/visibility change
  const unloadHandler = () => tryUnloadSend();
  window.addEventListener('pagehide', unloadHandler, { passive: true });
  window.addEventListener('beforeunload', unloadHandler, { passive: true });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') tryUnloadSend();
  }, { passive: true });
}

export default {
  queueProgress,
  updateProgressImmediate, // rare use only; prefer queueProgress
  markCompleted,
  flush,
  shutdown,
  configure,
};