// src/services/UserListeningHistoryService.js
import api from './api';

const basePath = '/secure/user/history';
const DEFAULT_FLUSH_INTERVAL_MS = 15000; // 15s - tune as needed

// Internal buffer keyed by episodeId -> { episodeId, progressSeconds, completed, lastUpdated }
const progressBuffer = new Map();
let flushTimer = null;
let flushInterval = DEFAULT_FLUSH_INTERVAL_MS;
let isShuttingDown = false;

/** Internal: send a single progress update to server (fire-and-forget) */
async function sendProgress(payload) {
  try {
    // payload: { episodeId, progressSeconds, completed? }
    await api.post(`${basePath}/progress`, payload);
    // no UI notifications — just fire & forget
  } catch (err) {
    // Log for diagnostics, but don't throw to UI
    console.warn('UserListeningHistoryService: failed to send progress', { payload, err });
  }
}

/** Internal: send mark-as-completed call (fire-and-forget) */
async function sendMarkCompleted(episodeId) {
  try {
    await api.post(`${basePath}/episodes/${episodeId}/complete`);
  } catch (err) {
    console.warn('UserListeningHistoryService: failed to mark completed', { episodeId, err });
  }
}

/** Flush the buffer: send the latest progress for each episode and clear the buffer. */
export async function flush() {
  if (!progressBuffer.size) return;
  // snapshot and clear to avoid races where new updates come in during sending
  const entries = Array.from(progressBuffer.values());
  progressBuffer.clear();

  // send each entry (parallel)
  await Promise.all(entries.map(entry => sendProgress({
    episodeId: entry.episodeId,
    progressSeconds: entry.progressSeconds,
    completed: entry.completed,
  })));
}

/** Queue a progress update — will be debounced/batched automatically.
 * Call this frequently (e.g., every timeplayer timeupdate fires). The service will only
 * send the latest update for an episode at flush time.
 *
 * episodeId: string
 * progressSeconds: number
 * completed: boolean (optional)
 */
export function queueProgress(episodeId, progressSeconds, completed) {
  if (!episodeId) return;
  if (isNaN(Number(progressSeconds))) return;

  const now = Date.now();
  progressBuffer.set(episodeId, {
    episodeId,
    progressSeconds: Math.floor(Number(progressSeconds)),
    completed: typeof completed === 'boolean' ? completed : undefined,
    lastUpdated: now,
  });

  // ensure flush timer is running
  ensureFlushTimer();
}

/** Send a single progress update immediately (no buffering). Use sparingly. */
export function updateProgressImmediate({ episodeId, progressSeconds, completed } = {}) {
  if (!episodeId) throw new Error('episodeId required');
  if (isNaN(Number(progressSeconds))) throw new Error('progressSeconds required (number)');
  return sendProgress({ episodeId, progressSeconds: Math.floor(Number(progressSeconds)), completed });
}

/** Mark an episode as completed immediately. */
export function markCompleted(episodeId) {
  if (!episodeId) throw new Error('episodeId required');
  // If there's a buffered progress for this episode, send it first (best-effort)
  const buffered = progressBuffer.get(episodeId);
  if (buffered) {
    // send buffered progress then mark completed
    // do not await here (fire & forget), but attempt both
    sendProgress({
      episodeId: buffered.episodeId,
      progressSeconds: buffered.progressSeconds,
      completed: true,
    }).catch(() => {});
    progressBuffer.delete(episodeId);
  }
  return sendMarkCompleted(episodeId);
}

/** Internal: ensure the periodic flush timer is started */
function ensureFlushTimer() {
  if (flushTimer || isShuttingDown) return;
  flushTimer = setInterval(() => {
    // don't await here; call flush but handle errors internally
    flush().catch(err => {
      console.warn('UserListeningHistoryService: periodic flush error', err);
    });
  }, flushInterval);
}

/** Stop the flush timer (used on cleanup) */
function stopFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/** Configure flush interval (ms). Call before using service if you need custom timing) */
export function configure({ intervalMs = DEFAULT_FLUSH_INTERVAL_MS } = {}) {
  flushInterval = Number(intervalMs) || DEFAULT_FLUSH_INTERVAL_MS;
  if (flushTimer) {
    stopFlushTimer();
    ensureFlushTimer();
  }
}

/** Graceful shutdown: flush pending updates and stop timer. Call on page unload. */
export async function shutdown({ timeoutMs = 3000 } = {}) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  stopFlushTimer();

  // Attempt a final flush; if it doesn't complete within timeout, continue
  const p = flush();
  let finished = false;
  p.then(() => { finished = true; }).catch(() => { finished = true; });
  const start = Date.now();
  while (!finished && Date.now() - start < timeoutMs) {
    // spin-wait short periods to allow flush to finish — minimal blocking
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }
  // If not finished, give up — we intentionally don't block the page long.
}

/** Attach unload handlers so buffered progress is attempted to be flushed on page leave.
 * This is optional but recommended for best-effort delivery.
 */
if (typeof window !== 'undefined') {
  // Try to flush on page hide/unload/visibilitychange
  const tryFlushBeforeUnload = () => {
    // Best-effort synchronous delivery: use navigator.sendBeacon for a tiny payload if available
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && progressBuffer.size) {
      // send each buffered entry via sendBeacon as a fallback
      for (const entry of progressBuffer.values()) {
        try {
          const url = `${basePath}/progress`;
          const body = JSON.stringify({
            episodeId: entry.episodeId,
            progressSeconds: entry.progressSeconds,
            completed: entry.completed,
          });
          // sendBeacon uses absolute URL if needed by your proxy; relative should be fine in same-origin setups
          navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
        } catch (e) {
          // ignore
        }
      }
      // clear buffer after attempting sendBeacon
      progressBuffer.clear();
      return;
    }

    // Otherwise try the async flush (best-effort)
    // we don't await here because unload/visibility may cancel promises
    flush().catch(() => {});
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tryFlushBeforeUnload();
    }
  }, { passive: true });

  window.addEventListener('pagehide', tryFlushBeforeUnload, { passive: true });
  window.addEventListener('beforeunload', tryFlushBeforeUnload, { passive: true });
}

export default {
  // insert-only API surface
  queueProgress,            // buffered; call often (player timeupdate)
  updateProgressImmediate,  // immediate single write
  markCompleted,            // immediate completed write
  flush,                    // force sending buffered progress
  shutdown,                 // flush + stop (for app-level lifecycle)
  configure,                // optional tuning
};