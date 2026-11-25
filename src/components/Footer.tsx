import { useStore } from '../context/StoreContext';

export function Footer() {
  const { categories, navigate } = useStore();

  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="font-display text-lg font-bold text-slate-900"
            >
              Prime Mobile Computer
            </button>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Authorized retailer for desktop workstations, laptops, mobile phones, studio audio, peripherals, and precision PC components.
            </p>
            <div className="text-xs text-slate-500 space-y-1 pt-2">
              <p>Showroom: 740 Innovation Way, Suite 100</p>
              <p>Support Desk: +1 (555) 019-2834 · support@primemobilecomputer.com</p>
            </div>
          </div>

          <div className="md:col-span-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Store Departments ({categories.length})
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => navigate('catalog', { category })}
                  className="text-left hover:text-[#1D4ED8] transition-colors truncate"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Customer Service
            </h3>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <button
                type="button"
                onClick={() => navigate('track')}
                className="text-left hover:text-[#1D4ED8] transition-colors"
              >
                Track Your Order
              </button>
              <button
                type="button"
                onClick={() => navigate('account')}
                className="text-left hover:text-[#1D4ED8] transition-colors"
              >
                Customer Account & Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('wishlist')}
                className="text-left hover:text-[#1D4ED8] transition-colors"
              >
                Saved Wishlist
              </button>
              <button
                type="button"
                onClick={() => navigate('checkout')}
                className="text-left hover:text-[#1D4ED8] transition-colors"
              >
                Checkout & COD Terms
              </button>
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="text-left hover:text-[#1D4ED8] transition-colors"
              >
                Contact & Showroom Hours
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Prime Mobile Computer. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Insured Shipping · Official OEM Warranties · Direct WhatsApp Desk</span>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
