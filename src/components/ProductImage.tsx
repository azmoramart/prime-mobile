import { useState } from 'react';
import { MonitorSpeaker, Package } from 'lucide-react';
import type { Category } from '../types/store';
import { resolveProductImageSrc } from '../data/productImages';

interface ProductImageProps {
  category: Category;
  imageUrl?: string;
  alt: string;
  className?: string;
}

export function ProductImage({
  category,
  imageUrl,
  alt,
  className = '',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveProductImageSrc(category, imageUrl);

  if (!src || failed) {
    if (category === 'Speakers') {
      return (
        <div
          className={`w-full h-full bg-gradient-to-br from-[#F4F3EF] via-[#ECEAE4] to-[#E2DFD7] flex flex-col items-center justify-center p-6 select-none ${className}`}
          role="img"
          aria-label={alt}
        >
          <svg
            viewBox="0 0 240 160"
            className="w-4/5 max-w-[200px] h-auto drop-shadow-sm"
            aria-hidden="true"
          >
            <ellipse cx="120" cy="140" rx="90" ry="8" fill="#0F172A" fillOpacity="0.12" />
            <rect x="40" y="26" width="66" height="108" rx="8" fill="#1E293B" />
            <rect x="44" y="30" width="58" height="100" rx="5" fill="#273244" />
            <circle cx="73" cy="54" r="10" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="73" cy="54" r="4" fill="#94A3B8" />
            <circle cx="73" cy="94" r="22" fill="#0F172A" stroke="#475569" strokeWidth="2" />
            <circle cx="73" cy="94" r="14" fill="#1E293B" />
            <circle cx="73" cy="94" r="6" fill="#64748B" />
            <circle cx="73" cy="123" r="2" fill="#1D4ED8" />
            <rect x="134" y="26" width="66" height="108" rx="8" fill="#1E293B" />
            <rect x="138" y="30" width="58" height="100" rx="5" fill="#273244" />
            <circle cx="167" cy="54" r="10" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="167" cy="54" r="4" fill="#94A3B8" />
            <circle cx="167" cy="94" r="22" fill="#0F172A" stroke="#475569" strokeWidth="2" />
            <circle cx="167" cy="94" r="14" fill="#1E293B" />
            <circle cx="167" cy="94" r="6" fill="#64748B" />
            <rect x="155" y="121" width="24" height="3" rx="1.5" fill="#475569" />
          </svg>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <MonitorSpeaker className="w-3.5 h-3.5 text-slate-500" />
            <span>Studio Reference Acoustics</span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex flex-col items-center justify-center p-6 text-slate-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 mb-2 text-slate-400" />
        <span className="text-xs font-medium text-slate-600 text-center">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
