import api from '../api';

// Device notifications (Web Push). They need HTTPS (localhost is fine while developing).

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const urlBase64ToUint8Array = (base64) => {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// Is push set up on the server (VAPID keys added)? Returns the public key or null.
export const fetchPublicKey = async () => {
  try {
    const { data } = await api.get('/push/public-key');
    return data.key || null;
  } catch {
    return null;
  }
};

// Registers the service worker, subscribes this device and tells the server. Needs permission to be granted already.
export const subscribeThisDevice = async () => {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const key = await fetchPublicKey();
  if (!key) return false;

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }
  await api.post('/push/subscribe', { subscription: subscription.toJSON() });
  return true;
};

// What is the state of notifications on this device? Used by the panel on the Account page.
// -> 'insecure' | 'unsupported' | 'server-off' | 'blocked' | 'off' | 'needs-subscribe' | 'on'
export const getPushStatus = async () => {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'insecure';
  if (!pushSupported()) return 'unsupported';
  if (!(await fetchPublicKey())) return 'server-off';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'default') return 'off';
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? 'on' : 'needs-subscribe';
};

// Ask for permission (must be called from a click) and register this device
export const enableNotifications = async () => {
  try {
    localStorage.removeItem('mash_push_dismissed');
  } catch {
    /* ignore */
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') await subscribeThisDevice();
  return permission;
};

// Called on log out so the next person using this device does not get this person's notifications
export const unsubscribeThisDevice = async () => {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api.post('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe().catch(() => {});
};
