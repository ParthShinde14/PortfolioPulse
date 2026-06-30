import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /** Polling interval in milliseconds. Default 180_000 (180s / 3 minutes). */
  intervalMs?: number;
  /** Set to false to disable polling/visibility refresh entirely (e.g. while a modal blocks interaction). */
  enabled?: boolean;
}

export function useAutoRefresh(refreshFn: () => void, options: UseAutoRefreshOptions = {}) {
  const { intervalMs = 180_000, enabled = true } = options;

  const refreshRef = useRef(refreshFn);
  refreshRef.current = refreshFn;

  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshRef.current();
      }
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
