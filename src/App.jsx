import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UnreadProvider } from './context/UnreadContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import About from './pages/About';
import Messages from './pages/Messages';
import Account from './pages/Account';
import Cart from './pages/Cart';
import Store from './pages/Store';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0); // braces on purpose: an effect must not return anything but a clean-up function
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <Link to="/" className="btn-primary mt-5">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <UnreadProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="about" element={<About />} />
              <Route path="messages" element={<Messages />} />
              <Route path="profile" element={<Messages />} />
              <Route path="account" element={<Account />} />
              <Route path="cart" element={<Cart />} />
              <Route path="store" element={<Store />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UnreadProvider>
      </CartProvider>
    </AuthProvider>
  );
}
