// Read-only star rating, e.g. <Stars value={4.3} count={12} />
export function Stars({ value = 0, count, size = 'text-base' }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size}`} aria-label={`${value} out of 5 stars`}>
      <span className="tracking-tight">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? 'text-amber-400' : 'text-gray-300'}>
            &#9733;
          </span>
        ))}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">
          {count > 0 ? `${value} (${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  );
}

// Clickable stars for the review form
export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`text-3xl leading-none transition hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-300'}`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
