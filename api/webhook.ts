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

// ✨ Razorpay webhook secret
const WEBHOOK_SECRET = process.env.REACT_APP_RAZORPAY_WEBHOOK_SECRET || '';

// ✨ Razorpay signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  console.log('🔐 Signature verification:');
  console.log('   Expected:', hash);
  console.log('   Received:', signature);
  console.log('   Match:', hash === signature);
  
  return hash === signature;
}

// ✨ UPDATED: Handle payment captured (supports both userId and user_id)
async function handlePaymentCaptured(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  
  // ✨ CRITICAL FIX: Support both camelCase and snake_case
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  console.log('📝 Payment captured - Notes:', JSON.stringify(notes, null, 2));
  console.log('📝 Extracted userId:', userId);
  console.log('📝 Extracted tier:', tier);

  if (!userId) {
    console.error('❌ No userId in payment notes');
    console.error('   Available keys:', Object.keys(notes));
    throw new Error('No userId found in payment notes');
  }

  // ✨ NEW: Calculate endDate (30 days from now)
  // This ensures server-side authority on expiration
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  try {
    await db.collection('users').doc(userId).update({
      'subscription.tier': tier,
      'subscription.status': 'active',
      'subscription.razorpayPaymentId': entity.id,
      'subscription.razorpayOrderId': entity.order_id || entity.id,
      'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
      
      // ✅ SAVE END DATE TO FIRESTORE
      'subscription.endDate': endDate.toISOString(),
      
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Payment captured for user ${userId} - Tier: ${tier}`);
    console.log(`📅 Expiration set to: ${endDate.toISOString()}`);
  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
    throw error;
  }
}

// ✨ UPDATED: Handle payment failed
async function handlePaymentFailed(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  
  // ✨ CRITICAL FIX: Support both camelCase and snake_case
  const userId = notes.userId || notes.user_id;

  if (!userId) {
    console.warn('⚠️ No userId in failed payment');
    return;
  }

  console.error(`❌ Payment failed for user ${userId}`);
  console.error('   Payment ID:', entity.id);
  console.error('   Error:', entity.error_description || 'Unknown error');
  // Optionally: Send email notification
}

// ✨ UPDATED: Handle order paid
async function handleOrderPaid(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  
  // ✨ CRITICAL FIX: Support both camelCase and snake_case
  const userId = notes.userId || notes.user_id;
  const tier = notes.tier || 'style_plus';

  console.log('📝 Order paid - Notes:', JSON.stringify(notes, null, 2));
  console.log('📝 Extracted userId:', userId);
  console.log('📝 Extracted tier:', tier);

  if (!userId) {
    console.error('❌ No userId in order notes');
    throw new Error('No userId found in order notes');
  }

  // ✨ NEW: Calculate endDate (30 days from now)
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  try {
    await db.collection('users').doc(userId).update({
      'subscription.tier': tier,
      'subscription.status': 'active',
      'subscription.razorpayPaymentId': entity.id,
      'subscription.razorpayOrderId': entity.id,
      'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
      
      // ✅ SAVE END DATE TO FIRESTORE
      'subscription.endDate': endDate.toISOString(),
      
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Order paid for user ${userId} - Tier: ${tier}`);
    console.log(`📅 Expiration set to: ${endDate.toISOString()}`);
  } catch (error) {
    console.error('❌ Error handling order paid:', error);
    throw error;
  }
}

// ✨ UPDATED: Handle refund
async function handlePaymentRefunded(data: any): Promise<void> {
  const entity = data.entity || data;
  const notes = entity.notes || {};
  
  // ✨ CRITICAL FIX: Support both camelCase and snake_case
  const userId = notes.userId || notes.user_id;

  if (!userId) {
    console.warn('⚠️ No userId in refund');
    return;
  }

  try {
    await db.collection('users').doc(userId).update({
      'subscription.tier': 'free',
      'subscription.status': 'refunded',
      'subscription.startDate': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
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
  console.log('═══════════════════════════════════════════════════');
  console.log('🔔 Razorpay Webhook Received');
  console.log('   Method:', req.method);
  console.log('   Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ✨ Razorpay uses x-razorpay-signature header
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const payload = JSON.stringify(req.body);

    console.log('📦 Raw webhook body:', JSON.stringify(req.body, null, 2));

    if (!WEBHOOK_SECRET) {
      console.error('❌ Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('⚠️ Invalid Razorpay signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ Signature verified');

    // ✨ Razorpay event structure
    const { event, payload: eventPayload } = req.body;
    
    console.log(`🔔 Razorpay Event: ${event}`);
    console.log(`📦 Event Payload:`, JSON.stringify(eventPayload, null, 2));

    // ✨ Handle Razorpay events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(eventPayload.payment || eventPayload);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(eventPayload.payment || eventPayload);
        break;
        
      case 'order.paid':
        await handleOrderPaid(eventPayload.order || eventPayload);
        break;
        
      case 'payment.refunded':
        await handlePaymentRefunded(eventPayload.refund || eventPayload);
        break;

      case 'payment_link.paid':
        // Payment links send data differently
        await handlePaymentCaptured(eventPayload.payment_link || eventPayload);
        break;
        
      default:
        console.log(`⚠️ Unhandled Razorpay event: ${event}`);
    }

    console.log('✅ Webhook processed successfully');
    return res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
