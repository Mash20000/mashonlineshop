import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

// Ready-made option groups the admin can add with one click.
// "Quantity" needs no option: it is the Stock field below, and the customer picks how many they want.
const PRESETS = {
  Size: 'S, M, L, XL',
  Color: 'Black, White, Red, Blue',
  RAM: '4GB, 8GB, 16GB',
  Storage: '64GB, 128GB, 256GB',
};

const toRows = (groups = []) => groups.map((g) => ({ name: g.name, values: g.values.join(', ') }));

// Admin only. Used both to add a new product (no `product` prop) and to edit an existing one.
export default function AdminProductForm({ product, categories, onSaved, onCancel }) {
  const editing = Boolean(product);

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '1',
    costPrice: product?.costPrice != null ? String(product.costPrice) : '',
    onOffer: Boolean(product?.onOffer),
    offerPrice: product?.offerPrice ? String(product.offerPrice) : '',
  });
  const [rows, setRows] = useState(toRows(product?.optionGroups));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product?.image || '');
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(
    () => () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFile = (e) => {
    const chosen = e.target.files?.[0] || null;
    setFile(chosen);
    setPreview(chosen ? URL.createObjectURL(chosen) : product?.image || '');
  };

  const addRow = (name = '') => {
    if (name && rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) return;
    setRows((r) => [...r, { name, values: PRESETS[name] || '' }]);
  };
  const updateRow = (i, key, value) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!editing && !file) return setError('Please choose a product image');

    const price = Number(form.price);
    if (form.onOffer && !(Number(form.offerPrice) > 0 && Number(form.offerPrice) < price)) {
      return setError('The offer price must be lower than the normal price');
    }

    const groups = rows
      .map((r) => ({
        name: r.name.trim(),
        values: r.values
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((g) => g.name && g.values.length);

    const data = new FormData();
    ['name', 'category', 'description', 'price', 'stock', 'costPrice'].forEach((key) => data.append(key, form[key]));
    data.append('onOffer', form.onOffer ? 'true' : 'false');
    data.append('offerPrice', form.onOffer ? form.offerPrice : '');
    data.append('options', JSON.stringify(groups));
    if (file) data.append('image', file);

    setBusy(true);
    try {
      const res = editing ? await api.put(`/products/${product._id}`, data) : await api.post('/products', data);
      if (editing) {
        onSaved?.(res.data);
        return;
      }
      setSuccess(`"${res.data.name}" was added to the shop`);
      setForm({ name: '', category: '', description: '', price: '', stock: '1', costPrice: '', onOffer: false, offerPrice: '' });
      setRows([]);
      setFile(null);
      setPreview('');
      setFileKey((k) => k + 1);
      onSaved?.(res.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mb-8 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{editing ? `Edit "${product.name}"` : 'Add a new product'}</h2>
        {editing && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div>
          <label className="label">Product image</label>
          <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500 hover:border-brand-500">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-3">Click to choose an image (max 5 MB)</span>
            )}
            <input key={fileKey} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          {editing && <p className="mt-1 text-xs text-gray-500">Choose a new image only if you want to replace it.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" list="admin-categories" value={form.category} onChange={set('category')} required />
            <datalist id="admin-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Price (KES)</label>
            <input type="number" min="1" step="1" className="input" value={form.price} onChange={set('price')} required />
          </div>
          <div>
            <label className="label">Cost price (KES, what you paid)</label>
            <input type="number" min="0" step="1" className="input" value={form.costPrice} onChange={set('costPrice')} placeholder="Optional, only you see it" />
            <p className="mt-1 text-xs text-gray-500">Used by the Store page to calculate your real profit.</p>
          </div>
          <div>
            <label className="label">Stock (quantity available)</label>
            <input type="number" min="0" step="1" className="input" value={form.stock} onChange={set('stock')} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows="3" className="input" value={form.description} onChange={set('description')} required />
          </div>

          {/* Offer */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 font-medium text-gray-800">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-600"
                checked={form.onOffer}
                onChange={(e) => setForm((f) => ({ ...f, onOffer: e.target.checked }))}
              />
              This product is on offer
            </label>
            {form.onOffer && (
              <div className="mt-3 max-w-xs">
                <label className="label">Offer price (KES)</label>
                <input type="number" min="1" step="1" className="input" value={form.offerPrice} onChange={set('offerPrice')} required />
                <p className="mt-1 text-xs text-gray-500">Customers will see the normal price crossed out.</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
            <p className="font-medium text-gray-800">Options customers can choose</p>
            <p className="text-xs text-gray-500">Size for clothes, colour, RAM or storage for phones and laptops. Leave empty if there is nothing to choose.</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Quick add:</span>
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addRow(name)}
                  disabled={rows.some((r) => r.name.toLowerCase() === name.toLowerCase())}
                  className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                >
                  + {name}
                </button>
              ))}
              <button type="button" onClick={() => addRow('')} className="rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-white">
                + Other
              </button>
            </div>

            {rows.length > 0 && (
              <div className="mt-3 space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                    <input
                      className="input"
                      placeholder="Option (e.g. Size)"
                      value={row.name}
                      onChange={(e) => updateRow(i, 'name', e.target.value)}
                      maxLength={30}
                    />
                    <input
                      className="input"
                      placeholder="Values separated by commas (e.g. S, M, L)"
                      value={row.values}
                      onChange={(e) => updateRow(i, 'values', e.target.value)}
                    />
                    <button type="button" className="btn-danger" onClick={() => removeRow(i)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
