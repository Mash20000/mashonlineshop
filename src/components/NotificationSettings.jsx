import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { enableNotifications, getPushStatus, subscribeThisDevice, unsubscribeThisDevice } from '../utils/push';

// Account page panel: shows whether notifications work on this device, lets you turn them on and send a test.
export default function NotificationSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const refresh = useCallback(async () => {
    try {
      setStatus(await getPushStatus());
    } catch {
      setStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Granted earlier but this device is not registered yet (e.g. after logging in): register it
  useEffect(() => {
    if (status === 'needs-subscribe') subscribeThisDevice().then(refresh).catch(() => {});
  }, [status, refresh]);

  const turnOn = async () => {
    setBusy(true);
    setResult(null);
    try {
      await enableNotifications();
    } catch (err) {
      setResult({ ok: false, text: errMsg(err) });
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  // Shows a notification straight from the browser, without the server. If this one does not appear,
  // the problem is in the browser / computer notification settings, not in the shop.
  const localTest = async () => {
    setBusy(true);
    setResult(null);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
      await registration.showNotification('Local test', {
        body: 'If you can see this, your device can show notifications.',
        icon: '/icon-192.png',
        tag: 'local-test',
      });
      setResult({
        ok: true,
        text: 'Local test sent. If you did NOT see a notification, your browser or computer is hiding them: check Windows Settings > System > Notifications (Chrome / Edge must be On, Focus Assist / Do Not Disturb off) and the browser site settings.',
      });
    } catch (err) {
      setResult({ ok: false, text: `Could not show a local notification: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async (retry = true) => {
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post('/push/test');
      setResult({
        ok: true,
        text: `Test sent to ${data.devices} device${data.devices === 1 ? '' : 's'}. It should appear in a few seconds. If it does not, check that notifications are allowed for your browser in your device settings and that Do Not Disturb / Focus Assist is off.`,
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.mismatch && retry) {
        // registered with older keys: register again and retry once
        try {
          await unsubscribeThisDevice();
          await subscribeThisDevice();
          return await sendTest(false);
        } catch {
          /* fall through to the message below */
        }
      }
      setResult({ ok: false, text: data?.message || errMsg(err) });
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  if (!status) return null;

  const isAdmin = user?.role === 'admin';
  const info = {
    insecure: 'Notifications only work on a secure page. Open the shop with https:// (http://localhost also works on this computer).',
    unsupported:
      "This browser can't show notifications. On an iPhone, add the shop to your Home Screen first (Share, then Add to Home Screen), then open it from there.",
    'server-off': isAdmin
      ? 'Notifications are not set up on the server yet. In the server folder run "npm install" and "npm run vapid", put the two keys in .env, then restart the server.'
      : 'Notifications are not available right now.',
    blocked:
      'Notifications are blocked for this site. Click the lock icon next to the address bar, set Notifications to Allow, then reload the page.',
    off: 'Notifications are off on this device.',
    'needs-subscribe': 'Finishing setup on this device...',
    on: 'Notifications are on for this device.',
  }[status];

  const good = status === 'on';

  return (
    <section className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${good ? 'bg-green-500' : 'bg-gray-300'}`} />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">Device notifications</p>
          <p className="text-sm text-gray-600">{info}</p>
          {result && (
            <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{result.text}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {status === 'off' && (
          <button className="btn-primary" onClick={turnOn} disabled={busy}>
            {busy ? 'Please wait...' : 'Turn on'}
          </button>
        )}
        {(status === 'on' || status === 'needs-subscribe') && (
          <>
            <button className="btn-outline" onClick={localTest} disabled={busy || status !== 'on'}>
              1. Local test
            </button>
            <button className="btn-outline" onClick={() => sendTest(true)} disabled={busy || status !== 'on'}>
              {busy ? 'Sending...' : '2. Server test'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
