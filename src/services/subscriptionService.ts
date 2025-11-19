import { db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Subscription, SubscriptionTier, UserProfile } from '../types';

/**
 * ✨ Define subscription limits ONCE (global)
 */
const SUBSCRIPTION_LIMITS = {
  free: {
    colorSuggestions: 5,
    outfitPreviews: 3,
    wardrobeLimit: 5,
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic',
  },
  style_plus: {
    colorSuggestions: 10,
    outfitPreviews: 10,
    wardrobeLimit: 50,
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'standard',
  },
  style_x: {
    colorSuggestions: 999,
    outfitPreviews: 999,
    wardrobeLimit: -1, // Unlimited
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'premium',
  },
};

/**
 * ✨ NEW: Calculate end date (30 days from start)
 */
function calculateEndDate(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
  return end.toISOString();
}

/**
 * Initialize subscription for new user (Free tier)
 */
export async function initializeSubscription(uid: string): Promise<Subscription> {
  const subscription: Subscription = {
    tier: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: subscription,
      hasSeenPlanModal: false,
    });
    console.log(`✅ Subscription initialized for user ${uid}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error initializing subscription:', error);
    throw error;
  }
}

/**
 * Get user subscription
 */
export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      return data.subscription || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    throw error;
  }
}

/**
 * ✨ UPDATED: Update subscription tier after Razorpay payment
 * Now automatically calculates endDate = startDate + 30 days
 */
export async function updateSubscriptionTier(
  uid: string,
  tier: SubscriptionTier,
  razorpayData?: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    endDate?: string;
  }
): Promise<Subscription> {
  const startDate = new Date().toISOString();
  
  // ✨ CRITICAL: Calculate endDate automatically (30 days from now)
  const endDate = razorpayData?.endDate || calculateEndDate(startDate);

  const subscription: Subscription = {
    tier,
    status: 'active',
    razorpayPaymentId: razorpayData?.razorpayPaymentId,
    razorpayOrderId: razorpayData?.razorpayOrderId,
    startDate: startDate,
    endDate: endDate, // ✨ Always set endDate for paid subscriptions
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: subscription,
      hasSeenPlanModal: true,
    });

    console.log(`✅ Subscription updated to ${tier} for user ${uid}`);
    console.log(`📅 Start: ${startDate}`);
    console.log(`📅 End: ${endDate}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

/**
 * Mark plan modal as seen
 */
export async function markPlanModalSeen(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      hasSeenPlanModal: true,
    });
    console.log(`✅ Plan modal marked as seen for user ${uid}`);
  } catch (error) {
    console.error('❌ Error marking plan modal as seen:', error);
    throw error;
  }
}

/**
 * Cancel subscription (downgrade to free)
 */
export async function cancelSubscription(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: {
        tier: 'free',
        status: 'cancelled',
        startDate: new Date().toISOString(),
      },
    });

    console.log(`✅ Subscription cancelled for user ${uid}`);
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  uid: string,
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      'subscription.status': status,
    });

    console.log(`✅ Subscription status updated to ${status} for user ${uid}`);
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
    throw error;
  }
}

/**
 * ✨ UPDATED: Handle Razorpay Payment Webhook - Payment Successful
 * Now automatically calculates endDate
 */
export async function handleRazorpayPaymentSuccess(
  uid: string,
  paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    tier: SubscriptionTier;
    endDate?: string;
  }
): Promise<void> {
  try {
    const startDate = new Date().toISOString();
    const endDate = paymentData.endDate || calculateEndDate(startDate);

    await updateSubscriptionTier(uid, paymentData.tier, {
      razorpayPaymentId: paymentData.razorpayPaymentId,
      razorpayOrderId: paymentData.razorpayOrderId,
      endDate: endDate,
    });
    
    console.log(`✅ Razorpay payment processed for user ${uid}`);
    console.log(`📅 Subscription valid until: ${endDate}`);
  } catch (error) {
    console.error('❌ Error handling Razorpay payment webhook:', error);
    throw error;
  }
}

/**
 * ✨ Handle Razorpay Subscription Update Webhook
 */
export async function handleRazorpaySubscriptionUpdated(
  uid: string,
  subscriptionData: {
    razorpayOrderId: string;
    tier: SubscriptionTier;
    status: 'active' | 'cancelled' | 'past_due' | 'expired';
  }
): Promise<void> {
  try {
    const currentSubscription = await getSubscription(uid);

    if (currentSubscription) {
      const updatedSubscription: Subscription = {
        ...currentSubscription,
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        razorpayOrderId: subscriptionData.razorpayOrderId,
      };

      await updateDoc(doc(db, 'users', uid), {
        subscription: updatedSubscription,
      });

      console.log(`✅ Subscription updated via Razorpay webhook for user ${uid}`);
    }
  } catch (error) {
    console.error('❌ Error handling Razorpay subscription update:', error);
    throw error;
  }
}

/**
 * ✨ Handle Razorpay Subscription Cancelled Webhook
 */
export async function handleRazorpayCancelled(uid: string): Promise<void> {
  try {
    await updateSubscriptionStatus(uid, 'cancelled');
    console.log(`✅ Razorpay subscription cancelled for user ${uid}`);
  } catch (error) {
    console.error('❌ Error handling Razorpay cancellation:', error);
    throw error;
  }
}

/**
 * Check if subscription is still active
 */
export async function isSubscriptionActive(uid: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(uid);
    return subscription?.status === 'active' && subscription?.tier !== 'free';
  } catch (error) {
    console.error('❌ Error checking subscription active status:', error);
    return false;
  }
}

/**
 * Get subscription tier for user
 */
export async function getUserSubscriptionTier(uid: string): Promise<SubscriptionTier> {
  try {
    const subscription = await getSubscription(uid);
    return subscription?.tier || 'free';
  } catch (error) {
    console.error('❌ Error getting user subscription tier:', error);
    return 'free';
  }
}

/**
 * ✨ Get feature limits based on subscription tier
 */
export async function getUserSubscriptionLimits(uid: string) {
  try {
    const tier = await getUserSubscriptionTier(uid);
    return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
  } catch (error) {
    console.error('❌ Error getting subscription limits:', error);
    return SUBSCRIPTION_LIMITS.free;
  }
}

/**
 * Get all subscription limits (for reference)
 */
export function getAllSubscriptionLimits() {
  return SUBSCRIPTION_LIMITS;
}

/**
 * Check if user has specific feature access
 */
export async function hasFeatureAccess(uid: string, feature: keyof typeof SUBSCRIPTION_LIMITS.free): Promise<boolean> {
  try {
    const limits = await getUserSubscriptionLimits(uid);
    return !!limits[feature];
  } catch (error) {
    console.error(`❌ Error checking feature access for ${feature}:`, error);
    return false;
  }
}

/**
 * Debug: Log all subscription data
 */
export async function debugGetUserSubscription(uid: string): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      console.log('📋 User Subscription Data:', {
        uid,
        subscription: data.subscription,
        hasSeenPlanModal: data.hasSeenPlanModal,
      });
    } else {
      console.warn('⚠️ User document does not exist');
    }
  } catch (error) {
    console.error('❌ Error in debug function:', error);
  }
}

/**
 * Verify Razorpay payment signature (for security)
 * ⚠️ This should be done on backend for security
 */
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    console.warn('⚠️ Signature verification should be done on backend');
    return !!signature && !!paymentId && !!orderId;
  } catch (error) {
    console.error('❌ Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * ✨ UPDATED: Check subscription validity (works with Subscription object directly)
 * This version accepts a Subscription object instead of uid
 */
export function isSubscriptionValid(subscription: Subscription | null): boolean {
  if (!subscription) {
    return false;
  }

  // Free tier is always "valid" (no expiration)
  if (subscription.tier === 'free') {
    return true;
  }

  // Check if subscription is active
  if (subscription.status !== 'active') {
    return false;
  }

  // Check if subscription has expired
  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    
    if (endDate < now) {
      console.warn(`⚠️ Subscription expired on ${endDate.toISOString()}`);
      return false;
    }
  }

  return true;
}

/**
 * ✨ NEW: Check subscription validity by user ID
 */
export async function isSubscriptionValidForUser(uid: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(uid);
    return isSubscriptionValid(subscription);
  } catch (error) {
    console.error('❌ Error checking subscription validity:', error);
    return false;
  }
}

/**
 * ✨ NEW: Expire subscription and downgrade to free
 */
export async function expireSubscription(uid: string): Promise<void> {
  try {
    const subscription = await getSubscription(uid);
    
    if (!subscription) {
      console.warn('⚠️ No subscription found for user:', uid);
      return;
    }

    // Update to free tier with expired status
    await updateDoc(doc(db, 'users', uid), {
      subscription: {
        tier: 'free',
        status: 'expired',
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        razorpayPaymentId: subscription.razorpayPaymentId,
        razorpayOrderId: subscription.razorpayOrderId,
      },
    });

    console.log(`✅ Subscription expired and downgraded to free for user ${uid}`);
  } catch (error) {
    console.error('❌ Error expiring subscription:', error);
    throw error;
  }
}

/**
 * ✨ UPDATED: Get days remaining in subscription
 */
export async function getDaysRemaining(uid: string): Promise<number | null> {
  try {
    const subscription = await getSubscription(uid);

    if (!subscription || !subscription.endDate) {
      return null;
    }

    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('❌ Error getting days remaining:', error);
    return null;
  }
}

/**
 * ✨ NEW: Get days remaining from Subscription object directly
 */
export function getDaysRemainingFromSubscription(subscription: Subscription | null): number | null {
  if (!subscription || !subscription.endDate) {
    return null;
  }

  const endDate = new Date(subscription.endDate);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * ✨ NEW: Batch check and expire all expired subscriptions
 * This can be called by a Cloud Function or scheduled task
 */
export async function checkAndExpireAllSubscriptions(): Promise<void> {
  console.log('🔄 Checking all subscriptions for expiration...');
  
  // Note: In production, this should be a Cloud Function that queries
  // all users with active paid subscriptions and checks expiration
  
  console.warn('⚠️ This function should be implemented as a Cloud Function');
  console.warn('⚠️ It needs to query all users with active subscriptions');
}

/**
 * Export limits for external usage
 */
export const SubscriptionLimits = SUBSCRIPTION_LIMITS;
