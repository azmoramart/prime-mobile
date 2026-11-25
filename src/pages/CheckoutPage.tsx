import { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  PackageCheck,
  Truck,
  Banknote,
} from 'lucide-react';
import type { Order } from '../types/store';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductImage';

export function CheckoutPage() {
  const {
    getCartDetails,
    cartSubtotal,
    user,
    token,
    clearCart,
    recordOrderNumber,
    refreshCatalog,
    navigate,
  } = useStore();

  const items = getCartDetails();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Pakistan');

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const shippingCost =
    deliveryMethod === 'express' ? 2500 : cartSubtotal >= 25000 ? 0 : 850;
  const tax = Math.round(cartSubtotal * 0.08);
  const total = cartSubtotal + shippingCost + tax;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (digits.length < 12 || !cardExpiry.trim() || cardCvc.trim().length < 3) {
        setError('Please enter valid card details or select Cash on Delivery.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map((d) => d.item),
          deliveryMethod,
          paymentMethod,
          shipping: {
            fullName,
            email,
            phone,
            address,
            city,
            state,
            postalCode,
            country,
          },
        }),
      });

      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || 'Could not place your order. Please verify all fields.');
        return;
      }

      clearCart();
      recordOrderNumber(data.order.orderNumber);
      setPlacedOrder(data.order);
      await refreshCatalog();
    } catch {
      setError('Network error while submitting your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                Order Confirmed
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Order #{placedOrder.orderNumber} Confirmed — Preparing Shipment
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                A confirmation receipt has been prepared for <strong>{placedOrder.shipping.email}</strong>. Tracking code:{' '}
                <span className="font-mono font-semibold text-slate-900">{placedOrder.trackingCode}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-[#FAFAFA] border border-slate-200 text-sm">
            <div>
              <p className="text-xs text-slate-500">Payment Method</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {placedOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Credit / Debit Card'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Carrier & ETA</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {placedOrder.carrier} ({placedOrder.estimatedDelivery})
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                {formatPKR(placedOrder.total)}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {placedOrder.items.map((item) => (
              <div key={item.sku} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {item.name} × {item.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.variantLabel} · SKU {item.sku}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatPKR(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('track', { orderNumber: placedOrder.orderNumber })}
              className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium transition-colors"
            >
              Track Order #{placedOrder.orderNumber}
            </button>
            <button
              type="button"
              onClick={() => navigate('catalog')}
              className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-10">
          <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Your checkout bag is empty
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Add hardware items to your shopping bag before checking out.
          </p>
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="mt-5 px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-medium"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Secure Checkout
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Shipping & Payment
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              1. Customer & Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, apartment, suite"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Province / State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              2. Shipping Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('standard')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  deliveryMethod === 'standard'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#1D4ED8]" />
                    Standard Insured
                  </span>
                  <span className="tabular-nums">
                    {cartSubtotal >= 25000 ? 'Free' : 'PKR 850'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">3–5 business days · Free over PKR 25,000</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('express')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  deliveryMethod === 'express'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#1D4ED8]" />
                    Express Courier
                  </span>
                  <span className="tabular-nums">PKR 2,500</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">1–2 business days · Priority air</p>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              3. Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Credit / Debit Card</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Instant authorization</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Banknote className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Pay courier on arrival</p>
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 pt-2">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 0192 8821 0042"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="08/29"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="412"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">Cash on Delivery Terms</p>
                <p>
                  Total due upon courier arrival:{' '}
                  <strong className="tabular-nums text-slate-900">
                    {formatPKR(total)}
                  </strong>
                  . Free standard delivery applies above PKR 25,000. Our dispatch desk verifies phone & postal code prior to shipment.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Order Summary
          </h2>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {items.map(({ item, product, variantLabel, lineTotal }) => (
              <div key={`${item.productId}-${item.variantId}`} className="py-3 flex items-center gap-3">
                <div className="w-14 h-12 rounded-md overflow-hidden bg-[#F3F4F6] border border-slate-200 shrink-0">
                  <ProductImage
                    category={product.category}
                    imageUrl={product.imageUrl}
                    alt={product.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {variantLabel} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatPKR(lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-slate-900">
                {formatPKR(cartSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="tabular-nums font-medium text-slate-900">
                {shippingCost === 0 ? 'Free' : formatPKR(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (8%)</span>
              <span className="tabular-nums font-medium text-slate-900">
                {formatPKR(tax)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">
                {formatPKR(total)}
              </span>
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
            className="w-full h-11 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>
              {submitting
                ? 'Placing Order...'
                : `Place Order · ${formatPKR(total)}`}
            </span>
          </button>
        </aside>
      </form>
    </div>
  );
}
