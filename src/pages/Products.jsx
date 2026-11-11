import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import AdminProductForm from '../components/AdminProductForm';

const initialFilters = { q: '', category: '', sort: 'newest' };

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [form, setForm] = useState(initialFilters); // what the person is typing
  const [filters, setFilters] = useState(initialFilters); // what was searched
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [params, setParams] = useSearchParams();
  const formRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get('/products', { params: { ...filters, page, limit: 12 } })
      .then((res) => setData(res.data))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const loadCategories = useCallback(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);
  useEffect(loadCategories, [loadCategories]);

  // /products?edit=<id> (from the Store page) opens that product in the edit form
  const editId = params.get('edit');
  useEffect(() => {
    if (!editId || !isAdmin) return;
    api
      .get(`/products/${editId}`)
      .then((res) => setEditing(res.data))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setParams({}, { replace: true }));
  }, [editId, isAdmin, setParams]);

  // Bring the edit form into view when the admin clicks Edit
  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(form);
  };

  const clearFilters = () => {
    setForm(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}" from the shop?`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      if (editing?._id === product._id) setEditing(null);
      load();
      loadCategories();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const filtering = filters.q || filters.category;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">
            {data.total} item{data.total === 1 ? '' : 's'} {filtering ? 'found' : 'in the shop'}
          </p>
        </div>
        {isAdmin && !editing && (
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close form' : '+ Add product'}
          </button>
        )}
      </div>

      <div ref={formRef} className="scroll-mt-40">
        {notice && <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

        {isAdmin && editing && (
          <AdminProductForm
            key={editing._id}
            product={editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              setEditing(null);
              setNotice(`"${saved.name}" was updated`);
              setTimeout(() => setNotice(''), 4000);
              load();
              loadCategories();
            }}
          />
        )}

        {isAdmin && !editing && showForm && (
          <AdminProductForm
            key="new"
            categories={categories}
            onSaved={() => {
              load();
              loadCategories();
            }}
          />
        )}
      </div>

      <form onSubmit={search} className="card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <input className="input" placeholder="Search products..." value={form.q} onChange={set('q')} aria-label="Search products" />
        <div>
          <input
            className="input"
            list="category-options"
            placeholder="Category"
            value={form.category}
            onChange={set('category')}
            aria-label="Category"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <select className="input" value={form.sort} onChange={set('sort')} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A-Z</option>
        </select>
        <div className="flex gap-2">
          <button className="btn-primary">Search</button>
          {(filtering || form.q || form.category) && (
            <button type="button" className="btn-outline" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </form>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading products...</p>
      ) : data.products.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.products.map((p) => (
            <ProductCard key={p._id} product={p} onDelete={handleDelete} onEdit={(product) => setEditing(product)} />
          ))}
        </div>
      ) : (
        <p className="card p-10 text-center text-gray-500">
          {filtering ? 'No products match your search. Try another word or category.' : 'No products in the shop yet.'}
        </p>
      )}

      {data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            &larr; Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.pages}
          </span>
          <button className="btn-outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
