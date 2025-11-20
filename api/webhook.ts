import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Initialize Firebase Admin
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
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}

// Calculate 30-day expiration
function calculateEndDate(): string {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return endDate.toISOString();
}

// Handle subscription.charged (payment successful)
async function handleSubscriptionCharged(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  console.log(`💳 Processing payment for user: ${userId}, tier: ${tier}`);

  if (!userId) {
    console.error('❌ No userId in subscription notes');
    throw new Error('No userId found in subscription notes');
  }

  const endDate = calculateEndDate();

  await db.collection('users').doc(userId).update({
    'subscription.tier': tier,
    'subscription.status': 'active',
    'subscription.razorpaySubscriptionId': entity.id,
    'subscription.razorpayPaymentId': entity.payment_id || '',
    'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
    'subscription.endDate': endDate,
    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    'hasSeenPlanModal': true,
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription activated: ${userId} - ${tier}`);
  console.log(`📅 Expires: ${endDate}`);
}

// Handle subscription.cancelled
async function handleSubscriptionCancelled(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  if (!userId) return;

  await db.collection('users').doc(userId).update({
    'subscription.status': 'cancelled',
    'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`🚫 Subscription cancelled: ${userId}`);
}

// Handle subscription.completed (expired)
async function handleSubscriptionCompleted(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  if (!userId) return;

  await db.collection('users').doc(userId).update({
    'subscription.tier': 'free',
    'subscription.status': 'completed',
    'subscription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`🏁 Subscription expired and downgraded: ${userId}`);
}

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 Webhook received:', new Date().toISOString());

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const payload = JSON.stringify(req.body);

    if (!WEBHOOK_SECRET) {
      console.error('❌ Webhook secret not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event, payload: eventPayload } = req.body;
    console.log(`📬 Event: ${event}`);

    // Route to handlers
    switch (event) {
      case 'subscription.charged':
      case 'subscription.activated':
        await handleSubscriptionCharged(eventPayload.subscription || eventPayload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(eventPayload.subscription || eventPayload);
        break;
      case 'subscription.completed':
        await handleSubscriptionCompleted(eventPayload.subscription || eventPayload);
        break;
      default:
        console.log(`⚠️ Unhandled event: ${event}`);
    }

    return res.status(200).json({ success: true, event });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
