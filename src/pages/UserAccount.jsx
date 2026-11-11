import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import ReviewForm from '../components/ReviewForm';
import { Stars } from '../components/Stars';
import { chosenLabel, dateTime, money, shortId } from '../utils/format';

const paymentBadge = {
  paid: ['Paid', 'bg-green-100 text-green-700'],
  pending: ['Awaiting payment', 'bg-yellow-100 text-yellow-700'],
  failed: ['Payment failed', 'bg-red-100 text-red-700'],
};
const statusBadge = {
  pending: ['Pending delivery', 'bg-blue-100 text-blue-700'],
  delivered: ['Delivered', 'bg-green-100 text-green-700'],
  cancelled: ['Cancelled', 'bg-gray-200 text-gray-600'],
};

// Popup to rate a delivered product
function RateModal({ item, existing, onClose, onSaved }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {item.image && <img src={item.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
            <div>
              <h2 className="text-lg font-bold text-gray-900">Rate this product</h2>
              <p className="text-sm text-gray-500">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-700">
            &times;
          </button>
        </div>
        <ReviewForm productId={item.product} existing={existing} onSaved={onSaved} />
      </div>
    </div>
  );
}

export default function UserAccount() {
  const { user, updateUser } = useAuth();
  const { refresh } = useUnread();
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState({}); // productId -> { rating, comment }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(null); // item being rated

  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState({ name: user.name, phone: user.phone || '' });
  const [detailsError, setDetailsError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, m, r] = await Promise.all([api.get('/orders/mine'), api.get('/messages'), api.get('/reviews/mine')]);
      setOrders(o.data);
      setMessages(m.data);
      setReviews(Object.fromEntries(r.data.map((x) => [x.product, { rating: x.rating, comment: x.comment }])));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = async (id) => {
    await api.patch(`/messages/${id}/read`).catch(() => {});
    load();
    refresh();
  };
  const markAllRead = async () => {
    await api.patch('/messages/read-all').catch(() => {});
    load();
    refresh();
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setDetailsError('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', details);
      updateUser(data);
      setEditing(false);
    } catch (err) {
      setDetailsError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My account</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Details */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your details</h2>
          {!editing && (
            <button
              className="text-sm font-medium text-brand-700 hover:underline"
              onClick={() => {
                setDetails({ name: user.name, phone: user.phone || '' });
                setEditing(true);
              }}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input className="input" value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} placeholder="0712345678" inputMode="tel" />
            </div>
            {detailsError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{detailsError}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Name', user.name],
              ['Username', user.username],
              ['Phone', user.phone || 'Not added'],
              ['Member since', new Date(user.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Orders */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My orders</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => {
                const [payLabel, payClass] =
                  order.status === 'cancelled' && order.paymentStatus === 'pending'
                    ? ['Not paid', 'bg-gray-200 text-gray-600']
                    : paymentBadge[order.paymentStatus] || paymentBadge.pending;
                const [stLabel, stClass] = statusBadge[order.status] || statusBadge.pending;
                const delivered = order.status === 'delivered';
                return (
                  <div key={order._id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">Order #{shortId(order._id)}</p>
                      <p className="text-xs text-gray-500">{dateTime(order.createdAt)}</p>
                    </div>

                    <ul className="mt-3 space-y-3 text-sm text-gray-700">
                      {order.items.map((item, i) => {
                        const review = reviews[item.product];
                        return (
                          <li key={i}>
                            <div className="flex justify-between gap-3">
                              <span>
                                {item.qty} &times; {item.name}
                                {item.chosen?.length > 0 && <span className="block text-xs text-gray-500">{chosenLabel(item.chosen)}</span>}
                              </span>
                              <span>{money(item.price * item.qty)}</span>
                            </div>
                            {delivered && item.product && (
                              <div className="mt-1 flex items-center gap-2">
                                {review ? (
                                  <>
                                    <Stars value={review.rating} size="text-sm" />
                                    <button className="text-xs font-medium text-brand-700 hover:underline" onClick={() => setRating(item)}>
                                      Edit review
                                    </button>
                                  </>
                                ) : (
                                  <button className="btn-outline px-3 py-1 text-xs" onClick={() => setRating(item)}>
                                    &#9733; Rate &amp; give feedback
                                  </button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <div className="flex flex-wrap gap-2">
                        <span className={`badge ${payClass}`}>{payLabel}</span>
                        <span className={`badge ${stClass}`}>{stLabel}</span>
                      </div>
                      <p className="font-bold text-gray-900">{money(order.total)}</p>
                    </div>
                    {order.mpesaReceipt && <p className="mt-2 text-xs text-gray-500">M-Pesa receipt: {order.mpesaReceipt}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-500">
              <p>You have not made any orders yet.</p>
              <Link to="/products" className="btn-primary mt-3">
                Start shopping
              </Link>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications {unread > 0 && <span className="badge ml-1 bg-brand-600 text-white">{unread} new</span>}
            </h2>
            {unread > 0 && (
              <button className="text-sm font-medium text-brand-700 hover:underline" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : messages.length ? (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m._id} className={`card p-4 ${m.read ? '' : 'border-brand-500 bg-brand-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-green-100 text-green-700">Delivery update</span>
                    <span className="text-xs text-gray-500">{dateTime(m.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-gray-800">{m.text}</p>
                  {!m.read && (
                    <button className="mt-2 text-sm font-medium text-brand-700 hover:underline" onClick={() => markRead(m._id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="card p-6 text-center text-gray-500">No notifications yet. Delivery updates will show here.</p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            Want to ask something? <Link to="/messages" className="font-medium text-brand-700 hover:underline">Chat with the shop</Link>
          </p>
        </section>
      </div>

      {rating && (
        <RateModal
          item={rating}
          existing={reviews[rating.product]}
          onClose={() => setRating(null)}
          onSaved={() => {
            setRating(null);
            load();
          }}
        />
      )}
    </div>
  );
}
