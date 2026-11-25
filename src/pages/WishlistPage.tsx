import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductImage';

export function WishlistPage() {
  const { products, wishlist, toggleWishlist, addToCart, setIsCartOpen, navigate } = useStore();
  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Saved Items
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
            Your Wishlist ({savedProducts.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('catalog')}
          className="text-sm font-medium text-[#1D4ED8] hover:underline"
        >
          Continue Shopping
        </button>
      </div>

      {savedProducts.length === 0 ? (
        <div className="mt-10 bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Your wishlist is empty</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Save laptops, monitors, audio gear, or components to compare configurations and buy whenever you are ready.
          </p>
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="mt-5 px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map((product) => (
            <article
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => navigate('product', { productSlug: product.slug })}
                className="aspect-[4/3] w-full bg-[#F3F4F6] overflow-hidden"
              >
                <ProductImage
                  category={product.category}
                  imageUrl={product.imageUrl}
                  alt={product.name}
                />
              </button>

              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs text-slate-500">
                  {product.brand} · {product.category}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('product', { productSlug: product.slug })}
                  className="mt-1 text-left text-base font-semibold text-slate-900 hover:text-[#1D4ED8]"
                >
                  {product.name}
                </button>
                <p className="mt-2 text-sm font-semibold text-slate-900 tabular-nums">
                  {formatPKR(product.price)}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      addToCart(product.id);
                      setIsCartOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{product.stock <= 0 ? 'Out of Stock' : 'Move to Bag'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
