import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import type { AdminProfile } from '../../types/store';

interface AdminAuthGateProps {
  onAuthenticated: (token: string, admin: AdminProfile) => void;
  onBackToStore: () => void;
}

export function AdminAuthGate({
  onAuthenticated,
  onBackToStore,
}: AdminAuthGateProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [ready, setReady] = useState(true);
  const [envConfigured, setEnvConfigured] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data: { ready: boolean; envConfigured: boolean }) => {
        setReady(Boolean(data.ready));
        setEnvConfigured(Boolean(data.envConfigured));
      })
      .catch(() => {
        setError('Unable to check admin portal status.');
      })
      .finally(() => setStatusLoading(false));
  }, []);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Admin password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as {
        token?: string;
        admin?: AdminProfile;
        error?: string;
      };
      if (!res.ok || !data.token || !data.admin) {
        setError(data.error || 'Could not initialize admin account.');
        return;
      }
      onAuthenticated(data.token, data.admin);
    } catch {
      setError('Network error while claiming admin access.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        token?: string;
        admin?: AdminProfile;
        error?: string;
      };
      if (!res.ok || !data.token || !data.admin) {
        setError(data.error || 'Invalid administrator credentials.');
        return;
      }
      onAuthenticated(data.token, data.admin);
    } catch {
      setError('Network error during admin authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={onBackToStore}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-white flex items-center justify-center shrink-0">
              {ready ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Prime Mobile Computer
              </p>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {statusLoading
                  ? 'Admin Portal'
                  : ready
                  ? 'Admin Console Sign In'
                  : 'Claim Store Admin Access'}
              </h1>
            </div>
          </div>

          {statusLoading ? (
            <div className="py-8 text-sm text-slate-500">Checking portal status...</div>
          ) : !ready ? (
            <form onSubmit={handleClaimSubmit} className="space-y-4 mt-4">
              <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-slate-700 leading-relaxed">
                First-time setup: create the primary administrator credential for this store. Once claimed, this setup form locks permanently.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Administrator Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Store Owner"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primemobilecomputer.com"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Admin Password (min 8 chars) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Claiming Admin Access...' : 'Claim Admin Account & Enter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
              <p className="text-xs text-slate-500">
                {envConfigured
                  ? 'Authenticated via server administrator passcode.'
                  : 'Sign in with your administrator email and password. Customer accounts cannot access this portal.'}
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primemobilecomputer.com"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
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
                className="w-full h-11 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Sign In to Admin Console'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
