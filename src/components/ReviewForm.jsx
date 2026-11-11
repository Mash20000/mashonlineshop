import { useState } from 'react';
import api, { errMsg } from '../api';
import { StarInput } from './Stars';

// Rating + feedback for a delivered product. Also used to edit an earlier review.
export default function ReviewForm({ productId, existing, onSaved }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please choose a star rating');
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post(`/reviews/product/${productId}`, { rating, comment });
      onSaved?.(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Your rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="label">Feedback (optional)</label>
        <textarea
          className="input"
          rows="3"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others what you think of this product"
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? 'Saving...' : existing ? 'Update review' : 'Submit review'}
      </button>
    </form>
  );
}
