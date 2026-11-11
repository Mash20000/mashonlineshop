import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';

// Round chat button, bottom-right of every page. Opens the messages page.
export default function FloatingChat() {
  const { user } = useAuth();
  const { chat } = useUnread();
  const { pathname } = useLocation();

  // The admin reads chats from Messages / Account, and there is no need for the button on the chat page itself
  if (user?.role === 'admin' || pathname.startsWith('/messages')) return null;

  return (
    <Link
      to="/messages"
      aria-label="Chat with the shop"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:scale-105 hover:bg-brand-700"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h8M8 14h5m-9 6l1.6-3.4A8 8 0 1 1 8.4 19.4L4 20z"
        />
      </svg>
      {chat > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand-700 shadow">
          {chat}
        </span>
      )}
    </Link>
  );
}
