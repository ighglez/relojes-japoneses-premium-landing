import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const downloads = sqliteTable('downloads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: text('ts').notNull(),
  refCode: text('ref_code'),
  ipHash: text('ip_hash').notNull(),
  uaSnippet: text('ua_snippet').notNull(),
});

export const referrals = sqliteTable('referrals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  refCode: text('ref_code').notNull().unique(),
  totalCount: integer('total_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  city: text('city').notNull(),
  text: text('text').notNull(),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  name: text('name'),
  model: text('model'),
  message: text('message'),
  source: text('source').notNull(),
  ts: text('ts').notNull(),
});

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: text('access_token_expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  source: text('source').notNull(),
  createdAt: text('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  series: text('series').notNull(),
  reference: text('reference').notNull().unique(),
  description: text('description'),
  movement: text('movement'),
  diameter: text('diameter'),
  color: text('color'),
  waterResistance: text('water_resistance'),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('EUR'),
  stock: integer('stock').notNull().default(0),
  category: text('category').notNull(),
  isNew: integer('is_new', { mode: 'boolean' }).notNull().default(false),
  isExclusive: integer('is_exclusive', { mode: 'boolean' }).notNull().default(false),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  images: text('images', { mode: 'json' }),
  features: text('features', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id),
  sessionId: text('session_id'),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  userId: text('user_id').references(() => user.id),
  guestEmail: text('guest_email'),
  guestName: text('guest_name'),
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discount_amount').notNull().default(0),
  total: real('total').notNull(),
  couponCode: text('coupon_code'),
  paymentMethod: text('payment_method').notNull(),
  paymentId: text('payment_id'),
  status: text('status').notNull().default('pending'),
  shippingName: text('shipping_name').notNull(),
  shippingEmail: text('shipping_email').notNull(),
  shippingPhone: text('shipping_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: text('shipping_city').notNull(),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  productReference: text('product_reference').notNull(),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: real('subtotal').notNull(),
  createdAt: text('created_at').notNull(),
});

export const coupons = sqliteTable('coupons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  value: real('value').notNull(),
  minPurchase: real('min_purchase'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  oneTimePerUser: integer('one_time_per_user', { mode: 'boolean' }).notNull().default(false),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const couponRedemptions = sqliteTable('coupon_redemptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  couponId: integer('coupon_id').references(() => coupons.id),
  userId: text('user_id').references(() => user.id),
  email: text('email').notNull(),
  orderId: integer('order_id').references(() => orders.id),
  redeemedAt: text('redeemed_at').notNull(),
});

export const wishlists = sqliteTable('wishlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  productId: integer('product_id').references(() => products.id),
  createdAt: text('created_at').notNull(),
});

export const stockNotifications = sqliteTable('stock_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id),
  email: text('email').notNull(),
  notified: integer('notified', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  notifiedAt: text('notified_at'),
});