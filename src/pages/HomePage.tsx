import { useState } from 'react';
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import type { Category } from '../types/store';
import { HERO_IMAGE } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function HomePage() {
  const { products, categories, navigate } = useStore();
  const [heroSearch, setHeroSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('catalog', { category: 'All', search: heroSearch.trim() });
  };

  const displayedProducts =
    activeCategory === 'All'
      ? products.filter((p) => p.featured)
      : products.filter((p) => p.category === activeCategory);

  return (
    <div>
      {/* Section 1: Storefront Split Hero + 4-Column Guarantee Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Prime Mobile Computer · Authorized Hardware Store
              </p>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-slate-900 leading-[1.12] text-balance">
                Precision electronics for work, studio, and play.
              </h1>

              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Shop factory-sealed computers, laptops, flagship phones, 4K monitors, studio audio, peripherals, and PC components in PKR—backed by official OEM warranty and same-day dispatch.
              </p>

              <form onSubmit={handleHeroSearch} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search laptops, monitors, RTX GPUs, phones..."
                    aria-label="Search products"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Search Store</span>
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => navigate('catalog', { category: 'All', search: '' })}
                  className="text-slate-900 hover:text-[#1D4ED8] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Browse All {categories.length} Categories</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={() => navigate('track')}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Track an Existing Order
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[260px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-[#F3F4F6]">
                <img
                  src={HERO_IMAGE}
                  alt="Prime Mobile Computer flagship workstation setup with laptop, 4K monitor, smartphone, and studio headphones"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Official OEM Warranty</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Serial-verified stock with up to 3 years direct coverage.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Free Insured Shipping</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Complimentary ground delivery on orders over PKR 25,000 + COD.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">30-Day Hassle-Free Returns</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Simple exchanges or full refunds on unopened or defective gear.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">WhatsApp Tech Desk</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct hardware compatibility & build advice from specialists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Category Directory + Featured Collection Grid */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeCategory === 'All' ? 'Featured Hardware' : activeCategory}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Filter by any of our {categories.length} electronics departments or open the full catalog for specs & price sorting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('catalog', { category: activeCategory })}
            className="text-sm font-medium text-[#1D4ED8] hover:text-[#1E40AF] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Open Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex flex-wrap gap-2 pb-6 mb-8 border-b border-slate-200"
          role="tablist"
          aria-label="Product Categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'All'}
            onClick={() => setActiveCategory('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'All'
                ? 'bg-[#0F172A] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            Featured ({products.filter((p) => p.featured).length})
          </button>
          {categories.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(category)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Section 3: Craftsmanship, Custom Workstations & Procurement */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Built & Tested In-House
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                From single upgrades to complete office deployments.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Every desktop workstation and component bundle leaves our bench after BIOS tuning, thermal load validation, and anti-static double boxing. Need bulk pricing for a studio or classroom? Our team quotes same-day.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('catalog', { category: 'Computer Components' })}
                  className="px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors"
                >
                  Shop PC Components
                </button>
                <button
                  type="button"
                  onClick={() => navigate('contact')}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-sm font-medium transition-colors"
                >
                  Contact Hardware Desk
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#FAFAFA] border border-slate-200">
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {categories.length}
                </p>
                <p className="text-sm font-medium text-slate-800 mt-1">Departments</p>
                <p className="text-xs text-slate-500 mt-1">
                  Full-stack computing, mobile, audio, print & parts.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#FAFAFA] border border-slate-200">
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">48 hr</p>
                <p className="text-sm font-medium text-slate-800 mt-1">Thermal Validation</p>
                <p className="text-xs text-slate-500 mt-1">
                  Burn-in tested on custom desktop workstations.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#FAFAFA] border border-slate-200">
                <p className="font-mono text-xl font-semibold text-slate-900 tabular-nums">PKR 25k+</p>
                <p className="text-sm font-medium text-slate-800 mt-1">Free Shipping</p>
                <p className="text-xs text-slate-500 mt-1">
                  Insured ground shipping plus Cash on Delivery.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#FAFAFA] border border-slate-200">
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">100%</p>
                <p className="text-sm font-medium text-slate-800 mt-1">OEM Authentic</p>
                <p className="text-xs text-slate-500 mt-1">
                  Serial-tracked inventory with direct warranty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
