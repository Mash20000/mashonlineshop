import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Price, { discountPercent } from './Price';
import { Stars } from './Stars';

export default function ProductCard({ product, onDelete, onEdit }) {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const out = product.stock <= 0;
  const needsChoice = product.optionGroups?.length > 0;
  const discount = discountPercent(product);

  const handleAdd = () => {
    // products with size / colour / RAM choices are added from the details page
    if (needsChoice) return navigate(`/products/${product._id}`);
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link to={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
            OFFER -{discount}%
          </span>
        )}
        {out && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold text-white">Out of stock</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600">{product.category}</span>
        <Link to={`/products/${product._id}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-brand-700">
          {product.name}
        </Link>
        <Stars value={product.ratingAvg} count={product.ratingCount} size="text-sm" />
        <Price product={product} className="text-lg" />

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex gap-2">
            <button className="btn-primary flex-1 px-2" disabled={out} onClick={handleAdd}>
              {out ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
            </button>
            <Link to={`/products/${product._id}`} className="btn-outline px-3">
              More details
            </Link>
          </div>

          {user?.role === 'admin' && (onEdit || onDelete) && (
            <div className="flex gap-2 border-t pt-2">
              {onEdit && (
                <button className="btn-outline flex-1" onClick={() => onEdit(product)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button className="btn-danger" onClick={() => onDelete(product)}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
