import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_CATEGORIES,
  type CartItem,
  type Category,
  type PageView,
  type Product,
  type UserProfile,
} from '../types/store';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/catalog';

interface StoreContextValue {
  page: PageView;
  products: Product[];
  categories: Category[];
  selectedCategory: Category | 'All';
  selectedProductSlug: string | null;
  searchQuery: string;
  trackOrderQuery: string;
  cart: CartItem[];
  wishlist: string[];
  user: UserProfile | null;
  token: string | null;
  isCartOpen: boolean;
  recentOrderNumbers: string[];
  toastMessage: string | null;
  refreshCatalog: () => Promise<void>;
  navigate: (
    page: PageView,
    options?: {
      category?: Category | 'All';
      productSlug?: string;
      search?: string;
      orderNumber?: string;
    }
  ) => void;
  setSelectedCategory: (cat: Category | 'All') => void;
  setSearchQuery: (q: string) => void;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, variantId?: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, variantId: string, delta: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  setAuthSession: (token: string, user: UserProfile) => void;
  logout: () => void;
  recordOrderNumber: (orderNumber: string) => void;
  showToast: (msg: string) => void;
  getCartDetails: () => Array<{
    item: CartItem;
    product: Product;
    variantLabel: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  cartCount: number;
  cartSubtotal: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = 'pmc_cart_v2';
const WISHLIST_KEY = 'pmc_wishlist_v2';
const ORDERS_KEY = 'pmc_recent_orders_v2';

function getInitialPage(): PageView {
  if (typeof window !== 'undefined') {
    if (
      window.location.pathname === '/admin' ||
      window.location.hash === '#/admin'
    ) {
      return 'admin';
    }
  }
  return 'home';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<PageView>(getInitialPage);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>([...DEFAULT_CATEGORIES]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackOrderQuery, setTrackOrderQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Customer auth token kept strictly in JS/React memory (not localStorage)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [recentOrderNumbers, setRecentOrderNumbers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const refreshCatalog = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (prodRes.ok) {
        const prodData = (await prodRes.json()) as { products?: Product[] };
        if (Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
      }
      if (catRes.ok) {
        const catData = (await catRes.json()) as { categories?: string[] };
        if (Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      }
    } catch {
      // Keep current catalog state on transient network errors
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#/admin') {
        setPage('admin');
      } else if (page === 'admin') {
        setPage('home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [page]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(recentOrderNumbers));
    } catch {
      // ignore
    }
  }, [recentOrderNumbers]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Unauthorized'))))
      .then((data: { user: UserProfile }) => setUser(data.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const navigate: StoreContextValue['navigate'] = (targetPage, options) => {
    if (options?.category !== undefined) {
      setSelectedCategory(options.category);
    }
    if (options?.productSlug !== undefined) {
      setSelectedProductSlug(options.productSlug);
    }
    if (options?.search !== undefined) {
      setSearchQuery(options.search);
    }
    if (options?.orderNumber !== undefined) {
      setTrackOrderQuery(options.orderNumber);
    }
    setPage(targetPage);
    if (targetPage === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (productId: string, variantId?: string, quantity = 1) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock`);
      return;
    }
    const chosenVariant = variantId || product.variants[0].id;
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === productId && i.variantId === chosenVariant
      );
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          quantity: Math.min(product.stock, Math.min(20, next[idx].quantity + quantity)),
        };
        return next;
      }
      return [
        ...prev,
        { productId, variantId: chosenVariant, quantity: Math.min(product.stock, quantity) },
      ];
    });
    showToast(`Added ${product.name} to bag`);
  };

  const updateCartQuantity = (productId: string, variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (product) showToast(`Removed ${product.name} from wishlist`);
        return prev.filter((id) => id !== productId);
      }
      if (product) showToast(`Saved ${product.name} to wishlist`);
      return [...prev, productId];
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const setAuthSession = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    showToast('Signed out of your account');
  };

  const recordOrderNumber = (orderNumber: string) => {
    setRecentOrderNumbers((prev) =>
      [orderNumber, ...prev.filter((n) => n !== orderNumber)].slice(0, 6)
    );
  };

  const getCartDetails = () => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const variant =
          product.variants.find((v) => v.id === item.variantId) || product.variants[0];
        const unitPrice = product.price + variant.priceDelta;
        return {
          item,
          product,
          variantLabel: variant.label,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = getCartDetails().reduce((sum, d) => sum + d.lineTotal, 0);

  return (
    <StoreContext.Provider
      value={{
        page,
        products,
        categories,
        selectedCategory,
        selectedProductSlug,
        searchQuery,
        trackOrderQuery,
        cart,
        wishlist,
        user,
        token,
        isCartOpen,
        recentOrderNumbers,
        toastMessage,
        refreshCatalog,
        navigate,
        setSelectedCategory,
        setSearchQuery,
        setIsCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
        setAuthSession,
        logout,
        recordOrderNumber,
        showToast,
        getCartDetails,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
