import { doc, setDoc, getDoc, updateDoc, arrayUnion, deleteField } from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { UserProfile, Garment, Subscription, SubscriptionTier } from '../types';

// Clean profile data - remove undefined fields
const cleanProfile = (profile: UserProfile) => {
  const cleaned: any = {};

  // Only add fields that exist and are not undefined
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

// ✅ NEW: Initialize subscription for new user
const initializeSubscription = (): Subscription => {
  return {
    tier: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
  };
};

// Save user profile to Firestore
// ✅ FIXED: Saves subscription at ROOT level (not nested in profile)
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  try {
    const cleanedProfile = cleanProfile(profile);
    
    // Ensure subscription exists
    const subscription = profile.subscription || initializeSubscription();

    // ✅ FIXED: subscription at ROOT level, NOT inside profile
    await setDoc(doc(db, 'users', userId), {
      profile: cleanedProfile,           // ← Profile data
      subscription: subscription,         // ✅ ROOT level subscription
      wardrobe: [],
      hasSeenPlanModal: profile.hasSeenPlanModal || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Profile saved to Firestore with subscription at ROOT level');
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// Load user profile from Firestore
// ✅ FIXED: Loads subscription from ROOT level
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
          hasSeenPlanModal: false
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
    console.error('Error loading profile:', error);
    throw error;
  }
};

// ✅ FIXED: Get subscription from ROOT level
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
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

// ✅ NEW: Get subscription tier
export const getUserSubscriptionTier = async (userId: string): Promise<SubscriptionTier> => {
  try {
    const subscription = await getSubscription(userId);
    const tier = subscription?.tier || 'free';
    console.log('✅ User subscription tier:', tier);
    return tier;
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }
};

// ✅ NEW: Check if user has premium subscription
export const hasPremiumSubscription = async (userId: string): Promise<boolean> => {
  try {
    const tier = await getUserSubscriptionTier(userId);
    const isPremium = ['style_plus', 'style_x'].includes(tier);
    console.log('✅ Has premium subscription:', isPremium);
    return isPremium;
  } catch (error) {
    console.error('Error checking premium subscription:', error);
    return false;
  }
};

// ✅ FIXED: Update subscription tier (after payment)
export const updateSubscriptionTier = async (
  userId: string,
  tier: SubscriptionTier,
  subscriptionData?: {
    subscriptionId?: string;
    customerId?: string;
    endDate?: string;
  }
): Promise<Subscription> => {
  try {
    const subscription: Subscription = {
      tier,
      status: 'active',
      subscriptionId: subscriptionData?.subscriptionId,
      customerId: subscriptionData?.customerId,
      startDate: new Date().toISOString(),
      endDate: subscriptionData?.endDate,
    };

    const docRef = doc(db, 'users', userId);
    
    // ✅ FIXED: Update subscription at ROOT level
    await updateDoc(docRef, {
      subscription: subscription,  // ✅ ROOT level
      hasSeenPlanModal: true,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Subscription updated to ${tier} at ROOT level for user ${userId}`);
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// ✅ FIXED: Cancel subscription (downgrade to free)
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    
    // ✅ FIXED: Update subscription at ROOT level
    await updateDoc(docRef, {
      subscription: {
        tier: 'free',
        status: 'cancelled',
        startDate: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// ✅ NEW: Mark plan modal as seen
export const markPlanModalSeen = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      hasSeenPlanModal: true,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Plan modal marked as seen');
  } catch (error) {
    console.error('Error marking plan modal as seen:', error);
    throw error;
  }
};

// Save wardrobe item to Firestore
export const addWardrobeItem = async (userId: string, garment: Garment) => {
  try {
    const docRef = doc(db, 'users', userId);

    // Check if document exists
    const docSnap = await getDoc(docRef);

    const garmentWithMeta: Garment = {
      ...garment,
      id: `garment-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };

    if (!docSnap.exists()) {
      // Create document with wardrobe if it doesn't exist
      await setDoc(docRef, {
        profile: {},
        wardrobe: [garmentWithMeta],
        subscription: initializeSubscription(),  // ✅ Initialize at ROOT level
        hasSeenPlanModal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing document
      await updateDoc(docRef, {
        wardrobe: arrayUnion(garmentWithMeta),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('✅ Wardrobe item added to Firestore');
  } catch (error) {
    console.error('Error adding wardrobe item:', error);
    throw error;
  }
};

// Load wardrobe from Firestore
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
    console.error('Error loading wardrobe:', error);
    throw error;
  }
};

// Update wardrobe item in Firestore
export const updateWardrobeItem = async (
  userId: string,
  index: number,
  updatedGarment: Garment,
  allGarments: Garment[]
) => {
  try {
    const docRef = doc(db, 'users', userId);

    // Check if document exists
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User document does not exist');
    }

    // Update the garment at the specific index
    const updatedWardrobe = [...allGarments];

    // Preserve metadata if it exists
    const existingGarment = allGarments[index];

    updatedWardrobe[index] = {
      ...updatedGarment,
      id: existingGarment?.id || `garment-${Date.now()}`,
      uploadedAt: existingGarment?.uploadedAt || new Date().toISOString()
    };

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Wardrobe item updated in Firestore');
  } catch (error) {
    console.error('Error updating wardrobe item:', error);
    throw error;
  }
};

// Delete wardrobe item from Firestore
export const deleteWardrobeItem = async (userId: string, index: number, allGarments: Garment[]) => {
  try {
    const docRef = doc(db, 'users', userId);

    // Check if document exists
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User document does not exist');
    }

    // Remove the garment at the specific index
    const updatedWardrobe = allGarments.filter((_, i) => i !== index);

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Wardrobe item deleted from Firestore');
  } catch (error) {
    console.error('Error deleting wardrobe item:', error);
    throw error;
  }
};

// Helper function to compress image to Base64
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

        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 800; // Max width or height

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

        // Compress to JPEG with quality adjustment
        let quality = 0.7;
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        // Further reduce quality if still too large
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
