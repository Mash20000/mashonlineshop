import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';
import { unsubscribeThisDevice } from '../utils/push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'login', reason: '' });
  const afterAuth = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('mash_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('mash_token'))
      .finally(() => setLoading(false));
  }, []);

  // Opens the log in / sign up popup. `onSuccess` runs right after a successful login
  // (used by checkout so the customer can continue where they stopped).
  const openAuth = useCallback((mode = 'login', onSuccess = null, reason = '') => {
    afterAuth.current = onSuccess;
    setModal({ open: true, mode, reason });
  }, []);

  const closeAuth = useCallback(() => {
    afterAuth.current = null;
    setModal((m) => ({ ...m, open: false }));
  }, []);

  const setMode = useCallback((mode) => setModal((m) => ({ ...m, mode })), []);

  const authenticate = async (mode, form) => {
    const { data } = await api.post(`/auth/${mode}`, form);
    localStorage.setItem('mash_token', data.token);
    setUser(data.user);
    setModal((m) => ({ ...m, open: false }));
    const callback = afterAuth.current;
    afterAuth.current = null;
    if (callback) callback(data.user);
    return data.user;
  };

  const logout = async () => {
    // stop notifications on this device first (needs the login token), then log out
    try {
      await unsubscribeThisDevice();
    } catch {
      /* not important */
    }
    localStorage.removeItem('mash_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, modal, openAuth, closeAuth, setMode, authenticate, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
