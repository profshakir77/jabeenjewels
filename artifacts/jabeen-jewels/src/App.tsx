import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Customer Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import ProductDetail from './pages/customer/ProductDetail';
import Category from './pages/customer/Category';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import Search from './pages/customer/Search';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminBanners from './pages/admin/Banners';
import NotFound from '@/pages/not-found';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Customer Routes */}
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-success/:id" component={OrderSuccess} />
      <Route path="/search" component={Search} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/admin/products" component={() => <ProtectedRoute component={AdminProducts} />} />
      <Route path="/admin/products/new" component={() => <ProtectedRoute component={ProductForm} />} />
      <Route path="/admin/products/:id/edit" component={() => <ProtectedRoute component={ProductForm} />} />
      <Route path="/admin/categories" component={() => <ProtectedRoute component={AdminCategories} />} />
      <Route path="/admin/orders" component={() => <ProtectedRoute component={AdminOrders} />} />
      <Route path="/admin/banners" component={() => <ProtectedRoute component={AdminBanners} />} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
