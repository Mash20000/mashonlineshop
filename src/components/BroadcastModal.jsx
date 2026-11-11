import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';

// Ready-made messages the admin can edit before sending. Anything in [brackets] must be filled in.
const TEMPLATES = [
  {
    label: 'Holiday greeting',
    text: 'Happy holidays from Mash Online Shop! Thank you for shopping with us. We wish you and your family a joyful time.',
  },
  {
    label: 'Shop closed',
    text: 'Notice: Mash Online Shop will be closed on [date] for the holiday. Orders placed during this time will be handled when we reopen on [date]. Thank you for your understanding.',
  },
  {
    label: 'New offer',
    text: 'New offer! [product name] is now on offer at [price]. Open the Products page to get yours before the offer ends.',
  },
];

// Admin only: send one message to all customers or to chosen customers.
export default function BroadcastModal({ onClose, onSent, initialText = '' }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState('all'); // all | choose
  const [chosen, setChosen] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    api
      .get('/chat/customers')
      .then((res) => setCustomers(res.data))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? customers.filter((c) => `${c.name} ${c.username} ${c.phone || ''}`.toLowerCase().includes(q)) : customers;
  }, [customers, search]);

  const recipients = mode === 'all' ? customers.length : chosen.size;

  const toggle = (id) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allShownChosen = shown.length > 0 && shown.every((c) => chosen.has(c._id));
  const toggleShown = () =>
    setChosen((prev) => {
      const next = new Set(prev);
      shown.forEach((c) => (allShownChosen ? next.delete(c._id) : next.add(c._id)));
      return next;
    });

  const send = async (e) => {
    e.preventDefault();
    setError('');
    const message = text.trim();
    if (!message) return setError('Please type a message');
    if (!recipients) return setError('Choose at least one customer');
    if (/\[[^\]]+\]/.test(message) && !window.confirm('Your message still has [brackets] to fill in. Send it anyway?')) return;
    if (!window.confirm(`Send this message to ${recipients} customer${recipients === 1 ? '' : 's'}?`)) return;

    setBusy(true);
    try {
      const body = mode === 'all' ? { text: message, all: true } : { text: message, customerIds: [...chosen] };
      const { data } = await api.post('/chat/broadcast', body);
      setDone(data.sent);
      onSent?.(data.sent);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send a bulk message</h2>
            <p className="text-sm text-gray-500">Customers get it in their Messages and as a notification on their device.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-700">
            &times;
          </button>
        </div>

        {done !== null ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">&#10003;</div>
            <h3 className="text-lg font-bold text-gray-900">Message sent</h3>
            <p className="mt-1 text-gray-600">
              Sent to {done} customer{done === 1 ? '' : 's'}.
            </p>
            <button className="btn-primary mt-5" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div>
              <p className="label">Start from a template</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setText(t.text)}
                    className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bulk-text">
                Message
              </label>
              <textarea
                id="bulk-text"
                className="input"
                rows="5"
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your announcement, offer or greeting"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{text.length}/1000</p>
            </div>

            <div>
              <p className="label">Send to</p>
              <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
                {[
                  ['all', `All customers${loading ? '' : ` (${customers.length})`}`],
                  ['choose', 'Choose customers'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`rounded-md py-2 transition ${mode === key ? 'bg-white text-brand-700 shadow' : 'text-gray-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'choose' && (
                <div className="mt-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 border-b border-gray-200 p-2">
                    <input className="input" placeholder="Search by name, username or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" className="h-4 w-4 accent-orange-600" checked={allShownChosen} onChange={toggleShown} />
                      Select all
                    </label>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {loading ? (
                      <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
                    ) : shown.length ? (
                      shown.map((c) => (
                        <label key={c._id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-0 hover:bg-brand-50">
                          <input type="checkbox" className="h-4 w-4 accent-orange-600" checked={chosen.has(c._id)} onChange={() => toggle(c._id)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900">{c.name}</span>
                            <span className="block truncate text-xs text-gray-500">
                              @{c.username}
                              {c.phone ? ` · ${c.phone}` : ''}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="p-4 text-center text-sm text-gray-500">No customers found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button className="btn-primary w-full py-3" disabled={busy || loading || !recipients}>
              {busy ? 'Sending...' : `Send to ${recipients} customer${recipients === 1 ? '' : 's'}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
