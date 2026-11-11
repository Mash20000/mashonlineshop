import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import { useUnread } from '../context/UnreadContext';
import AdminChat from '../components/AdminChat';
import { chosenLabel, dateTime, money, shortId } from '../utils/format';

const paymentBadge = {
  paid: ['Paid', 'bg-green-100 text-green-700'],
  pending: ['Awaiting payment', 'bg-yellow-100 text-yellow-700'],
  failed: ['Payment failed', 'bg-red-100 text-red-700'],
};

function OrderCard({ order, onChanged }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payLabel, payClass] =
    order.status === 'cancelled' && order.paymentStatus === 'pending'
      ? ['Not paid', 'bg-gray-200 text-gray-600']
      : paymentBadge[order.paymentStatus] || paymentBadge.pending;

  const deliver = async () => {
    if (order.paymentStatus !== 'paid' && !window.confirm('Payment has not been confirmed for this order. Mark as delivered anyway?')) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/orders/${order._id}/deliver`, { note });
      onChanged();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">Order #{shortId(order._id)}</p>
        <p className="text-xs text-gray-500">{dateTime(order.createdAt)}</p>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {order.name} &middot; {order.phone}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            {item.image && <img src={item.image} alt="" className="h-9 w-9 rounded object-cover" />}
            <span className="flex-1">
              {item.qty} &times; {item.name}
              {item.chosen?.length > 0 && <span className="block text-xs text-gray-500">{chosenLabel(item.chosen)}</span>}
            </span>
            <span>{money(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${payClass}`}>{payLabel}</span>
          {order.status !== 'pending' && (
            <span className={`badge ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
            </span>
          )}
          {order.mpesaReceipt && <span className="text-xs text-gray-500">Receipt: {order.mpesaReceipt}</span>}
        </div>
        <p className="font-bold text-gray-900">{money(order.total)}</p>
      </div>

      {order.status === 'cancelled' && order.paymentNote && (
        <p className={`mt-2 text-sm ${order.paymentStatus === 'paid' ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
          {order.paymentNote}
        </p>
      )}

      {order.status === 'pending' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="Delivery message to the customer (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          <button className="btn-primary whitespace-nowrap" onClick={deliver} disabled={busy}>
            {busy ? 'Sending...' : 'Mark delivered'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Orders grouped by customer. The customer with the newest order is at the top; click a name to see their orders.
function OrdersByCustomer({ orders, onChanged }) {
  const [open, setOpen] = useState(() => new Set());

  const groups = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      const key = order.user?._id || `name:${order.name}`;
      if (!map.has(key)) map.set(key, { key, name: order.user?.name || order.name, phone: order.user?.phone || order.phone, orders: [] });
      map.get(key).orders.push(order);
    }
    const list = [...map.values()];
    list.forEach((g) => g.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    list.sort((a, b) => new Date(b.orders[0].createdAt) - new Date(a.orders[0].createdAt));
    return list;
  }, [orders]);

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = open.has(g.key);
        const pending = g.orders.filter((o) => o.status === 'pending').length;
        return (
          <div key={g.key} className="card overflow-hidden">
            <button
              onClick={() => toggle(g.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {g.name[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-gray-900">{g.name}</span>
                <span className="block text-xs text-gray-500">
                  {g.orders.length} order{g.orders.length === 1 ? '' : 's'} &middot; latest {dateTime(g.orders[0].createdAt)}
                </span>
              </span>
              {pending > 0 && <span className="badge bg-blue-100 text-blue-700">{pending} pending</span>}
              <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>&#8964;</span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-gray-100 bg-gray-50 p-3">
                {g.orders.map((o) => (
                  <OrderCard key={o._id} order={o} onChanged={onChanged} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NotificationList({ items, onChanged, empty }) {
  const markRead = async (id) => {
    await api.patch(`/messages/${id}/read`).catch(() => {});
    onChanged();
  };

  if (!items.length) return <p className="card p-8 text-center text-gray-500">{empty}</p>;

  return (
    <div className="space-y-3">
      {items.map((m) => (
        <div key={m._id} className={`card p-4 ${m.read ? '' : 'border-brand-500 bg-brand-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`badge ${
                  m.type === 'payment' ? 'bg-green-100 text-green-700' : m.type === 'stock' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {m.type === 'payment' ? 'Payment' : m.type === 'stock' ? 'Stock' : 'New order'}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {m.name || m.sender?.name}
                {(m.phone || m.sender?.phone) && <span className="font-normal text-gray-500"> &middot; {m.phone || m.sender?.phone}</span>}
              </span>
            </div>
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
  );
}

export default function AdminDashboard() {
  const { chat, refresh } = useUnread();
  const [tab, setTab] = useState('orders');
  const [noteTab, setNoteTab] = useState('order');
  const [orderFilter, setOrderFilter] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [o, m] = await Promise.all([api.get('/orders', { params: { status: orderFilter } }), api.get('/messages')]);
      setOrders(o.data);
      setMessages(m.data);
      setError('');
      refresh();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [orderFilter, refresh]);

  // Refresh every 20 seconds so new orders and notifications appear on their own
  useEffect(() => {
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [load]);

  const orderNotes = messages.filter((m) => m.type === 'order');
  const paymentNotes = messages.filter((m) => m.type === 'payment');
  const stockNotes = messages.filter((m) => m.type === 'stock');
  const unread = (list) => list.filter((m) => !m.read).length;
  const unreadNotes = unread(orderNotes) + unread(paymentNotes) + unread(stockNotes);

  const markAllRead = async () => {
    await api.patch('/messages/read-all').catch(() => {});
    load();
  };

  const tabs = [
    ['orders', 'Orders', orderFilter === 'pending' ? orders.length : 0],
    ['notifications', 'Notifications', unreadNotes],
    ['messages', 'Customer messages', chat],
  ];

  const noteTabs = [
    ['order', 'Order notifications', unread(orderNotes)],
    ['payment', 'Payment notifications', unread(paymentNotes)],
    ['stock', 'Stock alerts', unread(stockNotes)],
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin dashboard</h1>
        <p className="text-gray-500">Manage orders, notifications and customer chats.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
            {count > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{count}</span>}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === 'messages' ? (
        <AdminChat />
      ) : loading ? (
        <p className="py-10 text-center text-gray-500">Loading...</p>
      ) : (
        <>
          {tab === 'orders' && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700" htmlFor="order-filter">
                  Show
                </label>
                <select id="order-filter" className="input max-w-[200px]" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                  <option value="pending">Pending orders</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="all">All orders</option>
                </select>
                <span className="text-sm text-gray-500">Click a customer to see their orders</span>
              </div>
              {orders.length ? (
                <OrdersByCustomer orders={orders} onChanged={load} />
              ) : (
                <p className="card p-8 text-center text-gray-500">No {orderFilter === 'all' ? '' : orderFilter} orders.</p>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm font-semibold">
                  {noteTabs.map(([key, label, count]) => (
                    <button
                      key={key}
                      onClick={() => setNoteTab(key)}
                      className={`rounded-md px-4 py-2 transition ${noteTab === key ? 'bg-white text-brand-700 shadow' : 'text-gray-500'}`}
                    >
                      {label}
                      {count > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{count}</span>}
                    </button>
                  ))}
                </div>
                {unreadNotes > 0 && (
                  <button className="btn-outline" onClick={markAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              {noteTab === 'order' ? (
                <NotificationList items={orderNotes} onChanged={load} empty="No order notifications yet." />
              ) : noteTab === 'payment' ? (
                <NotificationList items={paymentNotes} onChanged={load} empty="No payment notifications yet." />
              ) : (
                <NotificationList items={stockNotes} onChanged={load} empty="No stock alerts. You will be told when a product runs low or sells out." />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
