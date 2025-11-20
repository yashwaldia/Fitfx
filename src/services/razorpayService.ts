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

/**
 * ✨ Load Razorpay Script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
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
 * ✅ UPDATED: Create subscription and redirect (New System)
 */
export const createAndRedirectToSubscription = async (
  tier: 'style_plus' | 'style_x',
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> => {
  try {
    console.log(`💳 Creating NEW subscription for tier: ${tier}`);
    console.log(`👤 User: ${userId} (${userEmail})`);

    // ✅ Call serverless function to create FRESH subscription
    const response = await fetch('/api/create-subscription', {
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

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const { shortUrl, subscriptionId } = data;

    if (!shortUrl) {
      throw new Error('No payment URL received from API');
    }

    console.log(`✅ Subscription created: ${subscriptionId}`);
    console.log(`🔗 Redirecting to: ${shortUrl}`);

    // Redirect to Razorpay payment page
    window.location.href = shortUrl;

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to payment server. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * ✅ UPDATED: Cancel subscription (Call API)
 */
export const cancelUserSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<void> => {
  try {
    console.log(`🚫 Requesting cancellation for sub: ${subscriptionId}`);

    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to cancel subscription');
    }

    console.log(`✅ Subscription cancelled successfully`);

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
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
