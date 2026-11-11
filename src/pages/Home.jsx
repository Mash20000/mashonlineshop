import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';

const perks = [
  ['Pay with M-Pesa', 'Get an STK push straight to your phone at checkout.'],
  ['Order updates', 'Delivery messages appear in your Account page.'],
  ['Chat with us', 'Use the chat button to message the shop anytime.'],
];

export default function Home() {
  const [latest, setLatest] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products', { params: { sort: 'newest', limit: 8 } }),
      api.get('/products', { params: { offer: 'true', sort: 'newest', limit: 4 } }),
    ])
      .then(([l, o]) => {
        setLatest(l.data.products);
        setOffers(o.data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Slider: the last 4 products added, then products on offer
  const slides = useMemo(() => {
    const newest = latest.slice(0, 4);
    const ids = new Set(newest.map((p) => p._id));
    return [...newest, ...offers.filter((p) => !ids.has(p._id))];
  }, [latest, offers]);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-brand-100 shadow-sm ring-1 ring-brand-100">
        <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:p-12">
          <div>
            <span className="badge bg-brand-100 text-brand-700">Welcome</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
              Welcome to <span className="text-brand-600">Mash Online Shop</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-gray-600">
              Great products, simple ordering and secure M-Pesa payments. Browse the shop, add what you like to your cart
              and we will take care of the rest.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary px-6 py-3 text-base">
                Shop now
              </Link>
              <Link to="/about" className="btn-outline px-6 py-3 text-base">
                About us
              </Link>
            </div>
          </div>

          {slides.length ? (
            <HeroSlider slides={slides} />
          ) : (
            <div className="mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-3xl bg-brand-100 text-center text-brand-700">
              <p className="px-8 font-medium">{loading ? 'Loading...' : 'Products will appear here once they are added.'}</p>
            </div>
          )}
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Special offers <span className="text-red-600">%</span>
              </h2>
              <p className="text-gray-500">Limited-time prices</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-brand-700 hover:underline">
              View all products &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {offers.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New arrivals</h2>
            <p className="text-gray-500">Freshly added to the shop</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-brand-700 hover:underline">
            View all products &rarr;
          </Link>
        </div>

        {latest.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <p className="card p-8 text-center text-gray-500">{loading ? 'Loading products...' : 'No products yet.'}</p>
        )}
      </section>

      {/* Perks */}
      <section className="grid gap-4 md:grid-cols-3">
        {perks.map(([title, text]) => (
          <div key={title} className="card p-5">
            <h3 className="font-semibold text-brand-700">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
