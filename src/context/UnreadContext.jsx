import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from './AuthContext';

const UnreadContext = createContext({ chat: 0, notes: 0, refresh: () => {} });

// Polls the number of unread chat messages and unread notifications (for the nav badges and chat button)
export function UnreadProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState({ chat: 0, notes: 0 });

  const refresh = useCallback(async () => {
    if (!user) {
      setCounts({ chat: 0, notes: 0 });
      return;
    }
    try {
      const [chat, notes] = await Promise.all([api.get('/chat/unread-count'), api.get('/messages/unread-count')]);
      setCounts({ chat: chat.data.count, notes: notes.data.count });
    } catch {
      /* ignore, try again later */
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh, location.pathname]);

  return <UnreadContext.Provider value={{ ...counts, refresh }}>{children}</UnreadContext.Provider>;
}

export const useUnread = () => useContext(UnreadContext);
