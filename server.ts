import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRODUCTS as INITIAL_PRODUCTS } from './src/data/catalog.ts';
import {
  DEFAULT_CATEGORIES,
  type AdminProfile,
  type Order,
  type OrderItemSnapshot,
  type OrderStatus,
  type OrderTrackingStep,
  type Product,
  type SalesReportSummary,
  type ShippingDetails,
  type UserProfile,
} from './src/types/store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'Preparing Shipment',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
];

interface StoredCustomer extends UserProfile {
  passwordHash: string;
}

interface StoredAdmin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface ContactInquiry {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
}

interface AuthenticatedRequest extends Request {
  admin?: AdminProfile;
}

// Mutable server-side store
const productsList: Product[] = INITIAL_PRODUCTS.map((p) => ({
  ...p,
  variants: p.variants.map((v) => ({ ...v })),
  specs: p.specs.map((s) => ({ ...s })),
}));
const categoriesList: string[] = [...DEFAULT_CATEGORIES];

const usersByEmail = new Map<string, StoredCustomer>();
const usersById = new Map<string, StoredCustomer>();
const ordersByNumber = new Map<string, Order>();
const inquiries: ContactInquiry[] = [];
let orderSequence = 1046;
let claimedAdmin: StoredAdmin | null = null;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function timingSafeCompareStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signToken(
  uid: string,
  role: 'customer' | 'admin',
  extra?: { email: string; name: string }
): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      role,
      email: extra?.email,
      name: extra?.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function decodeToken(
  token: string | undefined
): { uid: string; role: 'customer' | 'admin'; email?: string; name?: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    ) as {
      uid: string;
      role: 'customer' | 'admin';
      email?: string;
      name?: string;
      exp: number;
    };
    if (!decoded.uid || !decoded.role || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.slice(7).trim();
}

function getCustomerUser(req: Request): StoredCustomer | null {
  const decoded = decodeToken(getBearerToken(req));
  if (!decoded || decoded.role !== 'customer') return null;
  return usersById.get(decoded.uid) || null;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const decoded = decodeToken(getBearerToken(req));
  if (!decoded) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
  }
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPass) {
    req.admin = {
      id: decoded.uid,
      name: decoded.name || 'Store Administrator',
      email: decoded.email || 'admin@primemobilecomputer.com',
      role: 'admin',
    };
    return next();
  }
  if (!claimedAdmin || claimedAdmin.id !== decoded.uid) {
    return res.status(401).json({ error: 'Admin session is no longer valid.' });
  }
  req.admin = {
    id: claimedAdmin.id,
    name: claimedAdmin.name,
    email: claimedAdmin.email,
    role: 'admin',
  };
  return next();
}

function toPublicUser(user: StoredCustomer): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

function sanitizeImageUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('preset:')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildTimelineForStatus(
  status: OrderStatus,
  trackingCode: string,
  paymentMethod: 'card' | 'cod',
  total: number,
  note?: string
): OrderTrackingStep[] {
  const statusIdx = VALID_ORDER_STATUSES.indexOf(status);
  const nowLabel = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const baseSteps: Array<{ label: OrderStatus; defaultDetail: string }> = [
    {
      label: 'Confirmed',
      defaultDetail:
        paymentMethod === 'cod'
          ? 'Cash on Delivery verification completed.'
          : 'Card authorization succeeded and stock reserved.',
    },
    {
      label: 'Preparing Shipment',
      defaultDetail: 'Serial numbers scanned and anti-static packaging prepared.',
    },
    {
      label: 'Dispatched',
      defaultDetail: `Handed over to courier (${trackingCode}).`,
    },
    {
      label: 'Out for Delivery',
      defaultDetail: 'With local delivery rider for final drop-off.',
    },
    {
      label: 'Delivered',
      defaultDetail:
        paymentMethod === 'cod'
          ? `COD balance PKR ${Math.round(total).toLocaleString('en-PK')} settled on delivery.`
          : 'Package signed and delivered to recipient.',
    },
  ];

  return baseSteps.map((step, idx) => {
    const completed = idx <= statusIdx;
    const current = idx === statusIdx;
    return {
      label: step.label === 'Confirmed' ? 'Order Confirmed' : step.label,
      detail: current && note?.trim() ? note.trim() : step.defaultDetail,
      timestamp: current ? `Updated ${nowLabel}` : completed ? 'Completed' : 'Pending',
      completed,
      current,
    };
  });
}

// Seed sample orders in PKR for immediate tracking and admin order management testing
function seedInitialOrders() {
  const sampleOrders: Order[] = [
    {
      orderNumber: 'PMC-1042',
      status: 'Out for Delivery',
      paymentMethod: 'card',
      deliveryMethod: 'express',
      subtotal: 454500,
      shippingCost: 2500,
      tax: 36360,
      total: 493360,
      carrier: 'TCS Prime Express',
      trackingCode: 'TCS-88492014',
      estimatedDelivery: 'Today by 6:00 PM',
      createdAt: '2026-11-23T14:20:00Z',
      shipping: {
        fullName: 'Hamza Tariq',
        email: 'hamza.t@example.com',
        phone: '+92 300 5558910',
        address: '42 Clifton Block 5',
        city: 'Karachi',
        state: 'Sindh',
        postalCode: '75600',
        country: 'Pakistan',
      },
      items: [
        {
          productId: 'lap-aerobook-15',
          name: 'AeroBook Pro 15 Aluminum',
          brand: 'AeroCompute',
          category: 'Laptops',
          variantLabel: '16GB · 512GB · Silver',
          sku: 'PMC-LAP-201-16-512',
          unitPrice: 365000,
          quantity: 1,
        },
        {
          productId: 'hea-studio-anc',
          name: 'Sonora Reference ANC Headphones',
          brand: 'Sonora Acoustics',
          category: 'Headphones',
          variantLabel: 'Matte Charcoal & Brushed Steel',
          sku: 'PMC-HEA-1201-CH',
          unitPrice: 89500,
          quantity: 1,
        },
      ],
      timeline: [
        {
          label: 'Order Confirmed',
          detail: 'Payment verified and inventory reserved at Central Hub.',
          timestamp: 'Nov 23, 2:20 PM',
          completed: true,
        },
        {
          label: 'Preparing Shipment',
          detail: 'Serial numbers scanned and factory seals verified.',
          timestamp: 'Nov 23, 5:10 PM',
          completed: true,
        },
        {
          label: 'Dispatched',
          detail: 'Handed over to TCS Prime Express (TCS-88492014).',
          timestamp: 'Nov 24, 9:05 AM',
          completed: true,
        },
        {
          label: 'Out for Delivery',
          detail: 'Out with rider in Clifton, Karachi.',
          timestamp: 'Nov 25, 7:45 AM',
          completed: true,
          current: true,
        },
        {
          label: 'Delivered',
          detail: 'Signature required upon drop-off.',
          timestamp: 'Pending',
          completed: false,
        },
      ],
    },
    {
      orderNumber: 'PMC-1045',
      status: 'Preparing Shipment',
      paymentMethod: 'cod',
      deliveryMethod: 'standard',
      subtotal: 275000,
      shippingCost: 0,
      tax: 22000,
      total: 297000,
      carrier: 'Leopards Insured Ground',
      trackingCode: 'LEO-77310492',
      estimatedDelivery: 'Nov 27 – Nov 28',
      createdAt: '2026-11-24T19:15:00Z',
      shipping: {
        fullName: 'Ayesha Siddiqui',
        email: 'ayesha.s@example.com',
        phone: '+92 321 5551190',
        address: '18-B Gulberg III',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54660',
        country: 'Pakistan',
      },
      items: [
        {
          productId: 'cmp-rtx-5080-ti',
          name: 'Titanium RTX Pro 16GB Graphics Card',
          brand: 'Prime Components',
          category: 'Computer Components',
          variantLabel: '16GB GDDR7 · Standard Clock',
          sku: 'PMC-PTS-1401-16G',
          unitPrice: 275000,
          quantity: 1,
        },
      ],
      timeline: [
        {
          label: 'Order Confirmed',
          detail: 'Cash on Delivery verification completed.',
          timestamp: 'Nov 24, 7:15 PM',
          completed: true,
        },
        {
          label: 'Preparing Shipment',
          detail: 'Anti-static packaging and serial verification in progress.',
          timestamp: 'Nov 25, 8:30 AM',
          completed: true,
          current: true,
        },
        {
          label: 'Dispatched',
          detail: 'Scheduled for afternoon carrier pickup.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          label: 'Out for Delivery',
          detail: 'Awaiting regional transit.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          label: 'Delivered',
          detail: 'COD balance PKR 297,000 due at delivery.',
          timestamp: 'Pending',
          completed: false,
        },
      ],
    },
    {
      orderNumber: 'PMC-1038',
      status: 'Delivered',
      paymentMethod: 'card',
      deliveryMethod: 'standard',
      subtotal: 244500,
      shippingCost: 0,
      tax: 19560,
      total: 264060,
      carrier: 'Leopards Insured Ground',
      trackingCode: 'LEO-55201944',
      estimatedDelivery: 'Delivered Nov 21',
      createdAt: '2026-11-18T10:05:00Z',
      shipping: {
        fullName: 'Bilal Ahmed',
        email: 'bilal.a@example.com',
        phone: '+92 333 5553321',
        address: 'House 12, F-7/2',
        city: 'Islamabad',
        state: 'ICT',
        postalCode: '44000',
        country: 'Pakistan',
      },
      items: [
        {
          productId: 'mon-studio-32-4k',
          name: 'Lumen Reference 32" 4K IPS Monitor',
          brand: 'Lumen Display',
          category: 'Monitors',
          variantLabel: '32" 4K 60Hz IPS Black',
          sku: 'PMC-MON-801-32-60',
          unitPrice: 198000,
          quantity: 1,
        },
        {
          productId: 'key-nocturna-75',
          name: 'Nocturna 75 CNC Mechanical Keyboard',
          brand: 'Nocturna Key',
          category: 'Keyboards',
          variantLabel: 'Linear Tactile Cream Switches',
          sku: 'PMC-KEY-601-LIN',
          unitPrice: 46500,
          quantity: 1,
        },
      ],
      timeline: [
        {
          label: 'Order Confirmed',
          detail: 'Payment verified.',
          timestamp: 'Nov 18, 10:05 AM',
          completed: true,
        },
        {
          label: 'Preparing Shipment',
          detail: 'Calibrated display inspection passed.',
          timestamp: 'Nov 18, 1:40 PM',
          completed: true,
        },
        {
          label: 'Dispatched',
          detail: 'Departed Central Fulfillment Center.',
          timestamp: 'Nov 19, 8:15 AM',
          completed: true,
        },
        {
          label: 'Out for Delivery',
          detail: 'Arrived at Islamabad local hub.',
          timestamp: 'Nov 21, 7:10 AM',
          completed: true,
        },
        {
          label: 'Delivered',
          detail: 'Signed by B. Ahmed at front desk.',
          timestamp: 'Nov 21, 2:34 PM',
          completed: true,
          current: true,
        },
      ],
    },
  ];

  for (const order of sampleOrders) {
    ordersByNumber.set(order.orderNumber, order);
  }
}

seedInitialOrders();

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    productCount: productsList.length,
    categoryCount: categoriesList.length,
  });
});

// Public Storefront Categories & Products
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ categories: categoriesList });
});

app.get('/api/products', (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const inStock = req.query.inStock === 'true';

  let list = productsList.slice();
  if (category && category !== 'All') {
    list = list.filter((p) => p.category === category);
  }
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q)
    );
  }
  if (inStock) {
    list = list.filter((p) => p.stock > 0);
  }
  res.json({ products: list });
});

app.get('/api/products/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const found = productsList.find((p) => p.slug === slug || p.id === slug);
  if (!found) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json({ product: found });
});

// Customer Authentication (strictly separate from Admin accounts)
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (min 2 characters).' });
  }
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (usersByEmail.has(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const user: StoredCustomer = {
    id: `usr_${crypto.randomBytes(8).toString('hex')}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : undefined,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  usersByEmail.set(normalizedEmail, user);
  usersById.set(user.id, user);

  const token = signToken(user.id, 'customer');
  return res.status(201).json({ token, user: toPublicUser(user) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = usersByEmail.get(normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user.id, 'customer');
  return res.json({ token, user: toPublicUser(user) });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getCustomerUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or unauthorized.' });
  }
  return res.json({ user: toPublicUser(user) });
});

// Orders & Public Tracking
app.post('/api/orders', (req: Request, res: Response) => {
  const user = getCustomerUser(req);
  const body = req.body as {
    items?: Array<{ productId: string; variantId: string; quantity: number }>;
    shipping?: Partial<ShippingDetails>;
    paymentMethod?: 'card' | 'cod';
    deliveryMethod?: 'standard' | 'express';
  };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'Your shopping bag is empty.' });
  }

  const s = body.shipping || {};
  if (
    !s.fullName?.trim() ||
    !s.email?.trim() ||
    !s.phone?.trim() ||
    !s.address?.trim() ||
    !s.city?.trim() ||
    !s.postalCode?.trim()
  ) {
    return res.status(400).json({ error: 'Please complete all required shipping fields.' });
  }

  const paymentMethod = body.paymentMethod === 'cod' ? 'cod' : 'card';
  const deliveryMethod = body.deliveryMethod === 'express' ? 'express' : 'standard';

  const resolvedItems: OrderItemSnapshot[] = [];
  let subtotal = 0;

  for (const item of body.items) {
    const product = productsList.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item.productId}` });
    }
    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
    if (product.stock < qty) {
      return res.status(409).json({
        error: `Insufficient stock for ${product.name} (${product.stock} remaining).`,
      });
    }
    const variant =
      product.variants.find((v) => v.id === item.variantId) || product.variants[0];
    const unitPrice = product.price + variant.priceDelta;
    subtotal += unitPrice * qty;

    resolvedItems.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      variantLabel: variant.label,
      sku: `${product.sku}-${variant.skuSuffix}`,
      unitPrice,
      quantity: qty,
    });
  }

  // Deduct stock after validation
  for (const item of body.items) {
    const product = productsList.find((p) => p.id === item.productId);
    if (product) {
      const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
      product.stock = Math.max(0, product.stock - qty);
    }
  }

  const shippingCost =
    deliveryMethod === 'express' ? 2500 : subtotal >= 25000 ? 0 : 850;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  orderSequence += 1;
  const orderNumber = `PMC-${orderSequence}`;
  const trackingCode = `${deliveryMethod === 'express' ? 'TCS' : 'LEO'}-${Math.floor(
    10000000 + Math.random() * 89999999
  )}`;

  const newOrder: Order = {
    orderNumber,
    userId: user?.id,
    status: 'Confirmed',
    paymentMethod,
    deliveryMethod,
    subtotal,
    shippingCost,
    tax,
    total,
    carrier:
      deliveryMethod === 'express' ? 'TCS Prime Express' : 'Leopards Insured Ground',
    trackingCode,
    estimatedDelivery:
      deliveryMethod === 'express' ? '1–2 Business Days' : '3–5 Business Days',
    createdAt: new Date().toISOString(),
    shipping: {
      fullName: s.fullName.trim(),
      email: s.email.trim(),
      phone: s.phone.trim(),
      address: s.address.trim(),
      city: s.city.trim(),
      state: (s.state || '').trim(),
      postalCode: s.postalCode.trim(),
      country: (s.country || 'Pakistan').trim(),
    },
    items: resolvedItems,
    timeline: buildTimelineForStatus('Confirmed', trackingCode, paymentMethod, total),
  };

  ordersByNumber.set(orderNumber, newOrder);
  return res.status(201).json({ order: newOrder });
});

app.get('/api/orders/mine', (req: Request, res: Response) => {
  const user = getCustomerUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to view your orders.' });
  }
  const userOrders = Array.from(ordersByNumber.values())
    .filter((o) => o.userId === user.id || o.shipping.email.toLowerCase() === user.email)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return res.json({ orders: userOrders });
});

app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
  const raw = String(req.params.orderNumber || '').trim().toUpperCase();
  const order = ordersByNumber.get(raw);
  if (!order) {
    return res.status(404).json({
      error: `No order found matching "${raw}". Try PMC-1042, PMC-1045, or PMC-1038.`,
    });
  }
  const safeOrder: Order = {
    ...order,
    shipping: {
      ...order.shipping,
      address: 'Verified Destination Address',
      phone: '***-***-' + order.shipping.phone.slice(-4),
    },
  };
  return res.json({ order: safeOrder });
});

// Contact & Support
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, topic, message } = req.body as {
    name?: string;
    email?: string;
    topic?: string;
    message?: string;
  };
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const ticketId = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
  const entry: ContactInquiry = {
    ticketId,
    name: name.trim(),
    email: email.trim(),
    topic: (topic || 'General Hardware Inquiry').trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };
  inquiries.push(entry);
  return res.status(201).json({
    ticketId: entry.ticketId,
    receivedAt: entry.createdAt,
  });
});

// ============================================================================
// ADMIN AUTHENTICATION & PROTECTED ADMIN APIs (STRICTLY ISOLATED)
// ============================================================================

app.get('/api/admin/status', (_req: Request, res: Response) => {
  const envConfigured = Boolean((process.env.ADMIN_PASSWORD || '').trim());
  const claimed = Boolean(claimedAdmin);
  res.json({
    envConfigured,
    claimed,
    ready: envConfigured || claimed,
  });
});

app.post('/api/admin/claim', (req: Request, res: Response) => {
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPass || claimedAdmin) {
    return res.status(409).json({
      error: 'Admin access has already been configured. Please sign in.',
    });
  }

  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Admin name must be at least 2 characters.' });
  }
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Valid admin email is required.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({
      error: 'Admin password must be at least 8 characters long.',
    });
  }

  claimedAdmin = {
    id: `adm_${crypto.randomBytes(8).toString('hex')}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  };

  const token = signToken(claimedAdmin.id, 'admin', {
    email: claimedAdmin.email,
    name: claimedAdmin.name,
  });

  return res.status(201).json({
    token,
    admin: {
      id: claimedAdmin.id,
      name: claimedAdmin.name,
      email: claimedAdmin.email,
      role: 'admin',
    } satisfies AdminProfile,
  });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
    return res.status(400).json({ error: 'Valid admin email and password are required.' });
  }

  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPass) {
    if (!timingSafeCompareStrings(password, envPass)) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
    const adminProfile: AdminProfile = {
      id: 'adm_env',
      name: 'Store Administrator',
      email: normalizedEmail,
      role: 'admin',
    };
    const token = signToken(adminProfile.id, 'admin', {
      email: adminProfile.email,
      name: adminProfile.name,
    });
    return res.json({ token, admin: adminProfile });
  }

  if (!claimedAdmin) {
    return res.status(403).json({
      error: 'Admin setup is not complete yet. Claim the admin account first.',
    });
  }

  if (
    normalizedEmail !== claimedAdmin.email ||
    !verifyPassword(password, claimedAdmin.passwordHash)
  ) {
    return res.status(401).json({ error: 'Invalid admin email or password.' });
  }

  const adminProfile: AdminProfile = {
    id: claimedAdmin.id,
    name: claimedAdmin.name,
    email: claimedAdmin.email,
    role: 'admin',
  };
  const token = signToken(adminProfile.id, 'admin', {
    email: adminProfile.email,
    name: adminProfile.name,
  });
  return res.json({ token, admin: adminProfile });
});

app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ admin: req.admin });
});

// Admin Product Management
app.get('/api/admin/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ products: productsList, categories: categoriesList });
});

app.post('/api/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as Partial<Product> & { variantLabel?: string };

  if (!body.name?.trim() || !body.brand?.trim() || !body.category?.trim()) {
    return res.status(400).json({ error: 'Product name, brand, and category are required.' });
  }
  if (!categoriesList.includes(body.category.trim())) {
    return res.status(400).json({ error: 'Selected category does not exist.' });
  }
  const price = Math.round(Number(body.price));
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Price in PKR must be a positive number.' });
  }
  const stock = Math.max(0, Math.floor(Number(body.stock ?? 0)));
  const compareAtPrice =
    body.compareAtPrice && Number(body.compareAtPrice) > price
      ? Math.round(Number(body.compareAtPrice))
      : undefined;

  const sku = (body.sku || `PMC-${Date.now().toString().slice(-5)}`).trim().toUpperCase();
  const baseSlug = slugify(body.name.trim()) || `product-${Date.now()}`;
  const slug = productsList.some((p) => p.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString().slice(-4)}`
    : baseSlug;

  const sanitizedImage = sanitizeImageUrl(body.imageUrl);
  if (body.imageUrl && body.imageUrl.trim() && !sanitizedImage) {
    return res.status(400).json({
      error: 'Product image URL must be a valid https:// or http:// URL or a studio preset.',
    });
  }

  const newProduct: Product = {
    id: `prod_${crypto.randomBytes(5).toString('hex')}`,
    slug,
    sku,
    name: body.name.trim(),
    brand: body.brand.trim(),
    category: body.category.trim(),
    price,
    compareAtPrice,
    imageUrl: sanitizedImage,
    stock,
    rating: 4.8,
    reviewCount: 0,
    shortDesc: (body.shortDesc || `${body.brand.trim()} ${body.name.trim()}`).trim(),
    description: (
      body.description ||
      body.shortDesc ||
      `${body.brand.trim()} ${body.name.trim()} backed by official warranty.`
    ).trim(),
    warranty: (body.warranty || '1-Year Official Warranty').trim(),
    featured: Boolean(body.featured),
    variants:
      Array.isArray(body.variants) && body.variants.length > 0
        ? body.variants
        : [
            {
              id: 'v1',
              label: (body.variantLabel || 'Standard Edition').trim(),
              priceDelta: 0,
              skuSuffix: 'STD',
            },
          ],
    specs:
      Array.isArray(body.specs) && body.specs.length > 0
        ? body.specs
        : [
            { label: 'Category', value: body.category.trim() },
            { label: 'Brand', value: body.brand.trim() },
          ],
  };

  productsList.unshift(newProduct);
  return res.status(201).json({ product: newProduct });
});

app.put('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = productsList.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const existing = productsList[idx];
  const body = req.body as Partial<Product>;

  if (!body.name?.trim() || !body.brand?.trim() || !body.category?.trim()) {
    return res.status(400).json({ error: 'Name, brand, and category are required.' });
  }
  if (!categoriesList.includes(body.category.trim())) {
    return res.status(400).json({ error: 'Selected category does not exist.' });
  }
  const price = Math.round(Number(body.price));
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Price in PKR must be greater than zero.' });
  }
  const stock = Math.max(0, Math.floor(Number(body.stock ?? existing.stock)));
  const compareAtPrice =
    body.compareAtPrice && Number(body.compareAtPrice) > price
      ? Math.round(Number(body.compareAtPrice))
      : undefined;

  const sanitizedImage =
    body.imageUrl !== undefined ? sanitizeImageUrl(body.imageUrl) : existing.imageUrl;
  if (body.imageUrl && body.imageUrl.trim() && !sanitizedImage) {
    return res.status(400).json({
      error: 'Product image URL must be a valid https:// or http:// URL or a studio preset.',
    });
  }

  const updated: Product = {
    ...existing,
    name: body.name.trim(),
    brand: body.brand.trim(),
    category: body.category.trim(),
    sku: (body.sku || existing.sku).trim().toUpperCase(),
    price,
    compareAtPrice,
    imageUrl: sanitizedImage,
    stock,
    shortDesc: (body.shortDesc ?? existing.shortDesc).trim(),
    description: (body.description ?? existing.description).trim(),
    warranty: (body.warranty ?? existing.warranty).trim(),
    featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
  };

  productsList[idx] = updated;
  return res.json({ product: updated });
});

app.patch(
  '/api/admin/products/:id/stock',
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const product = productsList.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const nextStock = Math.floor(Number((req.body as { stock?: number }).stock));
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative integer.' });
    }
    product.stock = nextStock;
    return res.json({ product });
  }
);

app.delete('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = productsList.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const [removed] = productsList.splice(idx, 1);
  return res.json({ deletedId: removed.id });
});

// Admin Category Management
app.get('/api/admin/categories', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const summary = categoriesList.map((name) => {
    const matching = productsList.filter((p) => p.category === name);
    return {
      name,
      productCount: matching.length,
      totalStock: matching.reduce((sum, p) => sum + p.stock, 0),
      inventoryValue: matching.reduce((sum, p) => sum + p.stock * p.price, 0),
    };
  });
  res.json({ categories: summary });
});

app.post('/api/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const name = String((req.body as { name?: string }).name || '').trim();
  if (name.length < 2) {
    return res.status(400).json({ error: 'Category name must be at least 2 characters.' });
  }
  if (categoriesList.some((c) => c.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: 'Category already exists.' });
  }
  categoriesList.push(name);
  return res.status(201).json({ category: name, categories: categoriesList });
});

app.patch(
  '/api/admin/categories/:name',
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    const oldName = decodeURIComponent(String(req.params.name || '')).trim();
    const newName = String((req.body as { newName?: string }).newName || '').trim();

    const idx = categoriesList.findIndex((c) => c === oldName);
    if (idx === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    if (newName.length < 2) {
      return res.status(400).json({ error: 'New category name must be at least 2 characters.' });
    }
    if (
      newName.toLowerCase() !== oldName.toLowerCase() &&
      categoriesList.some((c) => c.toLowerCase() === newName.toLowerCase())
    ) {
      return res.status(409).json({ error: 'Target category name already exists.' });
    }

    categoriesList[idx] = newName;
    for (const p of productsList) {
      if (p.category === oldName) {
        p.category = newName;
      }
    }
    return res.json({ oldName, newName, categories: categoriesList });
  }
);

app.delete(
  '/api/admin/categories/:name',
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    const name = decodeURIComponent(String(req.params.name || '')).trim();
    const idx = categoriesList.findIndex((c) => c === name);
    if (idx === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    const productCount = productsList.filter((p) => p.category === name).length;
    if (productCount > 0) {
      return res.status(409).json({
        error: `Cannot delete "${name}" while ${productCount} product(s) belong to it. Reassign or delete those products first.`,
      });
    }
    categoriesList.splice(idx, 1);
    return res.json({ deleted: name, categories: categoriesList });
  }
);

// Admin Order Management & Status Updates
app.get('/api/admin/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orders = Array.from(ordersByNumber.values()).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
  res.json({ orders });
});

app.patch(
  '/api/admin/orders/:orderNumber/status',
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    const raw = String(req.params.orderNumber || '').trim().toUpperCase();
    const order = ordersByNumber.get(raw);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const { status, carrier, trackingCode, note } = req.body as {
      status?: OrderStatus;
      carrier?: string;
      trackingCode?: string;
      note?: string;
    };

    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status provided.' });
    }

    order.status = status;
    if (carrier?.trim()) order.carrier = carrier.trim();
    if (trackingCode?.trim()) order.trackingCode = trackingCode.trim().toUpperCase();
    if (status === 'Delivered') {
      order.estimatedDelivery = `Delivered ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }

    order.timeline = buildTimelineForStatus(
      status,
      order.trackingCode,
      order.paymentMethod,
      order.total,
      note
    );

    return res.json({ order });
  }
);

// Admin Sales & Inventory Reports
app.get('/api/admin/reports', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const allOrders = Array.from(ordersByNumber.values());
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = allOrders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalUnitsSold = allOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );

  const totalInventoryValue = productsList.reduce(
    (sum, p) => sum + p.price * p.stock,
    0
  );
  const lowStockCount = productsList.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = productsList.filter((p) => p.stock === 0).length;

  const categoryRevenueMap = new Map<string, { revenue: number; units: number }>();
  for (const order of allOrders) {
    for (const item of order.items) {
      const current = categoryRevenueMap.get(item.category) || { revenue: 0, units: 0 };
      current.revenue += item.unitPrice * item.quantity;
      current.units += item.quantity;
      categoryRevenueMap.set(item.category, current);
    }
  }

  const categoryBreakdown = categoriesList.map((category) => {
    const sales = categoryRevenueMap.get(category) || { revenue: 0, units: 0 };
    const catProducts = productsList.filter((p) => p.category === category);
    return {
      category,
      revenue: sales.revenue,
      units: sales.units,
      productCount: catProducts.length,
      stockUnits: catProducts.reduce((sum, p) => sum + p.stock, 0),
    };
  });

  const statusBreakdown = VALID_ORDER_STATUSES.map((status) => ({
    status,
    count: allOrders.filter((o) => o.status === status).length,
  }));

  const cardOrders = allOrders.filter((o) => o.paymentMethod === 'card');
  const codOrders = allOrders.filter((o) => o.paymentMethod === 'cod');

  const report: SalesReportSummary = {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalUnitsSold,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
    categoryBreakdown,
    statusBreakdown,
    paymentBreakdown: {
      cardCount: cardOrders.length,
      cardRevenue: cardOrders.reduce((s, o) => s + o.total, 0),
      codCount: codOrders.length,
      codRevenue: codOrders.reduce((s, o) => s + o.total, 0),
    },
  };

  res.json({ report });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distDir = path.join(__dirname, 'dist', 'client');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req: Request, res: Response) => {
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        const error = err as Error;
        vite.ssrFixStacktrace(error);
        res.status(500).end(error.message);
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Prime Mobile Computer running on http://${HOST}:${PORT}`);
  });
}

startServer();
