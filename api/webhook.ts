import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// ✅ Initialize Firebase Admin (SAME AS YOUR CURRENT CODE)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// ✨ CHANGED: Razorpay webhook secret
const WEBHOOK_SECRET = process.env.REACT_APP_RAZORPAY_WEBHOOK_SECRET || '';

// ✨ REMOVED: Variant tier map (not needed for Razorpay)
// We'll get tier from payment notes instead

// ✨ CHANGED: Razorpay signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

// ✨ NEW: Handle payment captured
async function handlePaymentCaptured(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.user_id;
  const tier = notes.tier || 'style_plus';

  if (!userId) {
    console.warn('⚠️ No user_id in payment notes');
    return;
  }

  try {
    await db.collection('users').doc(userId).update({
      subscription: {
        tier,
        status: 'active',
        razorpayPaymentId: entity.id,
        razorpayOrderId: entity.order_id || '',
        startDate: new Date().toISOString(),
      },
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Payment captured for user ${userId} - Tier: ${tier}`);
  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
    throw error;
  }
}

// ✨ NEW: Handle payment failed
async function handlePaymentFailed(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.user_id;

  if (!userId) return;

  console.error(`❌ Payment failed for user ${userId}`);
  // Optionally: Send email notification
}

// ✨ NEW: Handle order paid
async function handleOrderPaid(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.user_id;
  const tier = notes.tier || 'style_plus';

  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      subscription: {
        tier,
        status: 'active',
        razorpayPaymentId: entity.id,
        razorpayOrderId: entity.id,
        startDate: new Date().toISOString(),
      },
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Order paid for user ${userId} - Tier: ${tier}`);
  } catch (error) {
    console.error('❌ Error handling order paid:', error);
    throw error;
  }
}

// ✨ NEW: Handle refund
async function handlePaymentRefunded(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.user_id;

  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      subscription: {
        tier: 'free',
        status: 'refunded',
        startDate: new Date().toISOString(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`💰 Payment refunded for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling refund:', error);
    throw error;
  }
}

// ✨ MAIN HANDLER - Updated for Razorpay
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ✨ CHANGED: Razorpay uses x-razorpay-signature header
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const payload = JSON.stringify(req.body);

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('⚠️ Invalid Razorpay signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✨ CHANGED: Razorpay event structure
    const { event, payload: eventPayload } = req.body;
    
    console.log(`🔔 Razorpay Webhook: ${event}`);

    // ✨ NEW: Handle Razorpay events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(eventPayload.payment);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(eventPayload.payment);
        break;
        
      case 'order.paid':
        await handleOrderPaid(eventPayload.order);
        break;
        
      case 'payment.refunded':
        await handlePaymentRefunded(eventPayload.refund);
        break;
        
      default:
        console.log(`⚠️ Unhandled Razorpay event: ${event}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
