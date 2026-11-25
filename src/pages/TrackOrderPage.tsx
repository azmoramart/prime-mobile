import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, PackageSearch, Search, Truck } from 'lucide-react';
import type { Order } from '../types/store';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';

const SAMPLE_NUMBERS = ['PMC-1042', 'PMC-1045', 'PMC-1038'];

export function TrackOrderPage() {
  const { trackOrderQuery, recentOrderNumbers } = useStore();
  const [inputOrder, setInputOrder] = useState(trackOrderQuery || 'PMC-1042');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupOrder = async (orderNum: string) => {
    const clean = orderNum.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(clean)}`);
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setOrder(null);
        setError(data.error || 'Order not found.');
        return;
      }
      setOrder(data.order);
    } catch {
      setError('Unable to reach order tracking service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = trackOrderQuery || recentOrderNumbers[0] || 'PMC-1042';
    setInputOrder(initial);
    lookupOrder(initial);
  }, [trackOrderQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(inputOrder);
  };

  const quickNumbers = Array.from(
    new Set([...recentOrderNumbers, ...SAMPLE_NUMBERS])
  ).slice(0, 5);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Real-Time Fulfillment
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Order Tracking
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Enter your Prime Mobile Computer order number to view inspection, dispatch, and courier milestones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={inputOrder}
            onChange={(e) => setInputOrder(e.target.value)}
            placeholder="Enter Order ID (e.g. PMC-1042)"
            aria-label="Order Number"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Lookup examples:</span>
        {quickNumbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => {
              setInputOrder(num);
              lookupOrder(num);
            }}
            className="font-mono px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors"
          >
            {num}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-8 bg-white border border-rose-200 rounded-xl p-6 flex items-center gap-3 text-sm text-rose-700">
          <PackageSearch className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500">
                  Order <span className="font-mono font-semibold text-slate-800">{order.orderNumber}</span> · Carrier Tracking{' '}
                  <span className="font-mono text-slate-700">{order.trackingCode}</span>
                </p>
                <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
                  {order.status}
                </h2>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-500">Estimated Delivery</p>
                <p className="text-sm font-semibold text-[#1D4ED8] mt-0.5 flex items-center sm:justify-end gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>{order.estimatedDelivery}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {order.timeline.map((step) => (
                <div key={step.label} className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {step.completed ? (
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          step.current ? 'text-[#1D4ED8]' : 'text-emerald-600'
                        }`}
                      />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          step.completed ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-2 text-sm">
              <h3 className="font-display text-base font-semibold text-slate-900 mb-2">
                Delivery Details
              </h3>
              <p className="font-medium text-slate-900">{order.shipping.fullName}</p>
              <p className="text-slate-600">
                {order.shipping.city}
                {order.shipping.state ? `, ${order.shipping.state}` : ''} {order.shipping.postalCode}
              </p>
              <p className="text-slate-600">{order.shipping.country}</p>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>Carrier: {order.carrier}</p>
                <p>
                  Payment:{' '}
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid by Card'}
                </p>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-display text-base font-semibold text-slate-900 mb-3">
                Items in Shipment
              </h3>
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.sku} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.variantLabel} · {item.sku}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatPKR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Order Total</span>
                <span className="tabular-nums">
                  {formatPKR(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
