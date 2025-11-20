import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// ✅ Initialize Firebase Admin
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
const WEBHOOK_SECRET = process.env.REACT_APP_RAZORPAY_WEBHOOK_SECRET || '';

// Verify Razorpay signature
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

// Calculate end date (30 days from now)
function calculateEndDate(): string {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return endDate.toISOString();
}

// ✨ NEW: Handle subscription charged (Payment Successful)
async function handleSubscriptionCharged(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  if (!userId) {
    console.error('❌ No userId in subscription notes');
    throw new Error('No userId found');
  }

  const endDate = calculateEndDate();

  try {
    await db.collection('users').doc(userId).update({
      'subscription.tier': tier,
      'subscription.status': 'active',
      'subscription.razorpaySubscriptionId': entity.id,
      'subscription.razorpayPaymentId': entity.payment_id,
      'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.endDate': endDate,
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription activated for user ${userId} - Tier: ${tier}`);
    console.log(`📅 Valid until: ${endDate}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

// ✨ NEW: Handle subscription cancelled
async function handleSubscriptionCancelled(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  if (!userId) {
    console.warn('⚠️ No userId in cancellation');
    return;
  }

  try {
    await db.collection('users').doc(userId).update({
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling cancellation:', error);
    throw error;
  }
}

// ✨ NEW: Handle subscription completed (Expired)
async function handleSubscriptionCompleted(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  if (!userId) {
    console.warn('⚠️ No userId in completion');
    return;
  }

  try {
    // Downgrade to free tier
    await db.collection('users').doc(userId).update({
      'subscription.tier': 'free',
      'subscription.status': 'completed',
      'subscription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription completed and downgraded to free for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling completion:', error);
    throw error;
  }
}

// ✨ MAIN HANDLER
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('═══════════════════════════════════════');
  console.log('🔔 Razorpay Webhook Received');
  console.log('═══════════════════════════════════════');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const payload = JSON.stringify(req.body);

    if (!WEBHOOK_SECRET) {
      console.error('❌ Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret missing' });
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('⚠️ Invalid signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ Signature verified');

    const { event, payload: eventPayload } = req.body;
    console.log(`🔔 Event: ${event}`);

    // Route to appropriate handler
    switch (event) {
      // Subscription events
      case 'subscription.charged':
        await handleSubscriptionCharged(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.activated':
        // Treat activation same as charged (first payment)
        await handleSubscriptionCharged(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(eventPayload.subscription || eventPayload);
        break;

      // Keep existing payment capture for backward compatibility if needed
      // case 'payment.captured': ...

      default:
        console.log(`⚠️ Unhandled event: ${event}`);
    }

    console.log('✅ Webhook processed successfully');
    return res.status(200).json({ success: true, event });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}
