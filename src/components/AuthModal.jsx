import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

const empty = { name: '', username: '', phone: '', password: '' };

export default function AuthModal() {
  const { modal, closeAuth, setMode, authenticate } = useAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!modal.open) return null;
  const isSignup = modal.mode === 'signup';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(modal.mode, form);
      setForm(empty);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (mode) => {
    setError('');
    setMode(mode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}
    >
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
            {modal.reason && <p className="mt-1 text-sm text-brand-700">{modal.reason}</p>}
          </div>
          <button onClick={closeAuth} aria-label="Close" className="rounded p-1 text-2xl leading-none text-gray-400 hover:text-gray-700">
            &times;
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
          {[
            ['login', 'Log in'],
            ['signup', 'Sign up'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={`rounded-md py-2 transition ${modal.mode === mode ? 'bg-white text-brand-700 shadow' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} required autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={set('username')} required autoComplete="username" />
          </div>
          {isSignup && (
            <div>
              <label className="label">Phone number (optional)</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="0712345678" inputMode="tel" autoComplete="tel" />
            </div>
          )}
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={set('password')}
              required
              minLength={isSignup ? 6 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
