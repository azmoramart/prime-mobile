import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Check,
  ClipboardList,
  Download,
  Edit3,
  FolderTree,
  LogOut,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminProfile,
  Order,
  OrderStatus,
  Product,
  SalesReportSummary,
} from '../types/store';
import { formatPKR } from '../data/productImages';
import { useStore } from '../context/StoreContext';
import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { ProductImage } from '../components/ProductImage';

type AdminTab = 'reports' | 'products' | 'inventory' | 'categories' | 'orders';

interface CategorySummary {
  name: string;
  productCount: number;
  totalStock: number;
  inventoryValue: number;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'Preparing Shipment',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
];

export function AdminDashboardPage() {
  const { navigate, refreshCatalog, showToast } = useStore();

  // Admin session held strictly in React state (memory only)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Products tab controls
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Inventory tab controls
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Categories tab controls
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Orders tab controls
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('Confirmed');
  const [carrierDraft, setCarrierDraft] = useState('');
  const [trackingDraft, setTrackingDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchAdminData = useCallback(async (tok: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${tok}` };
      const [prodRes, catRes, ordRes, repRes] = await Promise.all([
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/reports', { headers }),
      ]);

      if (prodRes.status === 401 || prodRes.status === 403) {
        setAdminToken(null);
        setAdminUser(null);
        return;
      }

      const [prodData, catData, ordData, repData] = await Promise.all([
        prodRes.json() as Promise<{ products?: Product[] }>,
        catRes.json() as Promise<{ categories?: CategorySummary[] }>,
        ordRes.json() as Promise<{ orders?: Order[] }>,
        repRes.json() as Promise<{ report?: SalesReportSummary }>,
      ]);

      if (prodData.products) {
        setProducts(prodData.products);
        const drafts: Record<string, number> = {};
        for (const p of prodData.products) drafts[p.id] = p.stock;
        setStockDrafts(drafts);
      }
      if (catData.categories) setCategories(catData.categories);
      if (ordData.orders) setOrders(ordData.orders);
      if (repData.report) setReport(repData.report);
    } catch {
      setError('Unable to load admin workspace data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      fetchAdminData(adminToken);
    }
  }, [adminToken, fetchAdminData]);

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    showToast('Signed out of Admin Console');
  };

  const syncAll = async () => {
    if (!adminToken) return;
    await Promise.all([fetchAdminData(adminToken), refreshCatalog()]);
  };

  // Filtered views
  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (prodCategory !== 'All' && p.category !== prodCategory) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.sku} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, prodSearch, prodCategory]);

  const filteredInventory = useMemo(() => {
    return products.filter((p) => {
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 10;
      if (stockFilter === 'out') return p.stock === 0;
      return true;
    });
  }, [products, stockFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
      if (q) {
        const hay = `${o.orderNumber} ${o.shipping.fullName} ${o.shipping.email} ${o.shipping.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Actions
  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      setConfirmDeleteId(null);
      showToast('Product deleted');
      await syncAll();
    }
  };

  const handleSaveStock = async (productId: string) => {
    if (!adminToken) return;
    const stock = Math.max(0, Math.floor(stockDrafts[productId] ?? 0));
    setSavingStockId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ stock }),
      });
      if (res.ok) {
        showToast('Inventory updated');
        await syncAll();
      }
    } finally {
      setSavingStockId(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setCategoryError(null);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: newCategoryName }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setCategoryError(data.error || 'Could not add category.');
      return;
    }
    setNewCategoryName('');
    showToast('Category added');
    await syncAll();
  };

  const handleRenameCategory = async (oldName: string) => {
    if (!adminToken) return;
    setCategoryError(null);
    const res = await fetch(`/api/admin/categories/${encodeURIComponent(oldName)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ newName: renameValue }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setCategoryError(data.error || 'Could not rename category.');
      return;
    }
    setRenamingCategory(null);
    setRenameValue('');
    showToast('Category renamed');
    await syncAll();
  };

  const handleDeleteCategory = async (name: string) => {
    if (!adminToken) return;
    setCategoryError(null);
    const res = await fetch(`/api/admin/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setCategoryError(data.error || 'Could not delete category.');
      return;
    }
    showToast(`Category "${name}" deleted`);
    await syncAll();
  };

  const openOrderInspector = (order: Order) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
    setCarrierDraft(order.carrier);
    setTrackingDraft(order.trackingCode);
    setNoteDraft('');
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedOrder) return;
    setSavingOrder(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(selectedOrder.orderNumber)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: statusDraft,
            carrier: carrierDraft,
            trackingCode: trackingDraft,
            note: noteDraft,
          }),
        }
      );
      const data = (await res.json()) as { order?: Order; error?: string };
      if (res.ok && data.order) {
        setSelectedOrder(data.order);
        showToast(`Order ${data.order.orderNumber} updated to ${data.order.status}`);
        await syncAll();
      }
    } finally {
      setSavingOrder(false);
    }
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows = [
      ['Category', 'Products', 'Stock Units', 'Units Sold', 'Revenue (PKR)'],
      ...report.categoryBreakdown.map((c) => [
        `"${c.category.replace(/"/g, '""')}"`,
        String(c.productCount),
        String(c.stockUnits),
        String(c.units),
        String(c.revenue),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prime-mobile-computer-sales-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sales report CSV exported');
  };

  if (!adminToken || !adminUser) {
    return (
      <AdminAuthGate
        onAuthenticated={(tok, adm) => {
          setAdminToken(tok);
          setAdminUser(adm);
        }}
        onBackToStore={() => navigate('home')}
      />
    );
  }

  const navTabs: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'orders', label: 'Customer Orders', icon: ClipboardList },
  ];

  const activeTabLabel = navTabs.find((t) => t.id === activeTab)?.label || 'Dashboard';
  const maxCategoryRevenue = Math.max(
    1,
    ...(report?.categoryBreakdown.map((c) => c.revenue) || [1])
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#0F172A] text-slate-200 flex-col border-r border-slate-800">
        <div className="h-16 px-5 flex items-center border-b border-slate-800">
          <span className="font-display text-base font-bold text-white tracking-tight whitespace-nowrap">
            Prime Mobile Computer
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Admin Navigation">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{adminUser.name}</p>
            <p className="text-slate-400 truncate">{adminUser.email}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-2 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 inline-flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-[#0F172A] text-slate-200 h-full flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <span className="font-display text-sm font-bold text-white">
                Admin Console
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 ${
                      active ? 'bg-[#1D4ED8] text-white' : 'text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 text-xs font-medium text-white flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5" />
                <span>View Storefront</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb left, 1-2 primary actions right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900 truncate">{activeTabLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-3.5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
            {activeTab === 'reports' && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* TAB 1: SALES REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {loading && !report ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                report && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-medium text-slate-500">Total Sales Revenue</p>
                        <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {formatPKR(report.totalRevenue)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums">
                          Avg order: {formatPKR(report.averageOrderValue)}
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-medium text-slate-500">Customer Orders</p>
                        <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {report.totalOrders}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums">
                          {report.totalUnitsSold} hardware units sold
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-medium text-slate-500">Inventory Valuation</p>
                        <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {formatPKR(report.totalInventoryValue)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums">
                          Across {products.length} active SKUs
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-medium text-slate-500">Stock Alerts</p>
                        <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {report.lowStockCount + report.outOfStockCount}
                        </p>
                        <p className="mt-1 text-xs text-amber-700 tabular-nums">
                          {report.lowStockCount} low stock · {report.outOfStockCount} out of stock
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Revenue by Category */}
                      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="font-display text-base font-semibold text-slate-900 mb-4">
                          Sales & Stock by Category (PKR)
                        </h2>
                        <div className="space-y-3">
                          {report.categoryBreakdown.map((row) => {
                            const widthPct = Math.round(
                              (row.revenue / maxCategoryRevenue) * 100
                            );
                            return (
                              <div key={row.category} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-slate-800">
                                    {row.category}{' '}
                                    <span className="text-slate-400">
                                      ({row.productCount} SKUs · {row.stockUnits} in stock)
                                    </span>
                                  </span>
                                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                    {formatPKR(row.revenue)}
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-[#1D4ED8] rounded-full"
                                    style={{ width: `${row.revenue > 0 ? Math.max(4, widthPct) : 0}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Pipeline & Payment Breakdown */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                          <h2 className="font-display text-base font-semibold text-slate-900 mb-3">
                            Order Status Breakdown
                          </h2>
                          <div className="divide-y divide-slate-100">
                            {report.statusBreakdown.map((item) => (
                              <div
                                key={item.status}
                                className="py-2.5 flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-700">{item.status}</span>
                                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                  {item.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                          <h2 className="font-display text-base font-semibold text-slate-900 mb-3">
                            Payment Channels
                          </h2>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">
                                Card ({report.paymentBreakdown.cardCount} orders)
                              </span>
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {formatPKR(report.paymentBreakdown.cardRevenue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">
                                Cash on Delivery ({report.paymentBreakdown.codCount} orders)
                              </span>
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {formatPKR(report.paymentBreakdown.codRevenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    placeholder="Search products by name, SKU, or brand..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                >
                  <option value="All">All Categories ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.productCount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Price (PKR)</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <ProductImage
                                  category={p.category}
                                  imageUrl={p.imageUrl}
                                  alt={p.name}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate max-w-[260px]">
                                  {p.name}
                                </p>
                                <p className="text-xs text-slate-500">{p.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {p.sku}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                            {p.category}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatPKR(p.price)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                            <span
                              className={
                                p.stock === 0
                                  ? 'text-rose-600 font-semibold'
                                  : p.stock <= 10
                                  ? 'text-amber-700 font-semibold'
                                  : 'text-slate-700'
                              }
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            {confirmDeleteId === p.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-medium"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  aria-label={`Edit ${p.name}`}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1D4ED8] hover:border-[#1D4ED8]"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  aria-label={`Delete ${p.name}`}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                            No products match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: `All SKUs (${products.length})` },
                    {
                      id: 'low',
                      label: `Low Stock <= 10 (${products.filter((p) => p.stock > 0 && p.stock <= 10).length})`,
                    },
                    {
                      id: 'out',
                      label: `Out of Stock (${products.filter((p) => p.stock === 0).length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStockFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      stockFilter === tab.id
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">SKU & Product</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">Stock Valuation</th>
                        <th className="py-3 px-4 text-right">Adjust Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredInventory.map((p) => {
                        const draft = stockDrafts[p.id] ?? p.stock;
                        const changed = draft !== p.stock;
                        const statusText =
                          p.stock === 0
                            ? 'Out of Stock'
                            : p.stock <= 10
                            ? 'Low Stock'
                            : 'In Stock';
                        const statusColor =
                          p.stock === 0
                            ? 'text-rose-700'
                            : p.stock <= 10
                            ? 'text-amber-700'
                            : 'text-emerald-700';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{p.name}</p>
                              <p className="text-xs font-mono text-slate-500">
                                {p.sku} · {p.category}
                              </p>
                            </td>
                            <td className={`py-3 px-4 text-xs font-semibold ${statusColor}`}>
                              {statusText}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                              {formatPKR(p.price)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {formatPKR(p.price * p.stock)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [p.id]: Math.max(0, (prev[p.id] ?? p.stock) - 1),
                                    }))
                                  }
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={draft}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [p.id]: Math.max(0, Number(e.target.value)),
                                    }))
                                  }
                                  aria-label={`Stock quantity for ${p.name}`}
                                  className="w-16 h-8 px-2 rounded-lg border border-slate-300 text-center font-mono text-xs tabular-nums"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [p.id]: (prev[p.id] ?? p.stock) + 1,
                                    }))
                                  }
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!changed || savingStockId === p.id}
                                  onClick={() => handleSaveStock(p.id)}
                                  className="h-8 px-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-medium transition-colors"
                                >
                                  {savingStockId === p.id ? 'Saving' : 'Save'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                            No items in this inventory filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddCategory}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
              >
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Add New Electronics Category
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Networking & Routers"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </form>

              {categoryError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {categoryError}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4 text-right">Products</th>
                        <th className="py-3 px-4 text-right">Total Stock</th>
                        <th className="py-3 px-4 text-right">Inventory Value</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {categories.map((cat) => (
                        <tr key={cat.name} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {renamingCategory === cat.name ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="h-8 px-2.5 rounded border border-slate-300 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameCategory(cat.name)}
                                  className="h-8 px-2.5 rounded bg-[#1D4ED8] text-white text-xs font-medium inline-flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenamingCategory(null)}
                                  className="h-8 px-2 rounded border border-slate-200 text-xs text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              cat.name
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {cat.productCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {cat.totalStock}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatPKR(cat.inventoryValue)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingCategory(cat.name);
                                  setRenameValue(cat.name);
                                  setCategoryError(null);
                                }}
                                aria-label={`Rename ${cat.name}`}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1D4ED8] hover:border-[#1D4ED8]"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.name)}
                                aria-label={`Delete ${cat.name}`}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER ORDERS & STATUS UPDATES */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className={selectedOrder ? 'xl:col-span-7 space-y-4' : 'xl:col-span-12 space-y-4'}>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order #, customer, city..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="All">All Statuses</option>
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">Order #</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Payment</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Total (PKR)</th>
                          <th className="py-3 px-4 text-right">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredOrders.map((o) => {
                          const active = selectedOrder?.orderNumber === o.orderNumber;
                          return (
                            <tr
                              key={o.orderNumber}
                              className={active ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}
                            >
                              <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                                {o.orderNumber}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900">{o.shipping.fullName}</p>
                                <p className="text-xs text-slate-500">
                                  {o.shipping.city} · {o.items.length} item(s)
                                </p>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 uppercase whitespace-nowrap">
                                {o.paymentMethod}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
                                {o.status}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                {formatPKR(o.total)}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openOrderInspector(o)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1D4ED8] text-xs font-medium text-slate-700 hover:text-[#1D4ED8]"
                                >
                                  Update
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                              No customer orders match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedOrder && (
                <aside className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        {selectedOrder.orderNumber}
                      </p>
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        {selectedOrder.shipping.fullName}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.shipping.email} · {selectedOrder.shipping.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">Shipping Address</p>
                    <p>
                      {selectedOrder.shipping.address}, {selectedOrder.shipping.city}{' '}
                      {selectedOrder.shipping.postalCode}, {selectedOrder.shipping.country}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 border-y border-slate-100 text-xs">
                    {selectedOrder.items.map((it) => (
                      <div key={it.sku} className="py-2 flex justify-between gap-2">
                        <span className="text-slate-700">
                          {it.name} ({it.variantLabel}) × {it.quantity}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                          {formatPKR(it.unitPrice * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleUpdateOrderStatus} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Order Fulfillment Status
                      </label>
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Carrier
                        </label>
                        <input
                          type="text"
                          value={carrierDraft}
                          onChange={(e) => setCarrierDraft(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tracking Code
                        </label>
                        <input
                          type="text"
                          value={trackingDraft}
                          onChange={(e) => setTrackingDraft(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Status Timeline Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="e.g. Dispatched via TCS Lahore Hub"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingOrder}
                      className="w-full h-10 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {savingOrder ? 'Updating Order...' : 'Save Order Status'}
                    </button>
                  </form>
                </aside>
              )}
            </div>
          )}
        </main>
      </div>

      {editingProduct !== undefined && (
        <ProductFormModal
          adminToken={adminToken}
          categories={categories.map((c) => c.name)}
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={async (_prod, isNew) => {
            setEditingProduct(undefined);
            showToast(isNew ? 'Product created' : 'Product updated');
            await syncAll();
          }}
        />
      )}
    </div>
  );
}
