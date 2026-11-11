import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';
import BroadcastModal from '../components/BroadcastModal';
import { money } from '../utils/format';

const PERIODS = [
  [7, 'Last 7 days'],
  [30, 'Last 30 days'],
  [90, 'Last 90 days'],
  [0, 'All time'],
];

const FILTERS = [
  ['all', 'All'],
  ['restock', 'To restock'],
  ['top', 'Top'],
  ['average', 'Average'],
  ['poor', 'Poor'],
  ['none', 'No sales'],
  ['nocost', 'No cost price'],
];

const perfBadge = {
  top: ['Top', 'bg-green-100 text-green-700'],
  average: ['Average', 'bg-blue-100 text-blue-700'],
  poor: ['Poor', 'bg-red-100 text-red-700'],
  none: ['No sales', 'bg-gray-100 text-gray-600'],
};
const stockBadge = {
  ok: ['In stock', 'bg-green-100 text-green-700'],
  low: ['Low', 'bg-yellow-100 text-yellow-800'],
  out: ['Sold out', 'bg-red-100 text-red-700'],
};
const priorityStyle = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-400',
  low: 'border-l-blue-400',
};

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  stock: (a, b) => a.stock - b.stock,
  sold: (a, b) => b.unitsSold - a.unitsSold,
  revenue: (a, b) => b.revenue - a.revenue,
  profit: (a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity),
  margin: (a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity),
};

const matches = (p, filter) => {
  if (filter === 'restock') return p.stockStatus !== 'ok';
  if (filter === 'nocost') return p.costPrice === null;
  if (filter === 'all') return true;
  return p.performance === filter;
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function Stat({ label, value, hint, tone = '' }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone || 'text-gray-900'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// Inline quick edit for one table row: buying price, selling price, add stock.
function QuickEdit({ product, onSave, onClose }) {
  const [cost, setCost] = useState(product.costPrice ?? '');
  const [price, setPrice] = useState(product.price);
  const [add, setAdd] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const body = { price: Number(price), costPrice: cost === '' ? null : Number(cost) };
    if (add !== '') body.addStock = Number(add);
    setBusy(true);
    const ok = await onSave(product, body, `"${product.name}" updated`);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 bg-brand-50 p-3">
      <label className="text-xs font-medium text-gray-600">
        Cost price
        <input type="number" min="0" className="input mt-1 w-28" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="what you paid" />
      </label>
      <label className="text-xs font-medium text-gray-600">
        Selling price
        <input type="number" min="1" className="input mt-1 w-28" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
      <label className="text-xs font-medium text-gray-600">
        Add stock
        <input type="number" min="1" className="input mt-1 w-24" value={add} onChange={(e) => setAdd(e.target.value)} placeholder={`now ${product.stock}`} />
      </label>
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
      <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
    </form>
  );
}

export default function Store() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { ok, text }
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('revenue');
  const [editingId, setEditingId] = useState(null);
  const [announce, setAnnounce] = useState(null); // text for the broadcast window
  const [busyAction, setBusyAction] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = useCallback(() => {
    api
      .get('/analytics/store', { params: { days } })
      .then((res) => {
        setData(res.data);
        setError('');
      })
      .catch((err) => setError(errMsg(err)));
  }, [days]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [isAdmin, load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const quickSave = async (product, body, doneText) => {
    try {
      await api.patch(`/products/${product._id}/quick`, body);
      setToast({ ok: true, text: doneText });
      load();
      return true;
    } catch (err) {
      setToast({ ok: false, text: errMsg(err) });
      return false;
    }
  };

  const runAction = async (item, action) => {
    if (action.kind === 'quick') {
      const key = `${item.title}|${action.label}`;
      setBusyAction(key);
      const product = data.products.find((p) => p._id === action.productId) || { _id: action.productId, name: '' };
      await quickSave(product, action.body, action.done);
      setBusyAction('');
    } else if (action.kind === 'edit') {
      navigate(`/products?edit=${action.productId}`);
    } else if (action.kind === 'link') {
      navigate(action.to);
    } else if (action.kind === 'announce') {
      setAnnounce(action.text);
    } else if (action.kind === 'filter') {
      setFilter(action.filter);
      document.getElementById('store-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.products
      .filter((p) => matches(p, filter))
      .filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q))
      .sort(SORTS[sort]);
  }, [data, filter, search, sort]);

  const exportCsv = () => {
    const head = ['Product', 'Category', 'Price', 'Cost price', 'Stock', 'Stock status', 'Units sold', 'Revenue', 'Profit', 'Margin %', 'Days of stock left', 'Performance', 'Restock quantity'];
    const lines = rows.map((p) =>
      [p.name, p.category, p.currentPrice, p.costPrice ?? '', p.stock, p.stockStatus, p.unitsSold, p.revenue, p.profit ?? '', p.margin === null ? '' : Math.round(p.margin * 100), p.daysLeft ?? '', p.performance, p.restockQty].map(csvCell).join(',')
    );
    const blob = new Blob([[head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mash-store-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (authLoading) return <p className="py-16 text-center text-gray-500">Loading...</p>;
  if (!user) return <LoginPrompt message="Log in as the admin to open the Store." />;
  if (!isAdmin) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600">The Store page is for the shop admin only.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Back to the shop</Link>
      </div>
    );
  }

  const s = data?.summary;
  const top = data?.mostProfitable;
  const restockCount = s ? s.lowStock + s.outOfStock : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500">See how your products perform, what to restock and what to do next to earn more.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={days} onChange={(e) => { setData(null); setDays(Number(e.target.value)); }}>
            {PERIODS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={() => setAnnounce('')}>Message customers</button>
          <Link to="/products" className="btn-primary">Add product</Link>
        </div>
      </div>

      {toast && (
        <div className={`fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="py-16 text-center text-gray-500">Analysing your shop...</p>}

      {data && (
        <>
          {/* summary */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Revenue" value={money(s.revenue)} hint={`${s.orders} paid order${s.orders === 1 ? '' : 's'}, avg ${money(s.avgOrderValue)}`} />
            <Stat
              label="Profit"
              value={s.profit === null ? 'Add cost prices' : money(s.profit)}
              tone={s.profit !== null && s.profit < 0 ? 'text-red-600' : 'text-green-700'}
              hint={s.profit === null ? 'needed to know your real profit' : s.profitComplete ? 'revenue minus buying price' : 'only counts products with a cost price'}
            />
            <Stat label="Items sold" value={s.unitsSold} hint={`${s.noSales} product${s.noSales === 1 ? '' : 's'} with no sales`} />
            <Stat label="Stock value" value={money(s.stockValue)} hint="at selling prices" />
            <Stat label="Products" value={s.products} hint={`${s.inStock} in stock`} />
            <Stat label="To restock" value={restockCount} tone={restockCount ? 'text-red-600' : ''} hint={`${s.outOfStock} sold out, ${s.lowStock} running low`} />
            <Stat label="Waiting delivery" value={s.pendingDelivery} tone={s.pendingDelivery ? 'text-yellow-700' : ''} hint="paid orders not yet delivered" />
            <Stat label="Missing cost price" value={s.missingCost} hint="products without a buying price" />
          </div>

          {/* most profitable + categories */}
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="card flex gap-4 p-4 lg:col-span-2">
              {top ? (
                <>
                  <img src={top.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <span className="badge bg-green-100 text-green-700">Most {data.basis === 'profit' ? 'profitable' : 'sales'}</span>
                    <p className="mt-1 truncate text-xl font-bold text-gray-900">{top.name}</p>
                    <p className="text-sm text-gray-600">
                      {top.unitsSold} sold &middot; revenue {money(top.revenue)}
                      {top.profit !== null && <> &middot; profit <strong className="text-green-700">{money(top.profit)}</strong></>}
                      {top.margin !== null && <> &middot; margin {Math.round(top.margin * 100)}%</>}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {top.stock} left{top.daysLeft !== null && <> (about {Math.max(1, Math.round(top.daysLeft))} days at the current pace)</>}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No paid sales in this period yet. Your best product will appear here after the first sales.</p>
              )}
            </div>
            <div className="card p-4">
              <p className="mb-2 font-semibold text-gray-900">Sales by category</p>
              {data.categories.length === 0 && <p className="text-sm text-gray-500">No products yet.</p>}
              {data.categories.slice(0, 5).map((c) => {
                const max = Math.max(1, data.categories[0].revenue);
                return (
                  <div key={c.category} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate text-gray-700">{c.category}</span>
                      <span className="text-gray-500">{money(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-100">
                      <div className="h-1.5 rounded bg-brand-500" style={{ width: `${(c.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* advice */}
          <section className="mb-8">
            <h2 className="mb-1 text-xl font-bold text-gray-900">What to do to earn more</h2>
            <p className="mb-3 text-sm text-gray-500">Based on your sales, stock and prices. Most actions need just one click.</p>
            {data.advice.length === 0 ? (
              <p className="card p-6 text-center text-gray-500">Nothing urgent. Keep your stock up and your customers happy.</p>
            ) : (
              <div className="space-y-3">
                {data.advice.map((item, i) => (
                  <div key={`${item.title}-${i}`} className={`card border-l-4 p-4 ${priorityStyle[item.priority]}`}>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{item.detail}</p>
                    {item.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.actions.map((a) => {
                          const key = `${item.title}|${a.label}`;
                          return (
                            <button
                              key={a.label}
                              className={a.kind === 'quick' ? 'btn-primary' : 'btn-outline'}
                              disabled={busyAction === key}
                              onClick={() => runAction(item, a)}
                            >
                              {busyAction === key ? 'Please wait...' : a.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* table */}
          <section id="store-table" className="scroll-mt-40">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900">All products ({rows.length})</h2>
              <div className="flex flex-wrap gap-2">
                <input className="input w-44" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="revenue">Sort: revenue</option>
                  <option value="profit">Sort: profit</option>
                  <option value="sold">Sort: items sold</option>
                  <option value="margin">Sort: margin</option>
                  <option value="stock">Sort: stock (lowest)</option>
                  <option value="name">Sort: name</option>
                </select>
                <button className="btn-outline" onClick={exportCsv}>Download CSV</button>
              </div>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium ${filter === key ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {label} ({data.products.filter((p) => matches(p, key)).length})
                </button>
              ))}
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Sold</th>
                    <th className="px-3 py-2">Revenue</th>
                    <th className="px-3 py-2">Profit</th>
                    <th className="px-3 py-2">Performance</th>
                    <th className="px-3 py-2">Restock</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan="10" className="px-3 py-8 text-center text-gray-500">No products match.</td></tr>
                  )}
                  {rows.map((p) => (
                    <FragmentRow key={p._id}>
                      <tr className="border-t border-gray-100 align-middle">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
                            <div className="min-w-0">
                              <Link to={`/products/${p._id}`} className="block max-w-[200px] truncate font-medium text-gray-900 hover:underline">{p.name}</Link>
                              <span className="text-xs text-gray-500">{p.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {money(p.currentPrice)}
                          {p.onOffer && <span className="ml-1 text-xs text-red-600">offer</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{p.costPrice === null ? <span className="text-gray-400">not set</span> : money(p.costPrice)}</td>
                        <td className="px-3 py-2">
                          <span className={`badge ${stockBadge[p.stockStatus][1]}`}>{p.stock} &middot; {stockBadge[p.stockStatus][0]}</span>
                          {p.daysLeft !== null && p.stock > 0 && <p className="mt-0.5 text-xs text-gray-500">~{Math.max(1, Math.round(p.daysLeft))} days left</p>}
                        </td>
                        <td className="px-3 py-2">{p.unitsSold}</td>
                        <td className="px-3 py-2">{money(p.revenue)}</td>
                        <td className={`px-3 py-2 font-medium ${p.profit !== null && p.profit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.profit === null ? '-' : money(p.profit)}
                          {p.margin !== null && <p className="text-xs font-normal text-gray-500">{Math.round(p.margin * 100)}% margin</p>}
                        </td>
                        <td className="px-3 py-2"><span className={`badge ${perfBadge[p.performance][1]}`}>{perfBadge[p.performance][0]}</span></td>
                        <td className="px-3 py-2">
                          {p.restockQty > 0 ? (
                            <button
                              className="rounded-lg border border-brand-600 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                              onClick={() => quickSave(p, { addStock: p.restockQty }, `Added ${p.restockQty} to "${p.name}"`)}
                            >
                              +{p.restockQty}
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button className="mr-2 text-sm font-medium text-brand-700 hover:underline" onClick={() => setEditingId(editingId === p._id ? null : p._id)}>Quick edit</button>
                          <Link to={`/products?edit=${p._id}`} className="text-sm text-gray-500 hover:underline">Full edit</Link>
                        </td>
                      </tr>
                      {editingId === p._id && (
                        <tr className="border-t border-gray-100">
                          <td colSpan="10" className="p-0">
                            <QuickEdit product={p} onSave={quickSave} onClose={() => setEditingId(null)} />
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Performance compares your selling products with each other ({data.basis === 'profit' ? 'by profit' : 'by revenue, add cost prices to rank by profit'}). The "+" button adds the suggested quantity: about 30 days of sales.
            </p>
          </section>
        </>
      )}

      {announce !== null && <BroadcastModal initialText={announce} onClose={() => setAnnounce(null)} onSent={() => setToast({ ok: true, text: 'Message sent to customers' })} />}
    </div>
  );
}

// A table body can only hold rows: this groups a row with its edit row.
function FragmentRow({ children }) {
  return <>{children}</>;
}
