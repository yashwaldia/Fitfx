const Razorpay = require('razorpay');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, userName, tier } = req.body;
    
    console.log('═══════════════════════════════════════');
    console.log('📦 Create Subscription Request');
    console.log(`👤 User: ${userId} (${userEmail})`);
    console.log(`🎯 Tier: ${tier}`);

    if (!userId || !tier) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing userId or tier' });
    }

    // Get environment variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planStylePlus = process.env.RAZORPAY_PLAN_STYLEPLUS;
    const planStyleX = process.env.RAZORPAY_PLAN_STYLEX;

    console.log('🔐 Environment Check:');
    console.log(`  KEY_ID: ${keyId ? '✅' : '❌ MISSING'}`);
    console.log(`  KEY_SECRET: ${keySecret ? '✅' : '❌ MISSING'}`);
    console.log(`  PLAN_STYLEPLUS: ${planStylePlus || '❌ MISSING'}`);
    console.log(`  PLAN_STYLEX: ${planStyleX || '❌ MISSING'}`);

    if (!keyId || !keySecret) {
      console.error('❌ Razorpay credentials missing');
      return res.status(500).json({
        error: 'Server configuration error: Razorpay credentials not configured'
      });
    }

    // Select plan ID
    let planId = '';
    if (tier === 'style_plus') {
      planId = planStylePlus || '';
    } else if (tier === 'style_x') {
      planId = planStyleX || '';
    }

    if (!planId) {
      console.error(`❌ Plan ID not found for tier: ${tier}`);
      return res.status(500).json({
        error: `Plan ID not configured for tier: ${tier}`
      });
    }

    console.log(`✅ Using plan ID: ${planId}`);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log('📤 Creating subscription...');
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: userId,
        tier: tier,
        userEmail: userEmail || '',
        userName: userName || '',
      },
    });

    console.log('✅ Subscription created!');
    console.log(`   ID: ${subscription.id}`);
    console.log(`   URL: ${subscription.short_url}`);

    return res.status(200).json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      status: subscription.status,
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR:', error.message);
    console.error('═══════════════════════════════════════');
    
    return res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message,
      details: error.error?.description || error.toString()
    });
  }
};
