import { useState } from 'react';
import { X } from 'lucide-react';
import type { Product } from '../../types/store';
import { IMAGE_PRESETS } from '../../data/productImages';
import { ProductImage } from '../ProductImage';

interface ProductFormModalProps {
  adminToken: string;
  categories: string[];
  product: Product | null; // null = create mode
  onClose: () => void;
  onSaved: (product: Product, isNew: boolean) => void;
}

export function ProductFormModal({
  adminToken,
  categories,
  product,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [category, setCategory] = useState(product?.category || categories[0] || 'Laptops');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? String(product.compareAtPrice) : ''
  );
  const [stock, setStock] = useState(product ? String(product.stock) : '10');
  const [warranty, setWarranty] = useState(product?.warranty || '1-Year Official Warranty');
  const [shortDesc, setShortDesc] = useState(product?.shortDesc || '');
  const [description, setDescription] = useState(product?.description || '');
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [variantLabel, setVariantLabel] = useState(
    product?.variants[0]?.label || 'Standard Edition'
  );

  const initialImage = product?.imageUrl || `preset:${product?.category || categories[0] || 'Laptops'}`;
  const [imageMode, setImageMode] = useState<'preset' | 'url'>(
    product?.imageUrl && /^https?:\/\//i.test(product.imageUrl) ? 'url' : 'preset'
  );
  const [imageUrl, setImageUrl] = useState(initialImage);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = isEdit
        ? `/api/admin/products/${product!.id}`
        : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name,
        brand,
        category,
        sku,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        stock: Number(stock),
        warranty,
        shortDesc,
        description,
        featured,
        variantLabel,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !data.product) {
        setError(data.error || 'Failed to save product.');
        return;
      }

      onSaved(data.product, !isEdit);
    } catch {
      setError('Network error while saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit Product' : 'Add Product'}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {isEdit ? `Edit Product · ${product!.name}` : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-500">All prices are stored and displayed in PKR.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Image Picker & Live Preview */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Product Image
              </label>

              <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-[#F3F4F6] border border-slate-200">
                <ProductImage
                  category={category}
                  imageUrl={imageUrl}
                  alt={name || 'Product preview'}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageMode('preset')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    imageMode === 'preset'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Studio Presets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageMode('url');
                    if (imageUrl.startsWith('preset:')) setImageUrl('');
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    imageMode === 'url'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Image URL
                </button>
              </div>

              {imageMode === 'preset' ? (
                <select
                  value={imageUrl.startsWith('preset:') ? imageUrl : `preset:${category}`}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              )}
            </div>

            {/* Core Fields */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AeroBook Pro 16"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="AeroCompute"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="125000"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Compare Price (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Qty *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PMC-LAP-209"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Configuration Label
              </label>
              <input
                type="text"
                value={variantLabel}
                onChange={(e) => setVariantLabel(e.target.value)}
                placeholder="e.g. 16GB RAM · 512GB SSD"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Short Summary *
            </label>
            <input
              type="text"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Concise one-line hardware overview shown on product cards"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product overview shown on the Product Detail Page..."
              className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-slate-300 text-[#1D4ED8]"
            />
            <span>Feature on Storefront Homepage</span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
