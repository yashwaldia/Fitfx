import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { UserProfile, Garment, Subscription, SubscriptionTier } from '../types';


/**
 * ✨ Usage tracking interface
 */
export interface UsageStats {
  colorSuggestions: number;
  outfitPreviews: number;
  wardrobeUploads: number;
  chatMessages: number;
  lastReset: string;
}


/**
 * Clean profile data - remove undefined fields
 */
const cleanProfile = (profile: UserProfile) => {
  const cleaned: any = {};

  if (profile.name) cleaned.name = profile.name;
  if (profile.age) cleaned.age = profile.age;
  if (profile.gender) cleaned.gender = profile.gender;
  if (profile.bodyType) cleaned.bodyType = profile.bodyType;
  if (profile.fashionIcons) cleaned.fashionIcons = profile.fashionIcons;
  if (profile.preferredOccasions) cleaned.preferredOccasions = profile.preferredOccasions;
  if (profile.preferredStyles) cleaned.preferredStyles = profile.preferredStyles;
  if (profile.favoriteColors) cleaned.favoriteColors = profile.favoriteColors;
  if (profile.preferredFabrics) cleaned.preferredFabrics = profile.preferredFabrics;

  return cleaned;
};


/**
 * ✨ Initialize subscription for new user (ROOT level)
 */
const initializeSubscription = (): Subscription => {
  return {
    tier: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
  };
};


/**
 * ✨ NEW: Initialize usage stats
 */
const initializeUsageStats = (): UsageStats => {
  return {
    colorSuggestions: 0,
    outfitPreviews: 0,
    wardrobeUploads: 0,
    chatMessages: 0,
    lastReset: new Date().toISOString(),
  };
};


/**
 * ✅ Save user profile to Firestore
 * Saves subscription at ROOT level (NOT nested in profile)
 */
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  try {
    const cleanedProfile = cleanProfile(profile);

    const subscription = profile.subscription || initializeSubscription();
    const usage = initializeUsageStats();

    // ✅ FIXED: subscription at ROOT level, NOT inside profile
    await setDoc(
      doc(db, 'users', userId),
      {
        profile: cleanedProfile, // ← Profile data
        subscription: subscription, // ✅ ROOT level subscription
        usage: usage, // ✨ NEW: Usage tracking
        wardrobe: [],
        hasSeenPlanModal: profile.hasSeenPlanModal || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Profile saved to Firestore with subscription at ROOT level');
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw error;
  }
};


/**
 * ✅ Load user profile from Firestore
 * Loads subscription from ROOT level
 */
export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile = data.profile as UserProfile;

      // ✅ FIXED: Load subscription from ROOT level (NOT from profile)
      console.log('📂 Full user data structure:', data);

      // Get subscription from ROOT level
      const subscription = data.subscription || initializeSubscription();

      console.log('✅ Loaded subscription from ROOT level:', subscription);

      // If subscription is missing at root, initialize and save it
      if (!data.subscription) {
        console.log('⚠️ Initializing missing subscription for user:', userId);
        await updateDoc(docRef, {
          subscription: subscription,
          hasSeenPlanModal: false,
        });
      }

      // ✨ NEW: Initialize usage if missing
      if (!data.usage) {
        console.log('⚠️ Initializing missing usage stats for user:', userId);
        await updateDoc(docRef, {
          usage: initializeUsageStats(),
        });
      }

      // Attach subscription and other root-level fields to profile
      profile.hasSeenPlanModal = data.hasSeenPlanModal || false;
      profile.subscription = subscription;

      console.log('✅ Profile loaded successfully with tier:', subscription.tier);
      return profile;
    } else {
      console.warn('⚠️ User document does not exist:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    throw error;
  }
};


/**
 * ✅ Get subscription from ROOT level
 */
export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // ✅ FIXED: Get subscription from ROOT level (not from profile)
      const subscription = data.subscription;

      console.log('✅ Fetched subscription from ROOT level:', subscription);

      if (!subscription) {
        console.warn('⚠️ Subscription not found, initializing...');
        const newSubscription = initializeSubscription();
        await updateDoc(docRef, { subscription: newSubscription });
        return newSubscription;
      }

      return subscription;
    }

    console.warn('⚠️ User document not found:', userId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    throw error;
  }
};


/**
 * ✅ Get subscription tier
 */
export const getUserSubscriptionTier = async (userId: string): Promise<SubscriptionTier> => {
  try {
    const subscription = await getSubscription(userId);
    const tier = subscription?.tier || 'free';
    console.log('✅ User subscription tier:', tier);
    return tier;
  } catch (error) {
    console.error('❌ Error getting subscription tier:', error);
    return 'free';
  }
};


/**
 * ✅ Check if user has premium subscription
 */
export const hasPremiumSubscription = async (userId: string): Promise<boolean> => {
  try {
    const tier = await getUserSubscriptionTier(userId);
    const isPremium = ['style_plus', 'style_x'].includes(tier);
    console.log('✅ Has premium subscription:', isPremium);
    return isPremium;
  } catch (error) {
    console.error('❌ Error checking premium subscription:', error);
    return false;
  }
};


/**
 * ✅ UPDATED: Consolidated subscription update function
 * Updates subscription at ROOT level with all necessary fields
 */
export const updateSubscriptionTier = async (
  userId: string,
  tier: SubscriptionTier,
  subscriptionData?: {
    razorpayPaymentId?: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    endDate?: string;
    status?: 'active' | 'cancelled' | 'expired' | 'paused' | 'created' | 'payment_failed';
  }
): Promise<Subscription> => {
  try {
    console.log(`🔄 Updating subscription for user ${userId} to tier ${tier}`);

    const docRef = doc(db, 'users', userId);

    // Get existing subscription to preserve data
    const docSnap = await getDoc(docRef);
    const existingSubscription = docSnap.exists() ? docSnap.data().subscription : null;

    // ✨ Build updated subscription object
    const subscription: Subscription = {
      tier,
      status: subscriptionData?.status || 'active',
      razorpayPaymentId: subscriptionData?.razorpayPaymentId || existingSubscription?.razorpayPaymentId,
      razorpaySubscriptionId: subscriptionData?.razorpaySubscriptionId || existingSubscription?.razorpaySubscriptionId,
      razorpayOrderId: subscriptionData?.razorpayOrderId || existingSubscription?.razorpayOrderId,
      startDate: existingSubscription?.startDate || new Date().toISOString(),
      endDate: subscriptionData?.endDate || existingSubscription?.endDate,
    };

    // ✅ Update subscription at ROOT level
    await updateDoc(docRef, {
      subscription: subscription,
      hasSeenPlanModal: true,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Subscription updated to ${tier} at ROOT level for user ${userId}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
};


/**
 * ✅ UPDATED: Cancel subscription (downgrade to free) with proper state management
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    console.log(`🚫 Cancelling subscription for user ${userId}`);

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User document not found');
    }

    const existingSubscription = docSnap.data().subscription;

    // ✅ Preserve subscription IDs for reference
    await updateDoc(docRef, {
      'subscription.tier': 'free',
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
};


/**
 * ✅ Mark plan modal as seen
 */
export const markPlanModalSeen = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      hasSeenPlanModal: true,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Plan modal marked as seen');
  } catch (error) {
    console.error('❌ Error marking plan modal as seen:', error);
    throw error;
  }
};


// ═══════════════════════════════════════════════════════════════
// ✨ NEW: USAGE TRACKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════


/**
 * ✨ NEW: Get user usage stats
 */
export const getUserUsage = async (userId: string): Promise<UsageStats | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const usage = data.usage || initializeUsageStats();

      // Check if usage needs to be reset (monthly reset)
      const lastReset = new Date(usage.lastReset);
      const now = new Date();
      const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceReset > 30) {
        console.log('⚠️ Usage stats expired, resetting...');
        const resetUsage = initializeUsageStats();
        await updateDoc(docRef, { usage: resetUsage });
        return resetUsage;
      }

      return usage;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting usage stats:', error);
    return null;
  }
};


/**
 * ✨ NEW: Increment usage counter
 */
export const incrementUsage = async (
  userId: string,
  type: 'colorSuggestions' | 'outfitPreviews' | 'wardrobeUploads' | 'chatMessages'
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    const currentUsage = await getUserUsage(userId);

    if (!currentUsage) {
      console.warn('⚠️ No usage stats found, initializing...');
      await updateDoc(docRef, { usage: initializeUsageStats() });
      return;
    }

    const updatedUsage = {
      ...currentUsage,
      [type]: currentUsage[type] + 1,
    };

    await updateDoc(docRef, {
      usage: updatedUsage,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Incremented ${type} usage: ${updatedUsage[type]}`);
  } catch (error) {
    console.error(`❌ Error incrementing ${type} usage:`, error);
    throw error;
  }
};


/**
 * ✨ NEW: Check if user can perform action based on tier limits
 */
export const canPerformAction = async (
  userId: string,
  action: 'colorSuggestions' | 'outfitPreviews' | 'wardrobeUploads' | 'chatMessages'
): Promise<boolean> => {
  try {
    const tier = await getUserSubscriptionTier(userId);
    const usage = await getUserUsage(userId);

    if (!usage) return false;

    // Define limits per tier
    const limits = {
      free: {
        colorSuggestions: 5,
        outfitPreviews: 3,
        wardrobeUploads: 5,
        chatMessages: 10,
      },
      style_plus: {
        colorSuggestions: 10,
        outfitPreviews: 10,
        wardrobeUploads: 50,
        chatMessages: 50,
      },
      style_x: {
        colorSuggestions: 999,
        outfitPreviews: 999,
        wardrobeUploads: 999,
        chatMessages: 999,
      },
    };

    const limit = limits[tier][action];
    const currentUsage = usage[action];

    const canPerform = currentUsage < limit;

    console.log(`🔍 Can perform ${action}? ${canPerform} (${currentUsage}/${limit})`);

    return canPerform;
  } catch (error) {
    console.error('❌ Error checking action permission:', error);
    return false;
  }
};


/**
 * ✨ NEW: Get remaining usage for display
 */
export const getRemainingUsage = async (userId: string): Promise<{
  colorSuggestions: { used: number; limit: number; remaining: number };
  outfitPreviews: { used: number; limit: number; remaining: number };
  wardrobeUploads: { used: number; limit: number; remaining: number };
  chatMessages: { used: number; limit: number; remaining: number };
} | null> => {
  try {
    const tier = await getUserSubscriptionTier(userId);
    const usage = await getUserUsage(userId);

    if (!usage) return null;

    const limits = {
      free: {
        colorSuggestions: 5,
        outfitPreviews: 3,
        wardrobeUploads: 5,
        chatMessages: 10,
      },
      style_plus: {
        colorSuggestions: 10,
        outfitPreviews: 10,
        wardrobeUploads: 50,
        chatMessages: 50,
      },
      style_x: {
        colorSuggestions: 999,
        outfitPreviews: 999,
        wardrobeUploads: 999,
        chatMessages: 999,
      },
    };

    const tierLimits = limits[tier];

    return {
      colorSuggestions: {
        used: usage.colorSuggestions,
        limit: tierLimits.colorSuggestions,
        remaining: Math.max(0, tierLimits.colorSuggestions - usage.colorSuggestions),
      },
      outfitPreviews: {
        used: usage.outfitPreviews,
        limit: tierLimits.outfitPreviews,
        remaining: Math.max(0, tierLimits.outfitPreviews - usage.outfitPreviews),
      },
      wardrobeUploads: {
        used: usage.wardrobeUploads,
        limit: tierLimits.wardrobeUploads,
        remaining: Math.max(0, tierLimits.wardrobeUploads - usage.wardrobeUploads),
      },
      chatMessages: {
        used: usage.chatMessages,
        limit: tierLimits.chatMessages,
        remaining: Math.max(0, tierLimits.chatMessages - usage.chatMessages),
      },
    };
  } catch (error) {
    console.error('❌ Error getting remaining usage:', error);
    return null;
  }
};


// ═══════════════════════════════════════════════════════════════
// WARDROBE FUNCTIONS
// ═══════════════════════════════════════════════════════════════


/**
 * Save wardrobe item to Firestore
 */
export const addWardrobeItem = async (userId: string, garment: Garment) => {
  try {
    // ✨ NEW: Check if user can add wardrobe item
    const canAdd = await canPerformAction(userId, 'wardrobeUploads');

    if (!canAdd) {
      throw new Error('Wardrobe upload limit reached. Please upgrade your plan.');
    }

    const docRef = doc(db, 'users', userId);

    const docSnap = await getDoc(docRef);

    const garmentWithMeta: Garment = {
      ...garment,
      id: `garment-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };

    if (!docSnap.exists()) {
      // Create document with wardrobe if it doesn't exist
      await setDoc(
        docRef,
        {
          profile: {},
          wardrobe: [garmentWithMeta],
          subscription: initializeSubscription(), // ✅ Initialize at ROOT level
          usage: initializeUsageStats(), // ✨ NEW: Initialize usage
          hasSeenPlanModal: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      // Update existing document
      await updateDoc(docRef, {
        wardrobe: arrayUnion(garmentWithMeta),
        updatedAt: new Date().toISOString(),
      });
    }

    // ✨ NEW: Increment usage counter
    await incrementUsage(userId, 'wardrobeUploads');

    console.log('✅ Wardrobe item added to Firestore');
  } catch (error) {
    console.error('❌ Error adding wardrobe item:', error);
    throw error;
  }
};


/**
 * Load wardrobe from Firestore
 */
export const loadWardrobe = async (userId: string): Promise<Garment[]> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.wardrobe || []) as Garment[];
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading wardrobe:', error);
    throw error;
  }
};


/**
 * Update wardrobe item in Firestore
 */
export const updateWardrobeItem = async (
  userId: string,
  index: number,
  updatedGarment: Garment,
  allGarments: Garment[]
) => {
  try {
    const docRef = doc(db, 'users', userId);

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('❌ User document does not exist');
    }

    const updatedWardrobe = [...allGarments];

    const existingGarment = allGarments[index];

    updatedWardrobe[index] = {
      ...updatedGarment,
      id: existingGarment?.id || `garment-${Date.now()}`,
      uploadedAt: existingGarment?.uploadedAt || new Date().toISOString(),
    };

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Wardrobe item updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating wardrobe item:', error);
    throw error;
  }
};


/**
 * Delete wardrobe item from Firestore
 */
export const deleteWardrobeItem = async (userId: string, index: number, allGarments: Garment[]) => {
  try {
    const docRef = doc(db, 'users', userId);

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('❌ User document does not exist');
    }

    const updatedWardrobe = allGarments.filter((_, i) => i !== index);

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Wardrobe item deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting wardrobe item:', error);
    throw error;
  }
};


/**
 * Helper function to compress image to Base64
 */
export const compressImageToBase64 = (file: File, maxSizeKB: number = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.7;
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        while (compressedBase64.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedBase64);
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
};
