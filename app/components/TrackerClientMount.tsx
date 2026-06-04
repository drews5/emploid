'use client';

import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TRACKER_DATA } from './trackerData';

export default function TrackerClientMount() {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = document.getElementById('tracker-app-root');

    if (!target || target.hasChildNodes()) return;

    async function mountTracker() {
      (window as typeof window & { TRACKER?: typeof TRACKER_DATA }).TRACKER = TRACKER_DATA;
      const TrackerApp = (await import('./TrackerApp')).default;
      if (cancelled || !target) return;

      rootRef.current = createRoot(target);
      rootRef.current.render(<TrackerApp />);
    }

    void mountTracker();

    return () => {
      cancelled = true;
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return null;
}
