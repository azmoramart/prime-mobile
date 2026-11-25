import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../data/productImages';
import { ProductImage } from './ProductImage';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    getCartDetails,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    navigate,
  } = useStore();

  if (!isCartOpen) return null;

  const items = getCartDetails();
  const freeShippingRemaining = Math.max(0, 25000 - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={() => setIsCartOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-900" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Shopping Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping bag"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600">
          {freeShippingRemaining === 0 ? (
            <span className="font-medium text-emerald-700">
              Your order qualifies for free insured ground shipping.
            </span>
          ) : (
            <span className="tabular-nums">
              Add <strong className="text-slate-900">{formatPKR(freeShippingRemaining)}</strong> more for free insured ground shipping.
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-base font-medium text-slate-900">Your bag is empty</p>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                Browse laptops, desktops, phones, audio gear, and PC components to start your order.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('catalog');
                }}
                className="mt-5 px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            items.map(({ item, product, variantLabel, unitPrice, lineTotal }) => (
              <div key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('product', { productSlug: product.slug });
                  }}
                  className="w-20 h-16 rounded-lg overflow-hidden bg-[#F3F4F6] border border-slate-200 shrink-0"
                >
                  <ProductImage
                    category={product.category}
                    imageUrl={product.imageUrl}
                    alt={product.name}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('product', { productSlug: product.slug });
                      }}
                      className="text-sm font-semibold text-slate-900 hover:text-[#1D4ED8] text-left truncate"
                    >
                      {product.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${product.name}`}
                      className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {variantLabel}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, -1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium tabular-nums text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right tabular-nums">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatPKR(lineTotal)}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-slate-400">
                          {formatPKR(unitPrice)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-[#FAFAFA] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-slate-900">
                  {formatPKR(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Estimated Shipping</span>
                <span className="tabular-nums">
                  {cartSubtotal >= 25000 ? 'Free' : 'PKR 850'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                navigate('checkout');
              }}
              className="w-full py-3 px-4 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
