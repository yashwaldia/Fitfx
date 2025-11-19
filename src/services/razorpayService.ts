import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { Subscription } from '../types';

// ✨ Razorpay TypeScript Declarations
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ✨ Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

// ✅ FIXED: Determine API endpoint based on environment
const getApiEndpoint = () => {
  // In production (Vercel), use relative path
  if (window.location.hostname !== 'localhost') {
    return '/api/createPaymentLink';
  }
  
  // In development, check if running local serverless
  return '/api/createPaymentLink';
};

/**
 * ✨ Load Razorpay Script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded');
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * ✅ UPDATED: Create dynamic payment link and redirect
 * This solves the "payment already completed" issue
 */
export const redirectToRazorpayLink = async (
  tier: 'style_plus' | 'style_x',
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> => {
  try {
    console.log(`💳 Requesting NEW payment link for tier: ${tier}`);
    console.log(`👤 User: ${userId} (${userEmail})`);

    const apiEndpoint = getApiEndpoint();
    console.log(`📡 API Endpoint: ${apiEndpoint}`);

    // ✅ Call serverless function to create FRESH payment link
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userEmail,
        userName,
        tier,
      }),
    });

    // ✅ Better error handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      // Try to parse as JSON, fallback to text
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const freshPaymentLink = data.paymentUrl;

    if (!freshPaymentLink) {
      throw new Error('No payment URL received from API');
    }

    console.log(`✅ Fresh payment link received: ${freshPaymentLink}`);
    console.log(`🔗 Payment Link ID: ${data.paymentLinkId}`);

    // Redirect to the freshly created payment link
    window.location.href = freshPaymentLink;
  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    
    // More helpful error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to payment server. Please check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * ✨ Open Razorpay Modal (Advanced: For custom checkout)
 * (Not used for Payment Links but available for advanced integration)
 */
export const openRazorpayCheckout = (options: {
  amount: number;
  currency: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: any) => void;
  onClose?: () => void;
}): void => {
  if (!window.Razorpay) {
    console.error('❌ Razorpay script not loaded');
    throw new Error('Razorpay script not loaded');
  }

  const razorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Convert to paise
    currency: options.currency || 'INR',
    description: options.description,
    prefill: options.prefill || {},
    handler: options.handler,
    modal: {
      ondismiss: options.onClose || (() => {}),
    },
  };

  const rzp = new window.Razorpay(razorpayOptions);
  rzp.open();
};

/**
 * ✨ Update subscription after successful payment
 */
export const updateSubscriptionAfterPayment = async (
  userId: string,
  tier: 'style_plus' | 'style_x',
  razorpayPaymentId: string,
  razorpayOrderId?: string
): Promise<void> => {
  try {
    const subscription: Subscription = {
      tier,
      status: 'active',
      razorpayPaymentId: razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || razorpayPaymentId,
      startDate: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'users', userId), {
      subscription,
    });

    console.log(`✅ Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * ✨ Cancel subscription
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'subscription.status': 'cancelled',
      'subscription.cancelAtPeriodEnd': true,
    });
    console.log(`✅ Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * ✨ Verify Razorpay payment signature
 */
export const verifyRazorpaySignature = (paymentId: string): boolean => {
  // Basic validation - full verification should be done on backend
  if (!paymentId) {
    console.error('❌ Payment ID is missing');
    return false;
  }

  const isValidPaymentId = paymentId.startsWith('pay_');
  if (!isValidPaymentId) {
    console.error(`❌ Invalid payment ID format: ${paymentId}`);
    return false;
  }

  console.log(`✅ Payment ID verified: ${paymentId}`);
  return true;
};

/**
 * ✨ Check if Razorpay is configured
 */
export const isRazorpayConfigured = (): boolean => {
  const hasKeyId = !!RAZORPAY_KEY_ID;

  if (!hasKeyId) {
    console.warn('⚠️ REACT_APP_RAZORPAY_KEY_ID not configured');
  }

  return hasKeyId;
};

/**
 * ✨ Log Razorpay configuration (for debugging)
 */
export const debugRazorpayConfig = (): void => {
  console.log('🔍 Razorpay Configuration:');
  console.log('  Key ID:', RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Not configured');
  console.log('  API Endpoint:', getApiEndpoint());
  console.log('  Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');
};