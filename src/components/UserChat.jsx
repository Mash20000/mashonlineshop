import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useUnread } from '../context/UnreadContext';
import ChatWindow from './ChatWindow';

// The customer's chat with the shop: a single conversation, no names, just sent and received messages.
export default function UserChat() {
  const { refresh } = useUnread();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get('/chat')
      .then((res) => {
        setMessages(res.data);
        refresh();
      })
      .catch((err) => setError(errMsg(err)));
  }, [refresh]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (text) => {
    setError('');
    try {
      await api.post('/chat', { text });
      load();
    } catch (err) {
      setError(errMsg(err));
      throw err;
    }
  };

  const remove = async (message, scope) => {
    try {
      await api.delete(`/chat/message/${message._id}`, { params: { scope } });
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const clear = async () => {
    try {
      await api.delete('/chat');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="mx-auto h-[75vh] max-w-2xl">
      <ChatWindow
        messages={messages}
        side="customer"
        onSend={send}
        onDelete={remove}
        onClear={clear}
        error={error}
        emptyText="Say hello! Ask about a product or an order and the shop will reply here."
        header={
          <div>
            <p className="font-semibold">Mash Online Shop</p>
            <p className="text-xs text-white/80">Chat with the shop</p>
          </div>
        }
      />
    </div>
  );
}
