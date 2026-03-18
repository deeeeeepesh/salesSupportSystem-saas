import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy-initialize so the build doesn't fail when env vars are absent
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _razorpay;
}

// Seat prices in paise (INR)
export const SEAT_PRICES = {
  SALES: parseInt(process.env.PRICE_SALES_SEAT || '30000'),        // ₹300
  STORE_MANAGER: parseInt(process.env.PRICE_MANAGER_SEAT || '50000'), // ₹500
  ADMIN: parseInt(process.env.PRICE_ADMIN_SEAT || '70000'),         // ₹700
};

export function calculateMonthlyAmount(
  salesSeats: number,
  managerSeats: number,
  adminSeats: number
): number {
  return (
    salesSeats * SEAT_PRICES.SALES +
    managerSeats * SEAT_PRICES.STORE_MANAGER +
    adminSeats * SEAT_PRICES.ADMIN
  );
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ─── Pricing model constants (paise) ────────────────────────────────────────
const PRICE_STORE_BASE = 200000;
const PRICE_EXTRA_STAFF = 20000;
const PRICE_EXTRA_MANAGER = 50000;
const PRICE_EXTRA_ADMIN = 70000;

/**
 * Calculate the monthly subscription amount in paise.
 * - Base: ₹2,000 for 1 store (includes 1 admin + 1 manager + 4 staff)
 * - Each extra branch: ₹2,000 (includes 1 manager + 4 staff per branch)
 * - Extra admins beyond 1: ₹700 each
 * - Extra managers beyond branchCount: ₹500 each
 * - Extra staff beyond branchCount×4: ₹200 each
 */
export function calcMonthlyAmount(
  adminSeats: number,
  managerSeats: number,
  salesSeats: number,
  branchCount: number
): number {
  const baseCost = PRICE_STORE_BASE;
  const extraBranchCost = Math.max(0, branchCount - 1) * PRICE_STORE_BASE;
  const includedManagers = branchCount;
  const includedStaff = branchCount * 4;
  const extraAdmins = Math.max(0, adminSeats - 1);
  const extraManagers = Math.max(0, managerSeats - includedManagers);
  const extraStaff = Math.max(0, salesSeats - includedStaff);
  return baseCost + extraBranchCost
    + extraAdmins * PRICE_EXTRA_ADMIN
    + extraManagers * PRICE_EXTRA_MANAGER
    + extraStaff * PRICE_EXTRA_STAFF;
}

/**
 * Create a Razorpay order for a one-time payment (e.g. first month subscription).
 */
export async function createRazorpayOrder(amountPaise: number, tenantSlug: string) {
  const order = await getRazorpay().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `sub_${tenantSlug}_${Date.now()}`,
    notes: { tenantSlug },
  });
  return order;
}

/**
 * Create or look up a Razorpay customer.
 */
export async function createRazorpayCustomer(name: string, email: string, phone?: string) {
  const customer = await getRazorpay().customers.create({
    name,
    email,
    contact: phone || '',
  });
  return customer;
}

export async function createRazorpaySubscription(params: {
  customerId: string;
  planId: string;
  totalCount?: number;
  quantity?: number;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const rzp = getRazorpay();
  return rzp.subscriptions.create({
    plan_id: params.planId,
    customer_notify: 1,
    quantity: params.quantity || 1,
    total_count: params.totalCount || 120,
    start_at: params.startAt,
    notes: params.notes,
  } as Parameters<typeof rzp.subscriptions.create>[0]);
}
