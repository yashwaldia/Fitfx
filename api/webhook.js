const admin = require('firebase-admin');
const crypto = require('crypto');

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

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}

function calculateEndDate() {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return endDate.toISOString();
}

async function handleSubscriptionCharged(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  console.log(`💳 Processing payment: ${userId}, tier: ${tier}`);

  if (!userId) {
    throw new Error('No userId in subscription notes');
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

  console.log(`✅ Subscription activated: ${userId}`);
}

async function handleSubscriptionCancelled(data) {
  const notes = (data.entity || data).notes || {};
  const userId = notes.userId || notes.user_id;
  if (!userId) return;

  await db.collection('users').doc(userId).update({
    'subscription.status': 'cancelled',
    'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`🚫 Subscription cancelled: ${userId}`);
}

async function handleSubscriptionCompleted(data) {
  const notes = (data.entity || data).notes || {};
  const userId = notes.userId || notes.user_id;
  if (!userId) return;

  await db.collection('users').doc(userId).update({
    'subscription.tier': 'free',
    'subscription.status': 'completed',
    'subscription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`🏁 Subscription expired: ${userId}`);
}

module.exports = async function handler(req, res) {
  console.log('🔔 Webhook received');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'] || '';
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('⚠️ Invalid signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event, payload: eventPayload } = req.body;
    console.log(`📬 Event: ${event}`);

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

  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

