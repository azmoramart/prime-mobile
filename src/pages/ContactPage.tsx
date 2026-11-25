import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function ContactPage() {
  const { user } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [topic, setTopic] = useState('Sales & Product Availability');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await res.json()) as { ticketId?: string; error?: string };
      if (!res.ok || !data.ticketId) {
        setError(data.error || 'Unable to send message.');
        return;
      }
      setTicketId(data.ticketId);
      setMessage('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Showroom & Support Desk
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Contact Prime Mobile Computer
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Reach our hardware specialists for custom workstation quotes, bulk enterprise orders, warranty claims, or product compatibility checks.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Store & Service Center
            </h2>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Flagship Showroom</p>
                  <p>740 Innovation Way, Suite 100, San Francisco, CA 94107</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Telephone & Sales</p>
                  <p className="tabular-nums">+1 (555) 019-2834</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Email Support</p>
                  <p>support@primemobilecomputer.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Hours of Operation</p>
                  <p>Mon – Sat: 9:00 AM – 7:00 PM · Sun: 11:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href="https://wa.me/15550192834?text=Hello%20Prime%20Mobile%20Computer%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-slate-900 mb-4">
            Send a Message
          </h2>

          {ticketId && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Inquiry received · Ticket {ticketId}
                </p>
                <p className="text-xs mt-0.5">
                  Our specialist team typically responds within 2 business hours.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
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
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department / Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="Sales & Product Availability">Sales & Product Availability</option>
                <option value="Custom PC & Workstation Quote">Custom PC & Workstation Quote</option>
                <option value="Order Status & Shipping">Order Status & Shipping</option>
                <option value="Warranty & Technical Repair">Warranty & Technical Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message *
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about the hardware, order number, or configuration you need help with..."
                className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-y"
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
              className="h-11 px-6 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
