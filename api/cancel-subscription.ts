import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import * as admin from 'firebase-admin';

// Enable CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, subscriptionId } = req.body;

    console.log(`🚫 Cancellation request for user: ${userId}, sub: ${subscriptionId}`);

    if (!userId || !subscriptionId) {
      return res.status(400).json({ 
        error: 'Missing userId or subscriptionId' 
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    console.log(`🔧 Cancelling subscription on Razorpay: ${subscriptionId}`);

    // 1. Cancel on Razorpay
    // Fixed type error: passing false instead of 0
    // Cast to any to avoid type mismatch with SDK definitions
    const cancelledSub: any = await razorpay.subscriptions.cancel(subscriptionId, false);

    console.log(`✅ Razorpay cancellation successful: ${cancelledSub?.id}`);

    // 2. Update Firestore
    await db.collection('users').doc(userId).update({
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Firestore updated for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: cancelledSub,
    });

  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message,
      details: error.response?.data || error.toString(),
    });
  }
}
