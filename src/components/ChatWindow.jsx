import { useEffect, useRef, useState } from 'react';
import { dayLabel, timeOnly } from '../utils/format';

// WhatsApp-style conversation: bubbles, day separators, delete menu, clear chat and a send box.
// side = who is looking: 'admin' or 'customer'. Own messages sit on the right.
export default function ChatWindow({ messages, side, onSend, onDelete, onClear, header, emptyText, error }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const boxRef = useRef(null);

  // keep the newest message in view
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setText('');
    } catch {
      /* the parent shows the error, keep the text so nothing is lost */
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear this whole chat? It will be removed from your side only.')) onClear();
  };

  let lastDay = '';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-brand-600 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">{header}</div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="shrink-0 rounded-lg border border-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            Clear chat
          </button>
        )}
      </div>

      <div ref={boxRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[#f3ece4] px-3 py-4">
        {messages.length === 0 && (
          <p className="mx-auto mt-10 max-w-xs rounded-xl bg-white/80 px-4 py-3 text-center text-sm text-gray-600">{emptyText}</p>
        )}

        {messages.map((m) => {
          const mine = m.from === side;
          const day = dayLabel(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          return (
            <div key={m._id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">{day}</span>
                </div>
              )}

              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    mine ? 'rounded-br-sm bg-brand-100' : 'rounded-bl-sm bg-white'
                  }`}
                >
                  {m.broadcast && !m.deleted && (
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-600">Announcement</p>
                  )}
                  {m.deleted ? (
                    <p className="pr-5 text-sm italic text-gray-400">This message was deleted</p>
                  ) : (
                    <p className="whitespace-pre-wrap break-words pr-5 text-sm text-gray-800">{m.text}</p>
                  )}
                  <p className="mt-0.5 text-right text-[11px] text-gray-400">{timeOnly(m.createdAt)}</p>

                  <button
                    type="button"
                    aria-label="Message options"
                    onClick={() => setMenuId(menuId === m._id ? null : m._id)}
                    className="absolute right-1.5 top-1 rounded px-1 text-gray-400 opacity-60 hover:text-gray-700 group-hover:opacity-100"
                  >
                    &#8964;
                  </button>

                  {menuId === m._id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                      <div className={`absolute top-7 z-20 w-44 animate-pop-in overflow-hidden rounded-xl border border-gray-200 bg-white text-sm shadow-lg ${mine ? 'right-0' : 'left-0'}`}>
                        <button
                          className="block w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setMenuId(null);
                            onDelete(m, 'me');
                          }}
                        >
                          Delete for me
                        </button>
                        {mine && !m.deleted && (
                          <button
                            className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setMenuId(null);
                              onDelete(m, 'everyone');
                            }}
                          >
                            Delete for everyone
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
        <input
          className="input rounded-full px-4"
          placeholder="Type a message"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          aria-label="Type a message"
        />
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
          disabled={!text.trim() || sending}
          aria-label="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
