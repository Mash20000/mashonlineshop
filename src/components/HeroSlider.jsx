import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Price, { discountPercent } from './Price';

// Fades through the newest products and any products on offer.
export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const active = slides.length ? index % slides.length : 0;
  const go = (n) => setIndex((n + slides.length) % slides.length);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((p, n) => {
        const discount = discountPercent(p);
        return (
          <Link
            key={p._id}
            to={`/products/${p._id}`}
            aria-hidden={n !== active}
            tabIndex={n === active ? 0 : -1}
            className={`absolute inset-0 block transition-opacity duration-700 ${n === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
            {discount > 0 ? (
              <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow">
                OFFER -{discount}%
              </span>
            ) : (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 shadow">
                New
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pb-10 text-white">
              <p className="text-xs uppercase tracking-wide opacity-80">{p.category}</p>
              <p className="line-clamp-1 text-lg font-semibold">{p.name}</p>
              <Price product={p} className="[&_*]:!text-white text-base" />
            </div>
          </Link>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(active - 1)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-gray-800 shadow hover:bg-white"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(active + 1)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-gray-800 shadow hover:bg-white"
          >
            &rsaquo;
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((p, n) => (
              <button
                key={p._id}
                type="button"
                aria-label={`Show slide ${n + 1}`}
                onClick={() => setIndex(n)}
                className={`h-2 rounded-full transition-all ${n === active ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
