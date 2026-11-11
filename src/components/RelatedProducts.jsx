import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import Price from './Price';
import { unique } from '../utils/format';

const PAGE_SIZE = 6;

// "You may also like": products from the same categories as the cart.
// Shows 6 at a time; every few seconds they slide out and the next 6 slide in. Click a product to add it to the cart.
export default function RelatedProducts({ cartItems }) {
  const { add } = useCart();
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState('in'); // 'out' while the current 6 are leaving
  const [paused, setPaused] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const timeouts = useRef([]);

  const categories = unique(cartItems.map((i) => i.category).filter(Boolean)).sort().join(',');
  const inCart = useMemo(() => new Set(cartItems.map((i) => i._id)), [cartItems]);
  const excludeKey = [...inCart].sort().join(',');

  // Fetch once per set of categories (not on every cart change, so the slider is not reset)
  useEffect(() => {
    api
      .get('/products/related', { params: { categories, exclude: excludeKey, limit: 24 } })
      .then((res) => setAll(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const visible = useMemo(() => all.filter((p) => !inCart.has(p._id)), [all, inCart]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = page % pageCount;
  const shown = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
  };
  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  // Slide the current 6 out, then bring the next 6 in
  const next = () => {
    if (pageCount < 2) return;
    setPhase('out');
    later(() => {
      setPage((p) => (p + 1) % pageCount);
      setPhase('in');
    }, 400);
  };

  useEffect(() => {
    if (pageCount < 2 || paused) return undefined;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, paused]);

  if (!visible.length) return null;

  const pick = (p) => {
    add(p, 1);
    setJustAdded(p._id);
    later(() => setJustAdded(null), 1200);
  };

  return (
    <section className="mt-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">You may also like</h2>
          <p className="text-sm text-gray-500">Click a product to add it to your cart</p>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: pageCount }).map((_, n) => (
                <span key={n} className={`h-2 rounded-full transition-all ${n === current ? 'w-5 bg-brand-600' : 'w-2 bg-gray-300'}`} />
              ))}
            </div>
            <button className="btn-outline px-3 py-1" onClick={next} aria-label="Show more suggestions">
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      <div key={current} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 ${phase === 'out' ? 'animate-slide-out' : 'animate-slide-in'}`}>
        {shown.map((p) => {
          const needsChoice = p.optionGroups?.length > 0;
          const card = (
            <>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                {p.onOffer && <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">OFFER</span>}
              </div>
              <div className="p-2.5 text-left">
                <p className="line-clamp-1 text-sm font-semibold text-gray-900">{p.name}</p>
                <Price product={p} className="text-sm" />
                <p className="mt-1 text-xs font-semibold text-brand-700">
                  {justAdded === p._id ? 'Added ✓' : '+ Add to cart'}
                </p>
              </div>
            </>
          );
          const cls = 'card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md';
          // products with size / colour / RAM choices must be opened first
          return needsChoice ? (
            <Link key={p._id} to={`/products/${p._id}`} className={cls}>
              {card}
            </Link>
          ) : (
            <button key={p._id} type="button" onClick={() => pick(p)} className={`${cls} w-full`}>
              {card}
            </button>
          );
        })}
      </div>
    </section>
  );
}
