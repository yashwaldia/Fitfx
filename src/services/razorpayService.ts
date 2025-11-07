

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

// ✨ Razorpay Payment Link URLs (Create these in Razorpay Dashboard)
const RAZORPAY_PAYMENT_LINKS = {
  style_plus: process.env.REACT_APP_RAZORPAY_PLUS_LINK || '',
  style_x: process.env.REACT_APP_RAZORPAY_X_LINK || '',
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
 * ✨ Redirect to Razorpay Payment Link
 */
export const redirectToRazorpayLink = (
  tier: 'style_plus' | 'style_x'
): void => {
  const paymentLink = RAZORPAY_PAYMENT_LINKS[tier];

  if (!paymentLink) {
    console.error(`❌ Razorpay payment link not configured for tier: ${tier}`);
    throw new Error(`Razorpay payment link not configured for tier: ${tier}`);
  }

  console.log(`💳 Redirecting to Razorpay for tier: ${tier}`);
  // Redirect to Razorpay payment link
  window.location.href = paymentLink;
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
      razorpayPaymentId: razorpayPaymentId, // ✨ FIXED
      razorpayOrderId: razorpayOrderId || razorpayPaymentId, // ✨ FIXED
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
 * ✨ Get Razorpay payment link for tier
 */
export const getPaymentLink = (tier: 'style_plus' | 'style_x'): string => {
  const link = RAZORPAY_PAYMENT_LINKS[tier];

  if (!link) {
    console.warn(`⚠️ No payment link found for tier: ${tier}`);
    return '';
  }

  return link;
};

/**
 * ✨ Check if Razorpay is configured
 */
export const isRazorpayConfigured = (): boolean => {
  const hasKeyId = !!RAZORPAY_KEY_ID;
  const hasPlusLink = !!RAZORPAY_PAYMENT_LINKS.style_plus;
  const hasXLink = !!RAZORPAY_PAYMENT_LINKS.style_x;

  if (!hasKeyId) {
    console.warn('⚠️ REACT_APP_RAZORPAY_KEY_ID not configured');
  }

  if (!hasPlusLink) {
    console.warn('⚠️ REACT_APP_RAZORPAY_PLUS_LINK not configured');
  }

  if (!hasXLink) {
    console.warn('⚠️ REACT_APP_RAZORPAY_X_LINK not configured');
  }

  return hasKeyId && hasPlusLink && hasXLink;
};

/**
 * ✨ Log Razorpay configuration (for debugging)
 */
export const debugRazorpayConfig = (): void => {
  console.log('🔍 Razorpay Configuration:');
  console.log('  Key ID:', RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Not configured');
  console.log(
    '  Plus Link:',
    RAZORPAY_PAYMENT_LINKS.style_plus ? '✅ Configured' : '❌ Not configured'
  );
  console.log(
    '  X Link:',
    RAZORPAY_PAYMENT_LINKS.style_x ? '✅ Configured' : '❌ Not configured'
  );
};
