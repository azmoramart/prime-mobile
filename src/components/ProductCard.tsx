import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../types/store';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../data/productImages';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate, addToCart, toggleWishlist, isWishlisted, setIsCartOpen } = useStore();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  const openDetails = () => {
    navigate('product', { productSlug: product.slug });
  };

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={openDetails}
        className="relative aspect-[4/3] w-full bg-[#F3F4F6] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
      >
        <ProductImage
          category={product.category}
          imageUrl={product.imageUrl}
          alt={product.name}
          className="transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="uppercase tracking-wider font-medium text-slate-600">
              {product.brand}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.category}</span>
          </div>
          <span className="tabular-nums shrink-0 text-slate-600 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <button
          type="button"
          onClick={openDetails}
          className="text-left text-base font-semibold text-slate-900 hover:text-[#1D4ED8] transition-colors line-clamp-2 focus-visible:outline-none focus-visible:underline"
        >
          {product.name}
        </button>

        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {product.shortDesc}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-slate-100 mt-4">
          <div className="flex flex-col tabular-nums">
            <span className="text-[15px] font-semibold text-slate-900">
              {formatPKR(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                wishlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addToCart(product.id);
                setIsCartOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{outOfStock ? 'Sold Out' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
