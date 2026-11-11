import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicKey, pushSupported, subscribeThisDevice } from '../utils/push';

const DISMISS_KEY = 'mash_push_dismissed';

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

// Asks a logged-in person once to allow device notifications. If they already allowed them, this device is registered silently.
export default function PushSetup() {
  const { user } = useAuth();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAsk(false);
    if (!user || !pushSupported()) return undefined;
    let cancelled = false;

    (async () => {
      const key = await fetchPublicKey();
      if (!key || cancelled) return; // push is not set up on the server yet
      if (Notification.permission === 'granted') {
        subscribeThisDevice().catch(() => {});
      } else if (Notification.permission === 'default' && !wasDismissed()) {
        setAsk(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ask) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setAsk(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') await subscribeThisDevice();
    } catch {
      /* the browser refused or something failed: nothing more to do */
    } finally {
      setBusy(false);
      setAsk(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-brand-700">Turn on notifications</span> to get replies, delivery updates and offers on this device, even when the shop is closed.
      </p>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={enable} disabled={busy}>
          {busy ? 'Please wait...' : 'Turn on'}
        </button>
        <button className="btn-outline" onClick={dismiss} disabled={busy}>
          Not now
        </button>
      </div>
    </div>
  );
}
