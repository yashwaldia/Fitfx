import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { UserProfile, Garment } from '../types';

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

// Save user profile to Firestore
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  try {
    const cleanedProfile = cleanProfile(profile);
    
    await setDoc(doc(db, 'users', userId), {
      profile: cleanedProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Profile saved to Firestore');
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// Load user profile from Firestore
export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.profile as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error;
  }
};

// Save wardrobe item to Firestore
export const addWardrobeItem = async (userId: string, garment: Garment) => {
  try {
    const docRef = doc(db, 'users', userId);
    
    const garmentWithMeta = {
      ...garment,
      id: `garment-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, {
      wardrobe: arrayUnion(garmentWithMeta),
      updatedAt: new Date().toISOString()
    });
    
    console.log('Wardrobe item added to Firestore');
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
