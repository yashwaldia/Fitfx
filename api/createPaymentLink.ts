import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
  key_secret: process.env.REACT_APP_RAZORPAY_KEY_SECRET || '',
});

// ✅ CRITICAL: Vercel serverless functions must be exported as default
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers - allows frontend to call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract data from request body
    const { userId, userEmail, userName, tier } = req.body;

    console.log('📦 Received payment link request');
    console.log('   User ID:', userId);
    console.log('   Email:', userEmail);
    console.log('   Tier:', tier);

    // Validate required fields
    if (!userId || !userEmail || !userName || !tier) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'userEmail', 'userName', 'tier'],
        received: { userId, userEmail, userName, tier }
      });
    }

    // Validate Razorpay credentials
    if (!process.env.REACT_APP_RAZORPAY_KEY_ID || !process.env.REACT_APP_RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
      return res.status(500).json({ 
        error: 'Razorpay credentials not configured',
        hint: 'Check REACT_APP_RAZORPAY_KEY_ID and REACT_APP_RAZORPAY_KEY_SECRET in Vercel environment variables'
      });
    }

    // Determine amount based on tier (in paise)
    const amount = tier === 'style_plus' ? 4900 : 9900; // ₹49 or ₹99
    const description = tier === 'style_plus' 
      ? 'Style+ Monthly Subscription' 
      : 'StyleX Monthly Subscription';

    console.log(`💰 Creating ${description} - ₹${amount/100}`);

    // ✅ CREATE NEW PAYMENT LINK via Razorpay API
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount,
      currency: 'INR',
      description: description,
      customer: {
        name: userName,
        email: userEmail,
      },
      notify: {
        sms: false,
        email: true,
      },
      reminder_enable: false,
      notes: {
        userId: userId,
        tier: tier,
      },
      // Redirect URL after payment
      callback_url: `${process.env.REACT_APP_BASE_URL || 'https://fitfx.vercel.app'}/subscription-success`,
      callback_method: 'get',
    });

    console.log('✅ Payment link created successfully!');
    console.log('   Link:', paymentLink.short_url);
    console.log('   ID:', paymentLink.id);

    // Return success response with payment link
    return res.status(200).json({
      success: true,
      paymentUrl: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
    });

  } catch (error: any) {
    console.error('❌ Error creating payment link:', error);
    console.error('   Message:', error.message);
    console.error('   Details:', error.response?.data);
    
    // Return error response
    return res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message,
      details: error.response?.data || error.stack,
    });
  }
}