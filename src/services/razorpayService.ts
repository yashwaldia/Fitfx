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

    // ✨ NEW: Store subscription ID immediately in Firestore before redirect
    try {
      await updateDoc(doc(db, 'users', userId), {
        'subscription.razorpaySubscriptionId': subscriptionId,
        'subscription.status': 'created', // Mark as created, webhook will update to 'active'
      });
      console.log('✅ Subscription ID stored in Firestore before redirect');
    } catch (firestoreError) {
      console.error('⚠️ Failed to store subscription ID (will be updated by webhook):', firestoreError);
      // Don't throw - webhook will handle it, but log the warning
    }

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
 * ✅ UPDATED: Cancel subscription (Call API + Immediate Local Update)
 */
export const cancelUserSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<void> => {
  try {
    console.log(`🚫 Requesting cancellation for sub: ${subscriptionId}`);

    // ✅ Step 1: Call API to cancel on Razorpay
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

    const result = await response.json();
    console.log(`✅ Subscription cancelled on Razorpay:`, result);

    // ✨ NEW: Step 2: Immediately update Firestore locally (don't wait for webhook)
    try {
      await updateDoc(doc(db, 'users', userId), {
        'subscription.status': 'cancelled',
        'subscription.tier': 'free',
        'subscription.cancelledAt': new Date().toISOString(),
      });
      console.log('✅ Subscription downgraded to free locally');
    } catch (firestoreError) {
      console.error('❌ Failed to update Firestore after cancellation:', firestoreError);
      throw new Error('Subscription cancelled on Razorpay but failed to update locally. Please refresh the page.');
    }

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
};


/**
 * ✨ NEW: Pause subscription (if you want to implement pause/resume feature)
 */
export const pauseUserSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<void> => {
  try {
    console.log(`⏸️ Pausing subscription: ${subscriptionId}`);

    const response = await fetch('/api/pause-subscription', {
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
      throw new Error(errorText || 'Failed to pause subscription');
    }

    // Update local state
    await updateDoc(doc(db, 'users', userId), {
      'subscription.status': 'paused',
      'subscription.pausedAt': new Date().toISOString(),
    });

    console.log('✅ Subscription paused successfully');

  } catch (error) {
    console.error('❌ Error pausing subscription:', error);
    throw error;
  }
};


/**
 * ✨ NEW: Resume subscription
 */
export const resumeUserSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<void> => {
  try {
    console.log(`▶️ Resuming subscription: ${subscriptionId}`);

    const response = await fetch('/api/resume-subscription', {
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
      throw new Error(errorText || 'Failed to resume subscription');
    }

    // Update local state
    await updateDoc(doc(db, 'users', userId), {
      'subscription.status': 'active',
      'subscription.pausedAt': null,
      'subscription.resumedAt': new Date().toISOString(),
    });

    console.log('✅ Subscription resumed successfully');

  } catch (error) {
    console.error('❌ Error resuming subscription:', error);
    throw error;
  }
};


/**
 * ✨ NEW: Upgrade/Change subscription plan
 */
export const changeSubscriptionPlan = async (
  userId: string,
  currentSubscriptionId: string,
  newTier: 'style_plus' | 'style_x',
  userEmail: string,
  userName: string
): Promise<void> => {
  try {
    console.log(`🔄 Changing subscription plan to: ${newTier}`);

    // Step 1: Cancel current subscription
    await cancelUserSubscription(userId, currentSubscriptionId);
    console.log('✅ Old subscription cancelled');

    // Step 2: Create new subscription with new tier
    await createAndRedirectToSubscription(newTier, userId, userEmail, userName);
    console.log('✅ New subscription created');

  } catch (error) {
    console.error('❌ Error changing subscription plan:', error);
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


/**
 * ✨ NEW: Verify subscription status from Razorpay
 * (Useful for manual refresh/checking)
 */
export const verifySubscriptionStatus = async (
  subscriptionId: string
): Promise<any> => {
  try {
    console.log(`🔍 Verifying subscription status: ${subscriptionId}`);

    const response = await fetch('/api/verify-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify subscription status');
    }

    const data = await response.json();
    console.log('✅ Subscription status verified:', data);
    return data;

  } catch (error) {
    console.error('❌ Error verifying subscription:', error);
    throw error;
  }
};
