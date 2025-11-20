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


/**
 * ✨ Verify webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) {
    console.error('❌ WEBHOOK_SECRET not configured!');
    return false;
  }
  
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const isValid = hash === signature;
  
  if (!isValid) {
    console.error('❌ Signature mismatch!');
    console.error('Expected:', hash);
    console.error('Received:', signature);
  }
  
  return isValid;
}


/**
 * ✨ Calculate subscription end date (30 days from now)
 */
function calculateEndDate() {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return endDate.toISOString();
}


/**
 * ✅ UPDATED: Handle subscription charged/activated
 */
async function handleSubscriptionCharged(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  console.log('═══════════════════════════════════════');
  console.log('💳 SUBSCRIPTION CHARGED EVENT');
  console.log(`👤 User ID: ${userId}`);
  console.log(`🎯 Tier: ${tier}`);
  console.log(`💰 Payment ID: ${entity.payment_id || 'N/A'}`);
  console.log(`📋 Subscription ID: ${entity.id || 'N/A'}`);
  console.log('═══════════════════════════════════════');

  if (!userId) {
    console.error('❌ No userId found in subscription notes');
    throw new Error('No userId in subscription notes');
  }

  // ✨ Verify user exists in Firestore
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error(`❌ User ${userId} does not exist in Firestore`);
    throw new Error(`User ${userId} not found`);
  }

  const endDate = calculateEndDate();
  const now = new Date().toISOString();

  // ✨ UPDATED: Store complete subscription data
  const subscriptionUpdate = {
    'subscription.tier': tier,
    'subscription.status': 'active',
    'subscription.razorpaySubscriptionId': entity.id || '',
    'subscription.razorpayPaymentId': entity.payment_id || '',
    'subscription.startDate': now,
    'subscription.endDate': endDate,
    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    'subscription.lastPaymentDate': now,
    'hasSeenPlanModal': true,
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  };

  // ✨ NEW: Clear any previous cancellation data
  if (userDoc.data().subscription?.cancelledAt) {
    subscriptionUpdate['subscription.cancelledAt'] = admin.firestore.FieldValue.delete();
  }

  await userRef.update(subscriptionUpdate);

  console.log(`✅ Subscription activated successfully for ${userId}`);
  console.log(`📅 Valid until: ${endDate}`);
}


/**
 * ✅ UPDATED: Handle subscription cancelled
 */
async function handleSubscriptionCancelled(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  console.log('═══════════════════════════════════════');
  console.log('🚫 SUBSCRIPTION CANCELLED EVENT');
  console.log(`👤 User ID: ${userId}`);
  console.log(`📋 Subscription ID: ${entity.id || 'N/A'}`);
  console.log('═══════════════════════════════════════');

  if (!userId) {
    console.warn('⚠️ No userId in cancellation event - skipping');
    return;
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error(`❌ User ${userId} not found`);
    return;
  }

  // ✨ UPDATED: Downgrade to free and mark as cancelled
  await userRef.update({
    'subscription.tier': 'free',
    'subscription.status': 'cancelled',
    'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription cancelled and downgraded to free: ${userId}`);
}


/**
 * ✅ UPDATED: Handle subscription completed/expired
 */
async function handleSubscriptionCompleted(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  console.log('═══════════════════════════════════════');
  console.log('🏁 SUBSCRIPTION COMPLETED EVENT');
  console.log(`👤 User ID: ${userId}`);
  console.log(`📋 Subscription ID: ${entity.id || 'N/A'}`);
  console.log('═══════════════════════════════════════');

  if (!userId) {
    console.warn('⚠️ No userId in completion event - skipping');
    return;
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error(`❌ User ${userId} not found`);
    return;
  }

  // ✨ UPDATED: Mark as expired and downgrade to free
  await userRef.update({
    'subscription.tier': 'free',
    'subscription.status': 'expired',
    'subscription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription expired and downgraded to free: ${userId}`);
}


/**
 * ✨ NEW: Handle subscription paused
 */
async function handleSubscriptionPaused(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  console.log('⏸️ SUBSCRIPTION PAUSED EVENT');
  console.log(`👤 User ID: ${userId}`);

  if (!userId) {
    console.warn('⚠️ No userId in paused event - skipping');
    return;
  }

  await db.collection('users').doc(userId).update({
    'subscription.status': 'paused',
    'subscription.pausedAt': admin.firestore.FieldValue.serverTimestamp(),
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription paused: ${userId}`);
}


/**
 * ✨ NEW: Handle subscription resumed
 */
async function handleSubscriptionResumed(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  console.log('▶️ SUBSCRIPTION RESUMED EVENT');
  console.log(`👤 User ID: ${userId}`);

  if (!userId) {
    console.warn('⚠️ No userId in resumed event - skipping');
    return;
  }

  await db.collection('users').doc(userId).update({
    'subscription.status': 'active',
    'subscription.resumedAt': admin.firestore.FieldValue.serverTimestamp(),
    'subscription.pausedAt': admin.firestore.FieldValue.delete(),
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription resumed: ${userId}`);
}


/**
 * ✨ NEW: Handle payment failed
 */
async function handlePaymentFailed(data) {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  const userId = notes.userId || notes.user_id;

  console.log('❌ PAYMENT FAILED EVENT');
  console.log(`👤 User ID: ${userId}`);

  if (!userId) {
    console.warn('⚠️ No userId in payment failed event - skipping');
    return;
  }

  // Mark subscription as payment_failed (don't downgrade yet - give user chance to retry)
  await db.collection('users').doc(userId).update({
    'subscription.status': 'payment_failed',
    'subscription.lastFailedPayment': admin.firestore.FieldValue.serverTimestamp(),
    'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`⚠️ Payment failed for user: ${userId}`);
}


/**
 * ✅ MAIN WEBHOOK HANDLER
 */
module.exports = async function handler(req, res) {
  console.log('\n🔔 ═══════════ WEBHOOK RECEIVED ═══════════');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📡 Method: ${req.method}`);

  if (req.method !== 'POST') {
    console.error('❌ Invalid method');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✨ UPDATED: Strict webhook secret validation
    if (!WEBHOOK_SECRET) {
      console.error('❌ CRITICAL: WEBHOOK_SECRET not configured!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Webhook secret not configured' 
      });
    }

    const signature = req.headers['x-razorpay-signature'] || '';
    
    if (!signature) {
      console.error('❌ No signature provided in request');
      return res.status(401).json({ error: 'No signature provided' });
    }

    const payload = JSON.stringify(req.body);

    // ✅ Verify signature
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.error('❌ Invalid webhook signature - possible security breach!');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Signature verified');

    const { event, payload: eventPayload } = req.body;
    
    if (!event) {
      console.error('❌ No event type in webhook payload');
      return res.status(400).json({ error: 'No event type' });
    }

    console.log(`📬 Event Type: ${event}`);

    // ✅ Handle different webhook events
    switch (event) {
      case 'subscription.charged':
        await handleSubscriptionCharged(eventPayload.subscription || eventPayload.payment || eventPayload);
        break;

      case 'subscription.activated':
        await handleSubscriptionCharged(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(eventPayload.subscription || eventPayload);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(eventPayload.subscription || eventPayload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(eventPayload.payment || eventPayload);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event}`);
        console.log('📦 Event payload:', JSON.stringify(eventPayload, null, 2));
    }

    console.log('✅ Webhook processed successfully');
    console.log('═══════════════════════════════════════\n');

    return res.status(200).json({ 
      success: true, 
      event,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ ═══════════ WEBHOOK ERROR ═══════════');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('═══════════════════════════════════════\n');

    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      // ✨ Don't expose full error in production
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
