import { useAuth } from '../context/AuthContext';

// Shown on Profile / Account when nobody is logged in.
export default function LoginPrompt({ message }) {
  const { openAuth } = useAuth();
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900">Please log in</h2>
      <p className="mt-2 text-gray-600">{message}</p>
      <div className="mt-5 flex justify-center gap-3">
        <button className="btn-outline" onClick={() => openAuth('login')}>Log in</button>
        <button className="btn-primary" onClick={() => openAuth('signup')}>Sign up</button>
      </div>
    </div>
  );
}
