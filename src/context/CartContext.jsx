import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'mash_cart';

// The same product with different choices (e.g. size M and size L) is a separate cart line.
export const lineKey = (id, options = {}) =>
  `${id}|${Object.keys(options)
    .sort()
    .map((k) => `${k}:${options[k]}`)
    .join(';')}`;

const readStored = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY)) || [];
    // carts saved by the older version have no key / options
    return stored.map((i) => ({ ...i, options: i.options || {}, key: i.key || lineKey(i._id, i.options || {}) }));
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const add = useCallback((product, qty = 1, options = {}) => {
    const max = product.stock ?? 99;
    if (max <= 0) return;
    const key = lineKey(product._id, options);
    const price = product.currentPrice ?? product.price;

    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, price, regularPrice: product.price, stock: max, qty: Math.min(i.qty + qty, max) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          _id: product._id,
          name: product.name,
          category: product.category,
          price,
          regularPrice: product.price,
          image: product.image,
          stock: max,
          qty: Math.min(qty, max),
          options,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.stock ?? 99)) } : i)));
  }, []);

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  // Refresh prices, offers and stock from the shop (called when the cart page opens)
  const sync = useCallback((products, askedIds) => {
    const byId = new Map(products.map((p) => [p._id, p]));
    setItems((prev) =>
      prev.flatMap((i) => {
        if (!askedIds.includes(i._id)) return [i];
        const p = byId.get(i._id);
        if (!p) return []; // product was removed from the shop
        return [
          {
            ...i,
            name: p.name,
            category: p.category,
            image: p.image,
            price: p.currentPrice ?? p.price,
            regularPrice: p.price,
            stock: p.stock,
            soldOut: p.stock <= 0,
            qty: p.stock > 0 ? Math.min(i.qty, p.stock) : i.qty,
          },
        ];
      })
    );
  }, []);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, sync, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
