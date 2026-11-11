import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';
import NotificationSettings from '../components/NotificationSettings';
import ChangePassword from '../components/ChangePassword';
import UserAccount from './UserAccount';
import AdminDashboard from './AdminDashboard';

export default function Account() {
  const { user, loading } = useAuth();

  if (loading) return <p className="py-16 text-center text-gray-500">Loading...</p>;
  if (!user) return <LoginPrompt message="Log in to see your account, orders and notifications." />;

  return (
    <>
      <NotificationSettings />
      <ChangePassword />
      {user.role === 'admin' ? <AdminDashboard /> : <UserAccount />}
    </>
  );
}
