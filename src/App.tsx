import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppSupport } from './components/WhatsAppSupport';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AccountPage } from './pages/AccountPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function StoreShell() {
  const { page, selectedProductSlug, toastMessage } = useStore();

  if (page === 'admin') {
    return (
      <>
        <AdminDashboardPage />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg bg-[#0F172A] text-white text-xs font-medium shadow-lg border border-slate-700"
          >
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0F172A]">
      <Header />

      <main className="flex-1">
        {page === 'home' && <HomePage />}
        {page === 'catalog' && <CatalogPage />}
        {page === 'product' && <ProductDetailPage key={selectedProductSlug || 'default'} />}
        {page === 'wishlist' && <WishlistPage />}
        {page === 'checkout' && <CheckoutPage />}
        {page === 'track' && <TrackOrderPage />}
        {page === 'account' && <AccountPage />}
        {page === 'contact' && <ContactPage />}
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppSupport />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-lg bg-[#0F172A] text-white text-xs font-medium shadow-lg border border-slate-700"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <StoreShell />
    </StoreProvider>
  );
}

export default App;
