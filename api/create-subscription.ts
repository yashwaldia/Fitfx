import type { VercelRequest, VercelResponse } from '@vercel/node';

const Razorpay = require('razorpay');

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
    
    console.log(`📦 Creating subscription for ${tier}`);
    console.log(`👤 User: ${userId} (${userEmail})`);

    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing userId or tier' });
    }

    // Get environment variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planStylePlus = process.env.RAZORPAY_PLAN_STYLEPLUS;
    const planStyleX = process.env.RAZORPAY_PLAN_STYLEX;

    // Validate credentials
    if (!keyId || !keySecret) {
      console.error('❌ Razorpay credentials missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API credentials' });
    }

    // Select correct plan ID
    let planId = '';
    if (tier === 'style_plus') {
      planId = planStylePlus || '';
    } else if (tier === 'style_x') {
      planId = planStyleX || '';
    }

    if (!planId) {
      console.error(`❌ Plan ID not configured for tier: ${tier}`);
      return res.status(500).json({ error: `Plan not configured for ${tier}` });
    }

    console.log(`📋 Using plan ID: ${planId}`);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: userId,
        tier: tier,
        userEmail: userEmail || '',
        userName: userName || '',
      },
    });

    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`🔗 Payment URL: ${subscription.short_url}`);

    return res.status(200).json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      status: subscription.status,
    });

  } catch (error: any) {
    console.error('❌ Error creating subscription:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message,
      details: error.error?.description || 'Check server logs',
    });
  }
}
