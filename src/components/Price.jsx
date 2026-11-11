import { money } from '../utils/format';

// Shows the normal price, or the new price with the old one struck through while the product is on offer.
export default function Price({ product, className = '' }) {
  const current = product.currentPrice ?? product.price;
  const onOffer = product.onOffer && current < product.price;

  if (!onOffer) return <span className={`font-bold text-gray-900 ${className}`}>{money(product.price)}</span>;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-bold text-red-600">{money(current)}</span>
      <span className="text-[0.75em] font-normal text-gray-400 line-through">{money(product.price)}</span>
    </span>
  );
}

export const discountPercent = (product) => {
  const current = product.currentPrice ?? product.price;
  return product.onOffer && current < product.price ? Math.round((1 - current / product.price) * 100) : 0;
};
