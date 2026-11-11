export const money = (n) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export const shortId = (id) => String(id).slice(-6).toUpperCase();

export const dateTime = (d) =>
  new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

export const timeOnly = (d) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

// "Size: M, Color: Red" from { Size: 'M', Color: 'Red' }
export const optionsLabel = (options = {}) =>
  Object.entries(options)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

// Same thing from the order format [{ name: 'Size', value: 'M' }]
export const chosenLabel = (chosen = []) => chosen.map((o) => `${o.name}: ${o.value}`).join(', ');

export const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-KE', { dateStyle: 'medium' });
};

export const unique = (list) => [...new Set(list)];
