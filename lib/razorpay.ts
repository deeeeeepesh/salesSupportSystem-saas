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

export async function createRazorpayCustomer(params: {
  name: string;
  email: string;
  contact?: string;
}) {
  return getRazorpay().customers.create(params);
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
