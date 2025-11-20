import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

// Enable CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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
    const { userId, userEmail, userName, tier } = req.body;

    console.log('📦 Create subscription request:', { userId, userEmail, tier });

    // Validate inputs
    if (!userId || !userEmail || !tier) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userEmail, tier' 
      });
    }

    // Get plan ID based on tier
    const planId = tier === 'style_plus'
      ? process.env.REACT_APP_RAZORPAY_PLAN_STYLEPLUS
      : process.env.REACT_APP_RAZORPAY_PLAN_STYLEX;

    if (!planId) {
      console.error(`❌ Plan ID not found for tier: ${tier}`);
      return res.status(500).json({ 
        error: `Plan ID not configured for tier: ${tier}` 
      });
    }

    console.log(`✅ Using plan ID: ${planId}`);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    console.log(`🔧 Creating subscription for user ${userId}, tier: ${tier}`);

    // ✨ Create NEW subscription (fresh subscription_id every time)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 1, // 1 billing cycle = 1 month
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: userId, // ✅ Critical: Pass userId for webhook
        tier: tier,
        email: userEmail,
        name: userName,
      },
    });

    console.log(`✅ Subscription created successfully: ${subscription.id}`);
    console.log(`🔗 Payment URL: ${subscription.short_url}`);

    return res.status(200).json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url, // Razorpay payment page URL
      status: subscription.status,
    });

  } catch (error: any) {
    console.error('❌ Error creating subscription:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message,
      details: error.response?.data || error.toString(),
    });
  }
}
