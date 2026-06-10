import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, ProtectedRoute } from './components/Layout';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminLogin from './pages/Admin/Login';
import AdminSetup from './pages/Admin/Setup';
import UpdatePassword from './pages/Admin/UpdatePassword';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="admin/setup" element={<AdminSetup />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/update-password" element={<UpdatePassword />} />
            
            <Route path="checkout" element={<Checkout />} />
            <Route path="wishlist" element={<Wishlist />} />

            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
    </ErrorBoundary>
  );
}
