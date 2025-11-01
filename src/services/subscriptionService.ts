import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { Subscription, SubscriptionTier, UserProfile } from '../types';

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
      'subscription': subscription,
      'hasSeenPlanModal': false
    });
    return subscription;
  } catch (error) {
    console.error('Error initializing subscription:', error);
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
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Update subscription tier (after payment)
 */
export async function updateSubscriptionTier(
  uid: string,
  tier: SubscriptionTier,
  subscriptionData?: {
    subscriptionId?: string;
    customerId?: string;
    endDate?: string;
  }
): Promise<Subscription> {
  const subscription: Subscription = {
    tier,
    status: 'active',
    subscriptionId: subscriptionData?.subscriptionId,
    customerId: subscriptionData?.customerId,
    startDate: new Date().toISOString(),
    endDate: subscriptionData?.endDate,
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      'subscription': subscription,
      'hasSeenPlanModal': true
    });

    console.log(`✅ Subscription updated to ${tier} for user ${uid}`);
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Mark plan modal as seen
 */
export async function markPlanModalSeen(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      'hasSeenPlanModal': true
    });
  } catch (error) {
    console.error('Error marking plan modal as seen:', error);
    throw error;
  }
}

/**
 * Cancel subscription (downgrade to free)
 */
export async function cancelSubscription(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      'subscription': {
        tier: 'free',
        status: 'cancelled',
        startDate: new Date().toISOString(),
      }
    });

    console.log(`✅ Subscription cancelled for user ${uid}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status (after webhook)
 */
export async function updateSubscriptionStatus(
  uid: string,
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      'subscription.status': status
    });

    console.log(`✅ Subscription status updated to ${status} for user ${uid}`);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Get subscription by Lemon Squeezy customer ID
 */
export async function findUserByLemonCustomerId(customerId: string): Promise<string | null> {
  try {
    // Note: This requires a compound index in Firestore
    // For now, we'll handle this through the webhook directly
    console.log(`Looking for user with Lemon customer ID: ${customerId}`);
    return null;
  } catch (error) {
    console.error('Error finding user by Lemon customer ID:', error);
    throw error;
  }
}

/**
 * Handle Lemon Squeezy webhook - Subscription Created
 */
export async function handleLemonSubscriptionCreated(
  uid: string,
  subscriptionData: {
    subscriptionId: string;
    customerId: string;
    tier: SubscriptionTier;
    endDate?: string;
  }
): Promise<void> {
  try {
    await updateSubscriptionTier(uid, subscriptionData.tier, {
      subscriptionId: subscriptionData.subscriptionId,
      customerId: subscriptionData.customerId,
      endDate: subscriptionData.endDate,
    });
  } catch (error) {
    console.error('Error handling subscription created webhook:', error);
    throw error;
  }
}

/**
 * Handle Lemon Squeezy webhook - Subscription Updated
 */
export async function handleLemonSubscriptionUpdated(
  uid: string,
  subscriptionData: {
    subscriptionId: string;
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
      };

      await updateDoc(doc(db, 'users', uid), {
        'subscription': updatedSubscription
      });

      console.log(`✅ Subscription updated via webhook for user ${uid}`);
    }
  } catch (error) {
    console.error('Error handling subscription updated webhook:', error);
    throw error;
  }
}

/**
 * Handle Lemon Squeezy webhook - Subscription Cancelled
 */
export async function handleLemonSubscriptionCancelled(uid: string): Promise<void> {
  try {
    await updateSubscriptionStatus(uid, 'cancelled');
    // Optionally downgrade to free tier
    // await updateSubscriptionTier(uid, 'free');
  } catch (error) {
    console.error('Error handling subscription cancelled webhook:', error);
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
    console.error('Error checking subscription active status:', error);
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
    console.error('Error getting user subscription tier:', error);
    return 'free';
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
        hasSeenPlanModal: data.hasSeenPlanModal
      });
    }
  } catch (error) {
    console.error('Error in debug function:', error);
  }
}
