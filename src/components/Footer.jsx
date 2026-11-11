import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-semibold text-gray-700">Mash Online Shop</span>
        </div>
        <div className="flex gap-5 text-sm text-gray-600">
          <Link to="/products" className="hover:text-brand-700">Products</Link>
          <Link to="/about" className="hover:text-brand-700">About</Link>
          <Link to="/messages" className="hover:text-brand-700">Chat with us</Link>
        </div>
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Mash Online Shop</p>
      </div>
    </footer>
  );
}
