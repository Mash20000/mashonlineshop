import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';
import AuthModal from './AuthModal';
import FloatingChat from './FloatingChat';
import PushSetup from './PushSetup';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky: the logo, login buttons, cart icon and menu stay visible while scrolling */}
      <div className="sticky top-0 z-40 shadow-sm">
        <Header />
        <Navbar />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <PushSetup />
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
      <AuthModal />
    </div>
  );
}
