import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogOut, Package, User as UserIcon } from 'lucide-react';
import type { Order, UserProfile } from '../types/store';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';

export function AccountPage() {
  const { user, token, setAuthSession, logout, navigate, showToast } = useStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setMyOrders([]);
      return;
    }
    setLoadingOrders(true);
    fetch('/api/orders/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data: { orders?: Order[] }) => setMyOrders(data.orders || []))
      .catch(() => setMyOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [token, user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, phone, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        error?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      setAuthSession(data.token, data.user);
      showToast(
        mode === 'login'
          ? `Welcome back, ${data.user.name}`
          : `Account created for ${data.user.name}`
      );
      setPassword('');
    } catch {
      setError('Unable to reach authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-display text-lg font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                {user.name}
              </h1>
              <p className="text-sm text-slate-500">
                {user.email}
                {user.phone ? ` · ${user.phone}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              <span>Your Orders</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate('catalog')}
              className="text-xs font-medium text-[#1D4ED8] hover:underline"
            >
              Shop New Hardware
            </button>
          </div>

          {loadingOrders ? (
            <p className="text-sm text-slate-500 py-6">Loading order history...</p>
          ) : myOrders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-600">
                You have not placed any orders under this account yet.
              </p>
              <button
                type="button"
                onClick={() => navigate('catalog')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-medium"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myOrders.map((order) => (
                <div
                  key={order.orderNumber}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="font-mono">{order.orderNumber}</span> · {order.status}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'} ·{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {formatPKR(order.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('track', { orderNumber: order.orderNumber })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1D4ED8] text-xs font-medium text-slate-700 hover:text-[#1D4ED8]"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <UserIcon className="w-5 h-5 text-[#1D4ED8]" />
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
          </h1>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          {mode === 'login'
            ? 'Access your saved orders, warranty coverage, and faster checkout.'
            : 'Register for faster checkout and complete order history tracking.'}
        </p>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hamza Tariq"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
