// Handles wardrobe access control based on subscription status

import { getSubscription } from './subscriptionService';
import { getWardrobeLimit } from '../constants/subscriptionPlans';
import type { Garment, SubscriptionTier } from '../types';

/**
 * Check if user's subscription is expired
 */
export async function isSubscriptionExpired(uid: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(uid);
    if (!subscription || !subscription.endDate) return false;

    const endDate = new Date(subscription.endDate);
    return new Date() > endDate;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return false;
  }
}

/**
 * Get effective subscription tier (considering expiry)
 * Returns 'free' if paid subscription is expired
 */
export async function getEffectiveSubscriptionTier(uid: string): Promise<SubscriptionTier> {
  try {
    const subscription = await getSubscription(uid);
    if (!subscription) return 'free';

    const expired = await isSubscriptionExpired(uid);
    return expired ? 'free' : (subscription.tier as SubscriptionTier);
  } catch (error) {
    console.error('Error getting effective subscription tier:', error);
    return 'free';
  }
}

/**
 * Get effective wardrobe limit (considering expiry)
 */
export async function getEffectiveWardrobeLimit(uid: string): Promise<number> {
  try {
    const tier = await getEffectiveSubscriptionTier(uid);
    return getWardrobeLimit(tier);
  } catch (error) {
    console.error('Error getting effective wardrobe limit:', error);
    return getWardrobeLimit('free');
  }
}

/**
 * Filter wardrobe items based on subscription
 * Hides items beyond the tier limit if subscription is expired
 */
export async function getAccessibleWardrobe(
  uid: string,
  wardrobe: Garment[]
): Promise<Garment[]> {
  try {
    const subscription = await getSubscription(uid);
    const expired = await isSubscriptionExpired(uid);

    // If subscription is expired, limit access
    if (expired && subscription?.tier !== 'free') {
      const freeLimit = getWardrobeLimit('free');
      return wardrobe.slice(0, freeLimit);
    }

    // Otherwise, return items based on current tier
    const tier = (subscription?.tier as SubscriptionTier) || 'free';
    const limit = getWardrobeLimit(tier);
    
    if (limit === -1) return wardrobe; // Unlimited
    return wardrobe.slice(0, limit);
  } catch (error) {
    console.error('Error getting accessible wardrobe:', error);
    return wardrobe.slice(0, getWardrobeLimit('free'));
  }
}

/**
 * Check if user can add more wardrobe items
 */
export async function canUserAddWardrobeItem(
  uid: string,
  currentItemCount: number
): Promise<boolean> {
  try {
    const limit = await getEffectiveWardrobeLimit(uid);
    
    if (limit === -1) return true; // Unlimited
    return currentItemCount < limit;
  } catch (error) {
    console.error('Error checking wardrobe add permission:', error);
    return false;
  }
}

/**
 * Get wardrobe status info for UI
 */
export interface WardrobeStatus {
  accessible: number;
  total: number;
  limit: number;
  isUnlimited: boolean;
  isExpired: boolean;
  hiddenCount: number;
  tier: SubscriptionTier;
}

export async function getWardrobeStatus(
  uid: string,
  wardrobe: Garment[]
): Promise<WardrobeStatus> {
  try {
    const subscription = await getSubscription(uid);
    const expired = await isSubscriptionExpired(uid);
    const tier = (subscription?.tier as SubscriptionTier) || 'free';
    const limit = getWardrobeLimit(tier);
    
    let accessibleCount = wardrobe.length;
    let hiddenCount = 0;

    // If expired, limit access
    if (expired && tier !== 'free') {
      const freeLimit = getWardrobeLimit('free');
      accessibleCount = Math.min(wardrobe.length, freeLimit);
      hiddenCount = wardrobe.length - accessibleCount;
    } else if (limit !== -1) {
      accessibleCount = Math.min(wardrobe.length, limit);
      hiddenCount = wardrobe.length - accessibleCount;
    }

    return {
      accessible: accessibleCount,
      total: wardrobe.length,
      limit: limit,
      isUnlimited: limit === -1,
      isExpired: expired,
      hiddenCount: hiddenCount,
      tier: tier
    };
  } catch (error) {
    console.error('Error getting wardrobe status:', error);
    return {
      accessible: wardrobe.length,
      total: wardrobe.length,
      limit: 1,
      isUnlimited: false,
      isExpired: false,
      hiddenCount: 0,
      tier: 'free'
    };
  }
}

/**
 * Check if specific wardrobe item should be hidden
 */
export async function shouldHideWardrobeItem(
  uid: string,
  itemIndex: number,
  wardrobe: Garment[]
): Promise<boolean> {
  try {
    const status = await getWardrobeStatus(uid, wardrobe);
    return itemIndex >= status.accessible;
  } catch (error) {
    console.error('Error checking if item should be hidden:', error);
    return false;
  }
}

/**
 * Format subscription tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'style_plus':
      return 'Style+';
    case 'style_x':
      return 'StyleX';
    default:
      return 'Free';
  }
}

/**
 * Get human-readable message about wardrobe limit
 */
export function getWardrobeLimitMessage(tier: SubscriptionTier, limit: number): string {
  if (limit === -1) {
    return `✅ Unlimited wardrobe (${getTierDisplayName(tier)})`;
  }
  return `${limit} items (${getTierDisplayName(tier)})`;
}
