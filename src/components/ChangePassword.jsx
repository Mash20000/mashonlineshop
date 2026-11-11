import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

// Lets anyone change their own password. For the admin it also shows a warning while the default password is still in use.
export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) return setError('The new passwords do not match');
    setBusy(true);
    try {
      const { data } = await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      updateUser(data.user);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6">
      {user?.mustChangePassword && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <strong>Security warning:</strong> you are still using the default admin password. Anyone who knows it can control your shop. Please change it now.
          {!open && (
            <button className="ml-2 font-semibold underline" onClick={() => setOpen(true)}>
              Change password
            </button>
          )}
        </div>
      )}
      {done && !open && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Your password was changed.</p>}

      {!open ? (
        !user?.mustChangePassword && (
          <button className="text-sm font-medium text-brand-700 hover:underline" onClick={() => { setOpen(true); setDone(false); }}>
            Change password
          </button>
        )
      ) : (
        <form onSubmit={submit} className="card max-w-md space-y-3 p-4">
          <h2 className="font-semibold text-gray-900">Change password</h2>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <input type="password" className="input" placeholder="Current password" value={form.currentPassword} onChange={set('currentPassword')} required autoComplete="current-password" />
          <input type="password" className="input" placeholder="New password (6+ characters)" value={form.newPassword} onChange={set('newPassword')} required minLength={6} autoComplete="new-password" />
          <input type="password" className="input" placeholder="Repeat the new password" value={form.confirm} onChange={set('confirm')} required minLength={6} autoComplete="new-password" />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save password'}</button>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
