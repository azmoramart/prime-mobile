import { useState } from 'react';
import { MessageCircle, X, ExternalLink, Send, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const SUPPORT_TOPICS = [
  'Product Advice',
  'Order Tracking',
  'Custom PC Quote',
  'Warranty & Returns',
] as const;

const WHATSAPP_NUMBER = '15550192834';

export function WhatsAppSupport() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>(SUPPORT_TOPICS[0]);
  const [message, setMessage] = useState(
    'Hi Prime Mobile Computer team, I need assistance with a product inquiry.'
  );
  const [contactEmail, setContactEmail] = useState('');
  const [sentTicket, setSentTicket] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `[${topic}] ${message}`
  )}`;

  const handleQuickCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name || 'WhatsApp Desk Visitor',
          email: user?.email || contactEmail || 'support-visitor@example.com',
          topic: `WhatsApp Desk · ${topic}`,
          message,
        }),
      });
      const data = (await res.json()) as { ticketId?: string };
      if (res.ok && data.ticketId) {
        setSentTicket(data.ticketId);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div
          className="mb-3 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          role="dialog"
          aria-label="WhatsApp Hardware Support"
        >
          <div className="bg-[#0F172A] text-white px-4 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold">
                WhatsApp Support Desk
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Sales & Technical Specialists · Mon–Sat
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp support"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1.5">
                Select topic
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SUPPORT_TOPICS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTopic(item);
                      setSentTicket(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-colors ${
                      topic === item
                        ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleQuickCallback} className="space-y-2.5">
              {!user && (
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Your email for desk reply"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              )}
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none"
                placeholder="Ask about compatibility, stock, or order status..."
              />

              {sentTicket && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Desk ticket <strong>{sentTicket}</strong> logged. A specialist will reply shortly.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Chat</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending...' : 'Send Direct Desk Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp Support"
        className="h-11 px-4 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp Support</span>
      </button>
    </div>
  );
}
