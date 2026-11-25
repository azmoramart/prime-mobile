import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Category } from '../types/store';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export function CatalogPage() {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useStore();
  const [sort, setSort] = useState<SortOption>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(600000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  const highestPrice = useMemo(
    () => Math.max(600000, ...products.map((p) => p.price)),
    [products]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (p.price > maxPrice) return false;
      if (onlyInStock && p.stock <= 0) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.sku} ${p.shortDesc}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, selectedCategory, searchQuery, maxPrice, onlyInStock, sort]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setMaxPrice(highestPrice);
    setOnlyInStock(false);
    setSort('featured');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            All Electronics · {categories.length} Departments
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
            {selectedCategory === 'All' ? 'Complete Product Catalog' : selectedCategory}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, brand, or SKU..."
              aria-label="Search catalog"
              className="w-full h-10 pl-10 pr-8 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort products"
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Categories</span>
              </h2>
              {(selectedCategory !== 'All' || searchQuery || maxPrice < highestPrice || onlyInStock) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-[#1D4ED8] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-[#0F172A] text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>All Categories</span>
                <span className="text-xs tabular-nums opacity-75">{products.length}</span>
              </button>

              {categories.map((category: Category) => {
                const count = products.filter((p) => p.category === category).length;
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-[#1D4ED8] text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{category}</span>
                    <span className="text-xs tabular-nums opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                  <span>Max Price</span>
                  <span className="tabular-nums font-mono">{formatPKR(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={15000}
                  max={highestPrice}
                  step={5000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum price"
                  className="w-full accent-[#1D4ED8]"
                />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
                <span>In-stock items only</span>
              </label>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <span className="tabular-nums">
              Showing {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-base font-semibold text-slate-900">No matching products found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try clearing your search term or expanding the maximum price filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-sm font-medium"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
