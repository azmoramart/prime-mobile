import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductImage';
import { ProductCard } from '../components/ProductCard';

export function ProductDetailPage() {
  const {
    products,
    selectedProductSlug,
    navigate,
    addToCart,
    setIsCartOpen,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const product =
    products.find((p) => p.slug === selectedProductSlug || p.id === selectedProductSlug) ||
    products[0];

  const [variantId, setVariantId] = useState<string>(product.variants[0]?.id || 'v1');
  const [quantity, setQuantity] = useState<number>(1);

  const selectedVariant =
    product.variants.find((v) => v.id === variantId) || product.variants[0];
  const activePrice = product.price + (selectedVariant?.priceDelta || 0);
  const activeSku = `${product.sku}-${selectedVariant?.skuSuffix || 'STD'}`;
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  const related = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 3);

  const whatsappProductUrl = `https://wa.me/15550192834?text=${encodeURIComponent(
    `Hello Prime Mobile Computer, I have a question about ${product.name} (${selectedVariant?.label || ''}, SKU ${activeSku}).`
  )}`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => navigate('catalog', { category: 'All' })}
          className="hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => navigate('catalog', { category: product.category })}
          className="hover:text-slate-900"
        >
          {product.category}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F3F4F6] border border-slate-200">
            <ProductImage
              category={product.category}
              imageUrl={product.imageUrl}
              alt={product.name}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
              Technical Specifications
            </h2>
            <dl className="divide-y divide-slate-100">
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm"
                >
                  <dt className="font-medium text-slate-500">{spec.label}</dt>
                  <dd className="sm:col-span-2 text-slate-900 font-medium tabular-nums">
                    {spec.value}
                  </dd>
                </div>
              ))}
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                <dt className="font-medium text-slate-500">SKU</dt>
                <dd className="sm:col-span-2 font-mono text-xs text-slate-700 pt-0.5">
                  {activeSku}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                <dt className="font-medium text-slate-500">Warranty</dt>
                <dd className="sm:col-span-2 text-slate-900">{product.warranty}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                {product.brand} · {product.category}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {formatPKR(activePrice)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPKR(product.compareAtPrice + (selectedVariant?.priceDelta || 0))}
                </span>
              )}
              <span
                className={`text-xs font-medium ml-auto inline-flex items-center gap-1 ${
                  outOfStock ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {!outOfStock && <Check className="w-3.5 h-3.5" />}
                {outOfStock ? 'Out of Stock' : `In Stock (${product.stock} ready)`}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.variants.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2.5">
                Configuration
              </span>
              <div className="space-y-2">
                {product.variants.map((variant) => {
                  const active = variant.id === selectedVariant?.id;
                  const vPrice = product.price + variant.priceDelta;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setVariantId(variant.id)}
                      className={`w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between text-sm transition-colors ${
                        active
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-slate-900 font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{variant.label}</span>
                      <span className="tabular-nums font-semibold">
                        {formatPKR(vPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, product.stock), Math.min(10, q + 1)))
                  }
                  aria-label="Increase quantity"
                  className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  addToCart(product.id, selectedVariant?.id, quantity);
                  setIsCartOpen(true);
                }}
                className="flex-1 h-11 px-5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
                  wishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addToCart(product.id, selectedVariant?.id, quantity);
                navigate('checkout');
              }}
              className="w-full h-11 rounded-lg bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
            >
              Buy Now · Proceed to Checkout
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {activePrice >= 25000
                  ? 'Qualifies for free insured ground shipping · Express available'
                  : 'Standard insured shipping PKR 850 · Free over PKR 25,000'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{product.warranty} · 30-day return window</span>
            </div>
            <a
              href={whatsappProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#15803D] font-medium hover:underline pt-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask a Hardware Specialist on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <section className="mt-16 pt-10 border-t border-slate-200">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">
          Related Hardware
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
