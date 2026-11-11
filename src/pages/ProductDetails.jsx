import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Price, { discountPercent } from '../components/Price';
import { Stars } from '../components/Stars';
import ReviewForm from '../components/ReviewForm';
import { dateTime } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});
  const [pickError, setPickError] = useState('');
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState({ avg: 0, count: 0, distribution: [], reviews: [] });
  const [eligibility, setEligibility] = useState({ canReview: false, review: null });
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setQty(1);
    setSelected({});
    setPickError('');
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const loadReviews = useCallback(() => {
    api
      .get(`/reviews/product/${id}`)
      .then((res) => setReviews(res.data))
      .catch(() => {});
    if (user && user.role !== 'admin') {
      api
        .get(`/reviews/product/${id}/eligibility`)
        .then((res) => setEligibility(res.data))
        .catch(() => {});
    } else {
      setEligibility({ canReview: false, review: null });
    }
  }, [id, user]);

  useEffect(loadReviews, [loadReviews]);

  if (loading) return <p className="py-16 text-center text-gray-500">Loading...</p>;
  if (notFound || !product) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-bold">Product not found</h2>
        <Link to="/products" className="btn-primary mt-4">Back to products</Link>
      </div>
    );
  }

  const out = product.stock <= 0;
  const discount = discountPercent(product);
  const groups = product.optionGroups || [];

  // Every option (size, colour, RAM...) must be chosen first
  const missingGroup = () => groups.find((g) => !selected[g.name]);

  const addToCart = () => {
    const missing = missingGroup();
    if (missing) {
      setPickError(`Please choose a ${missing.name.toLowerCase()}`);
      return false;
    }
    setPickError('');
    add(product, qty, selected);
    return true;
  };

  const handleAdd = () => {
    if (!addToCart()) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (addToCart()) navigate('/cart');
  };

  const maxStar = Math.max(1, ...reviews.distribution.map((d) => d.count));

  // Admin only: remove a review / feedback
  const deleteReview = async (review) => {
    if (!window.confirm(`Delete ${review.name}'s review?`)) return;
    try {
      await api.delete(`/reviews/${review._id}`);
      loadReviews();
      api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => {});
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete the review');
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <Link to="/products" className="text-sm font-medium text-brand-700 hover:underline">
          &larr; Back to products
        </Link>

        <div className="card mt-4 grid gap-8 overflow-hidden p-5 md:grid-cols-2 md:p-8">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {discount > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow">
                OFFER -{discount}%
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium uppercase tracking-wide text-brand-600">{product.category}</span>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>
            <a href="#reviews" className="mt-2 inline-block">
              <Stars value={product.ratingAvg} count={product.ratingCount} />
            </a>
            <Price product={product} className="mt-3 text-3xl" />
            <p className="mt-4 whitespace-pre-line text-gray-600">{product.description}</p>

            <p className={`mt-4 text-sm font-medium ${out ? 'text-red-600' : 'text-green-700'}`}>
              {out ? 'Out of stock' : `${product.stock} in stock`}
            </p>

            {!out && groups.length > 0 && (
              <div className="mt-4 space-y-4">
                {groups.map((group) => (
                  <div key={group.name}>
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      {group.name}
                      {selected[group.name] && <span className="ml-2 font-normal text-gray-500">{selected[group.name]}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map((value) => {
                        const active = selected[group.name] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelected((s) => ({ ...s, [group.name]: value }));
                              setPickError('');
                            }}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                              active
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-500'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pickError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pickError}</p>}

            {!out && (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                    &minus;
                  </button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase">
                    +
                  </button>
                </div>
                <button className="btn-primary px-6 py-3" onClick={handleAdd}>
                  {added ? 'Added ✓' : 'Add to cart'}
                </button>
                <button className="btn-outline px-6 py-3" onClick={handleBuyNow}>
                  Buy now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ratings and feedback */}
      <section id="reviews" className="scroll-mt-40">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Ratings &amp; feedback</h2>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="card h-fit p-5">
            <p className="text-5xl font-extrabold text-gray-900">{reviews.count ? reviews.avg : '-'}</p>
            <Stars value={reviews.avg} size="text-xl" />
            <p className="mt-1 text-sm text-gray-500">
              {reviews.count} review{reviews.count === 1 ? '' : 's'}
            </p>
            <div className="mt-4 space-y-1.5">
              {reviews.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-3">{d.star}</span>
                  <span className="text-amber-400">&#9733;</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.count / maxStar) * 100}%` }} />
                  </div>
                  <span className="w-5 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {user && eligibility.canReview && (
              <div className="card p-5">
                <h3 className="mb-3 font-semibold text-gray-900">
                  {eligibility.review && !editingReview ? 'Your review' : 'Rate this product'}
                </h3>
                {eligibility.review && !editingReview ? (
                  <div>
                    <Stars value={eligibility.review.rating} />
                    {eligibility.review.comment && <p className="mt-1 text-gray-700">{eligibility.review.comment}</p>}
                    <button className="mt-2 text-sm font-medium text-brand-700 hover:underline" onClick={() => setEditingReview(true)}>
                      Edit my review
                    </button>
                  </div>
                ) : (
                  <ReviewForm
                    productId={product._id}
                    existing={eligibility.review}
                    onSaved={() => {
                      setEditingReview(false);
                      loadReviews();
                      api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => {});
                    }}
                  />
                )}
              </div>
            )}

            {reviews.reviews.length ? (
              reviews.reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                        {r.name[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        <Stars value={r.rating} size="text-sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{dateTime(r.createdAt)}</span>
                      {user?.role === 'admin' && (
                        <button className="btn-danger px-2 py-1 text-xs" onClick={() => deleteReview(r)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 whitespace-pre-line text-gray-700">{r.comment}</p>}
                </div>
              ))
            ) : (
              <p className="card p-8 text-center text-gray-500">
                No reviews yet. Customers can rate a product after their order has been delivered.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
