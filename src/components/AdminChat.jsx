import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import { useUnread } from '../context/UnreadContext';
import { dayLabel, timeOnly } from '../utils/format';
import ChatWindow from './ChatWindow';
import BroadcastModal from './BroadcastModal';

// Admin chat: customers on the left (newest message first), the selected customer's chat on the right.
export default function AdminChat() {
  const { refresh } = useUnread();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null); // the customer
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const activeId = useRef(null);

  const loadConversations = useCallback(() => {
    api
      .get('/chat/conversations')
      .then((res) => setConversations(res.data))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoaded(true));
  }, []);

  const loadMessages = useCallback(
    (customerId) => {
      api
        .get(`/chat/with/${customerId}`)
        .then((res) => {
          if (activeId.current !== customerId) return; // the admin opened another chat meanwhile
          setMessages(res.data);
          loadConversations();
          refresh();
        })
        .catch((err) => setError(errMsg(err)));
    },
    [loadConversations, refresh]
  );

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    activeId.current = selected?._id || null;
    if (!selected) return undefined;
    loadMessages(selected._id);
    const timer = setInterval(() => loadMessages(selected._id), 4000);
    return () => clearInterval(timer);
  }, [selected, loadMessages]);

  const open = (customer) => {
    setError('');
    setMessages([]);
    setSelected(customer);
  };

  const send = async (text) => {
    setError('');
    try {
      await api.post(`/chat/with/${selected._id}`, { text });
      loadMessages(selected._id);
    } catch (err) {
      setError(errMsg(err));
      throw err;
    }
  };

  const remove = async (message, scope) => {
    try {
      await api.delete(`/chat/message/${message._id}`, { params: { scope } });
      loadMessages(selected._id);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const clear = async () => {
    try {
      await api.delete(`/chat/with/${selected._id}`);
      loadMessages(selected._id);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const preview = (c) => {
    if (c.last.deleted) return 'This message was deleted';
    return `${c.last.from === 'admin' ? 'You: ' : ''}${c.last.text}`;
  };

  return (
    <div className="grid h-[72vh] gap-4 md:grid-cols-[300px_1fr]">
      {/* Customer list (hidden on phones while a chat is open) */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm`}>
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
          <p className="font-semibold text-gray-900">Customers</p>
          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setBroadcasting(true)}>
            Send bulk message
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!loaded ? (
            <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
          ) : conversations.length ? (
            conversations.map((c) => (
              <button
                key={c.customer._id}
                onClick={() => open(c.customer)}
                className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-brand-50 ${
                  selected?._id === c.customer._id ? 'bg-brand-50' : ''
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  {c.customer.name[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-gray-900">{c.customer.name}</span>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {dayLabel(c.last.createdAt) === 'Today' ? timeOnly(c.last.createdAt) : dayLabel(c.last.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.unread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>{preview(c)}</span>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{c.unread}</span>
                    )}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-gray-500">No customer messages yet. Chats appear here when a customer writes to the shop.</p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={`${selected ? 'block' : 'hidden md:block'} min-h-0`}>
        {selected ? (
          <ChatWindow
            key={selected._id}
            messages={messages}
            side="admin"
            onSend={send}
            onDelete={remove}
            onClear={clear}
            error={error}
            emptyText="No messages in this chat."
            header={
              <div className="flex items-center gap-3">
                <button onClick={() => setSelected(null)} className="text-2xl leading-none md:hidden" aria-label="Back to customers">
                  &lsaquo;
                </button>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold">
                  {selected.name[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selected.name}</p>
                  <p className="truncate text-xs text-white/80">
                    @{selected.username}
                    {selected.phone ? ` · ${selected.phone}` : ''}
                  </p>
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Select a customer to see your chat with them.
          </div>
        )}
      </div>

      {broadcasting && (
        <BroadcastModal
          onClose={() => setBroadcasting(false)}
          onSent={() => {
            loadConversations();
            if (selected) loadMessages(selected._id);
          }}
        />
      )}
    </div>
  );
}
