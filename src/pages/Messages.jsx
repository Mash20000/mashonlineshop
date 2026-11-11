import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';
import UserChat from '../components/UserChat';
import AdminChat from '../components/AdminChat';

// Replaces the old Profile page: the customer's chat with the shop (or the admin's customer chats).
export default function Messages() {
  const { user, loading } = useAuth();

  if (loading) return <p className="py-16 text-center text-gray-500">Loading...</p>;
  if (!user) return <LoginPrompt message="Log in to chat with the shop." />;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Messages</h1>
      {user.role === 'admin' ? <AdminChat /> : <UserChat />}
    </div>
  );
}
