export const DEFAULT_CATEGORIES = [
  'Computers',
  'Laptops',
  'Mobile Phones',
  'Tablets',
  'Accessories',
  'Keyboards',
  'Mouse',
  'Monitors',
  'Printers',
  'Gaming Products',
  'Smart Watches',
  'Headphones',
  'Speakers',
  'Computer Components',
] as const;

export type Category = string;

export interface ProductVariant {
  id: string;
  label: string;
  priceDelta: number;
  skuSuffix: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: Category;
  price: number; // Price in PKR
  compareAtPrice?: number; // Compare-at price in PKR
  imageUrl?: string; // Optional custom or preset image key/URL
  stock: number;
  rating: number;
  reviewCount: number;
  shortDesc: string;
  description: string;
  warranty: string;
  featured: boolean;
  variants: ProductVariant[];
  specs: ProductSpec[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  brand: string;
  category: Category;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderTrackingStep {
  label: string;
  detail: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'Confirmed'
  | 'Preparing Shipment'
  | 'Dispatched'
  | 'Out for Delivery'
  | 'Delivered';

export interface Order {
  orderNumber: string;
  userId?: string;
  status: OrderStatus;
  paymentMethod: 'card' | 'cod';
  deliveryMethod: 'standard' | 'express';
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  carrier: string;
  trackingCode: string;
  estimatedDelivery: string;
  createdAt: string;
  shipping: ShippingDetails;
  items: OrderItemSnapshot[];
  timeline: OrderTrackingStep[];
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    units: number;
    productCount: number;
    stockUnits: number;
  }>;
  statusBreakdown: Array<{
    status: OrderStatus;
    count: number;
  }>;
  paymentBreakdown: {
    cardCount: number;
    cardRevenue: number;
    codCount: number;
    codRevenue: number;
  };
}

export type PageView =
  | 'home'
  | 'catalog'
  | 'product'
  | 'wishlist'
  | 'checkout'
  | 'track'
  | 'account'
  | 'contact'
  | 'admin';
