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
const WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET || '';

const VARIANT_TIER_MAP: Record<string, 'style_plus' | 'style_x'> = {
  [process.env.LEMON_STYLE_PLUS_VARIANT_ID || '']: 'style_plus',
  [process.env.LEMON_STYLE_X_VARIANT_ID || '']: 'style_x',
};

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

async function handleSubscriptionCreated(data: any): Promise<void> {
  const { id, attributes } = data;
  const { variant_id, customer_id } = attributes;
  const customData = attributes.custom_data || {};
  const userId = customData.user_id;

  if (!userId) return;

  const tier = VARIANT_TIER_MAP[String(variant_id)];
  if (!tier) return;

  try {
    await db.collection('users').doc(userId).update({
      subscription: {
        tier,
        status: 'active',
        subscriptionId: id,
        customerId: String(customer_id),
        startDate: new Date().toISOString(),
      },
      hasSeenPlanModal: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription created for user ${userId} - Tier: ${tier}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(data: any): Promise<void> {
  const { attributes } = data;
  const { variant_id, status } = attributes;
  const customData = attributes.custom_data || {};
  const userId = customData.user_id;

  if (!userId) return;

  const tier = VARIANT_TIER_MAP[String(variant_id)];
  if (!tier) return;

  try {
    await db.collection('users').doc(userId).update({
      'subscription.status': status,
      'subscription.tier': tier,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(data: any): Promise<void> {
  const { attributes } = data;
  const customData = attributes.custom_data || {};
  const userId = customData.user_id;

  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      subscription: {
        tier: 'free',
        status: 'cancelled',
        startDate: new Date().toISOString(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = (req.headers['x-signature'] as string) || '';
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
      console.warn('Invalid signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { meta, data } = req.body;
    const eventName = meta?.event_name;

    console.log(`🔔 Webhook: ${eventName}`);

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(data);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(data);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data);
        break;
      default:
        console.log(`⚠️ Unhandled: ${eventName}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error' });
  }
}
