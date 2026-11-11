import { NavLink } from 'react-router-dom';
import { useUnread } from '../context/UnreadContext';
import { useAuth } from '../context/AuthContext';

// "Profile" was replaced by "Messages": the chat with the shop (the customer's name and phone are edited in Account).
const links = [
  ['/', 'Home'],
  ['/products', 'Products'],
  ['/about', 'About'],
  ['/messages', 'Messages'],
  ['/account', 'Account'],
];

// The admin sees "Store" (the shop analyser) instead of "Messages"; customer chats are in Account > Customer messages.
const adminLinks = links.map((l) => (l[0] === '/messages' ? ['/store', 'Store'] : l));

export default function Navbar() {
  const { chat, notes } = useUnread();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const badge = isAdmin ? { Account: notes + chat } : { Messages: chat, Account: notes };

  return (
    <nav className="bg-brand-600 text-white">
      <div className="mx-auto flex max-w-6xl overflow-x-auto px-2">
        {(isAdmin ? adminLinks : links).map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-brand-700' : 'hover:bg-brand-500'}`
            }
          >
            {label}
            {badge[label] > 0 && (
              <span className="ml-1.5 rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-brand-700">{badge[label]}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
