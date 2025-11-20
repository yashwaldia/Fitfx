import type { VercelRequest, VercelResponse } from '@vercel/node';
// ✅ FIXED: Use require for CommonJS compatibility
const Razorpay = require('razorpay');
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

    if (!userId || !subscriptionId) {
      return res.status(400).json({ error: 'Missing userId or subscriptionId' });
    }

    console.log(`🚫 Cancelling subscription: ${subscriptionId} for user: ${userId}`);

    // Initialize Razorpay
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.REACT_APP_RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('❌ Razorpay credentials missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Cancel subscription on Razorpay
    await razorpay.subscriptions.cancel(subscriptionId);
    console.log(`✅ Subscription cancelled on Razorpay: ${subscriptionId}`);

    // Update Firestore
    await db.collection('users').doc(userId).update({
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription cancelled in Firestore for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
    });

  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message,
    });
  }
}
