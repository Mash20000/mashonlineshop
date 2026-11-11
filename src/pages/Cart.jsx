import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RelatedProducts from '../components/RelatedProducts';
import { money, optionsLabel, shortId, unique } from '../utils/format';

function CheckoutModal({ onClose }) {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [step, setStep] = useState('form'); // form | waiting | paid | failed | timeout
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // After the STK push is sent, check every 3 seconds whether the payment went through
  useEffect(() => {
    if (step !== 'waiting' || !order) return undefined;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const { data } = await api.get(`/orders/${order._id}`);
        if (data.paymentStatus === 'paid') {
          clearInterval(timer);
          setOrder(data);
          setStep('paid');
          clear();
          return;
        }
        if (data.paymentStatus === 'failed') {
          clearInterval(timer);
          setOrder(data);
          setStep('failed');
          return;
        }
      } catch {
        /* try again on the next tick */
      }
      if (tries >= 30) {
        clearInterval(timer);
        setStep('timeout');
        clear();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [step, order?._id, clear]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/orders', {
        name,
        phone,
        items: items.map((i) => ({ productId: i._id, qty: i.qty, options: i.options })),
      });
      setOrder(data);
      setStep('waiting');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const canClose = step !== 'waiting';

  // Cancel while waiting for the customer to enter their PIN
  const [cancelling, setCancelling] = useState(false);
  const cancelPayment = async () => {
    if (!window.confirm('Cancel this payment?')) return;
    setError('');
    setCancelling(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      setStep('cancelled');
    } catch (err) {
      // e.g. the payment arrived a moment ago: stay on this screen, the check below will show it as paid
      setError(errMsg(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && canClose && onClose()}
    >
      <div className="card w-full max-w-md p-6">
        {step === 'form' && (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
                <p className="text-sm text-gray-500">An M-Pesa prompt will be sent to your phone.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">M-Pesa phone number</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" inputMode="tel" required />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
              <span className="text-gray-700">Total to pay</span>
              <span className="text-xl font-bold text-brand-700">{money(total)}</span>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? 'Sending prompt...' : `Pay ${money(total)} with M-Pesa`}
            </button>
          </form>
        )}

        {step === 'waiting' && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <h2 className="text-xl font-bold text-gray-900">Check your phone</h2>
            <p className="mt-2 text-gray-600">
              We sent an M-Pesa prompt to <span className="font-semibold">{phone}</span>. Enter your M-Pesa PIN to pay{' '}
              <span className="font-semibold">{money(total)}</span>.
            </p>
            <p className="mt-3 text-xs text-gray-400">Waiting for confirmation...</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="btn-outline mt-5 w-full py-2.5" onClick={cancelPayment} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel payment'}
            </button>
          </div>
        )}

        {step === 'cancelled' && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl text-gray-500">&times;</div>
            <h2 className="text-xl font-bold text-gray-900">Payment cancelled</h2>
            <p className="mt-2 text-gray-600">
              Your order was cancelled and your cart is still saved. If the M-Pesa prompt is still on your phone, please dismiss it
              and do not enter your PIN.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn-outline" onClick={onClose}>Back to cart</button>
              <button className="btn-primary" onClick={() => { setStep('form'); setOrder(null); setError(''); }}>Try again</button>
            </div>
          </div>
        )}

        {step === 'paid' && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">&#10003;</div>
            <h2 className="text-xl font-bold text-gray-900">Payment received</h2>
            <p className="mt-2 text-gray-600">
              Thank you! Order #{shortId(order._id)} is confirmed
              {order.mpesaReceipt ? ` (M-Pesa receipt ${order.mpesaReceipt})` : ''}. We will update you in your Account page.
            </p>
            <Link to="/account" className="btn-primary mt-5" onClick={onClose}>View my orders</Link>
          </div>
        )}

        {step === 'failed' && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">!</div>
            <h2 className="text-xl font-bold text-gray-900">Payment not completed</h2>
            <p className="mt-2 text-gray-600">{order?.paymentNote || 'The payment was cancelled or failed.'} Your cart is still here, so you can try again.</p>
            <button className="btn-primary mt-5" onClick={() => { setStep('form'); setOrder(null); }}>Try again</button>
          </div>
        )}

        {step === 'timeout' && (
          <div className="py-4 text-center">
            <h2 className="text-xl font-bold text-gray-900">Still waiting for confirmation</h2>
            <p className="mt-2 text-gray-600">
              We have not heard back from M-Pesa yet. If you entered your PIN, your order will show as paid in your Account page shortly.
            </p>
            <Link to="/account" className="btn-primary mt-5" onClick={onClose}>Go to Account</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cart() {
  const { user, openAuth } = useAuth();
  const { items, setQty, remove, sync, total } = useCart();
  const [checkout, setCheckout] = useState(false);

  // Refresh prices, offers and stock whenever the cart page is opened or a new product is added
  const idsKey = unique(items.map((i) => i._id)).join(',');
  useEffect(() => {
    if (!idsKey) return;
    api
      .get('/products', { params: { ids: idsKey, limit: 50 } })
      .then((res) => sync(res.data.products, idsKey.split(',')))
      .catch(() => {});
  }, [idsKey, sync]);

  const hasSoldOut = items.some((i) => i.soldOut);

  const startCheckout = () => {
    if (!user) {
      // Ask the customer to log in or sign up, then continue straight to checkout
      openAuth('login', (loggedIn) => loggedIn.role !== 'admin' && setCheckout(true), 'Please log in or sign up to complete your order.');
      return;
    }
    setCheckout(true);
  };

  if (!items.length && !checkout) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Add some products to get started.</p>
        <Link to="/products" className="btn-primary mt-5">Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Your cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="card flex items-center gap-4 p-3">
              <Link to={`/products/${item._id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/products/${item._id}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-brand-700">
                  {item.name}
                </Link>
                {Object.keys(item.options || {}).length > 0 && <p className="text-xs text-gray-500">{optionsLabel(item.options)}</p>}
                <p className="text-sm text-gray-500">
                  {money(item.price)} each
                  {item.regularPrice > item.price && <span className="ml-2 text-xs text-gray-400 line-through">{money(item.regularPrice)}</span>}
                </p>
                {item.soldOut && <p className="text-sm font-medium text-red-600">Out of stock. Please remove this item.</p>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-gray-300 text-sm">
                    <button className="px-2.5 py-1" onClick={() => setQty(item.key, item.qty - 1)} aria-label="Decrease">&minus;</button>
                    <span className="w-8 text-center font-semibold">{item.qty}</span>
                    <button className="px-2.5 py-1" onClick={() => setQty(item.key, item.qty + 1)} aria-label="Increase">+</button>
                  </div>
                  <button className="text-sm text-red-600 hover:underline" onClick={() => remove(item.key)}>
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-bold text-gray-900">{money(item.price * item.qty)}</p>
            </div>
          ))}
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-40">
          <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
          <div className="mt-4 flex justify-between text-gray-600">
            <span>Items ({items.reduce((s, i) => s + i.qty, 0)})</span>
            <span>{money(total)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          {user?.role === 'admin' ? (
            <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Admin accounts cannot place orders. Log in with a customer account to check out.
            </p>
          ) : (
            <button className="btn-primary mt-4 w-full py-3" onClick={startCheckout} disabled={!items.length || hasSoldOut}>
              Checkout with M-Pesa
            </button>
          )}
          <Link to="/products" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>

      {items.length > 0 && <RelatedProducts cartItems={items} />}

      {checkout && <CheckoutModal onClose={() => setCheckout(false)} />}
    </div>
  );
}
