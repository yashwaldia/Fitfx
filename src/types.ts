// ✨ Color Palette Item
export interface ColorPaletteItem {
  colorName: string;
  hexCode: string;
  description: string;
}

// ✨ UPDATED: 9 Occasions instead of 4
export type Occasion =
  | 'Traditional'
  | 'Cultural'
  | 'Modern'
  | 'Casual'
  | 'Festive'
  | 'Wedding'
  | 'Formal'
  | 'Business'
  | 'Street Fusion';

// ✨ NEW: Country type (Global style support)
export type Country =
  | 'India'
  | 'USA'
  | 'Japan'
  | 'France'
  | 'Africa (Nigeria, Ghana, Kenya)'
  | 'Arab Region';

// ✅ KEPT FOR BACKWARD COMPATIBILITY
export type Style = 'American' | 'Indian' | 'Fusion' | 'Other';

export type Gender = 'Male' | 'Female' | 'Unisex' | 'Kids';

export type AgeGroup =
  | 'Teen (13-17)'
  | 'Young Adult (18-25)'
  | 'Adult (26-35)'
  | 'Middle-Aged (36-45)'
  | 'Senior (46+)';

export type BodyType =
  | 'Rectangle'
  | 'Triangle'
  | 'Inverted Triangle'
  | 'Hourglass'
  | 'Round (Apple)'
  | 'Pear'
  | 'Athletic'
  | 'Slim / Lean'
  | 'Petite'
  | 'Tall'
  | 'Curvy'
  | 'Oval'
  | 'Straight / Column'
  | 'Diamond'
  | 'Muscular / V Shape'
  | 'Lollipop'
  | 'Skittle'
  | 'Top Hourglass'
  | 'Bottom Hourglass'
  | 'Plus Size';

// ✅ Subscription Types
export type SubscriptionTier = 'free' | 'style_plus' | 'style_x';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired' | 'completed';

// ✅ UPDATED: Subscription Interface (Razorpay Subscriptions API)
export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  
  // ✨ RAZORPAY FIELDS
  razorpaySubscriptionId?: string; // ✅ NEW: Subscription ID (sub_xxxxx)
  razorpayPaymentId?: string;      // Payment ID from successful charge
  razorpayOrderId?: string;        // Order ID
  razorpaySignature?: string;      // Signature for verification
  
  // ✨ TIMING
  startDate?: string;              // ISO timestamp
  endDate?: string;                // ISO timestamp
  cancelledAt?: string;            // ISO timestamp (when user cancelled)
  completedAt?: string;            // ISO timestamp (when sub ended)
  cancelAtPeriodEnd?: boolean;     // Will cancel at end of billing period
  updatedAt?: any;                 // Firestore timestamp
}

// ✅ Feature Limits per Tier
export interface FeatureLimits {
  colorSuggestions: number;
  outfitPreviews: number;
  wardrobeLimit: number;
  imageEditorAccess: boolean;
  batchGeneration: boolean;
  chatbotAccess: 'basic' | 'standard' | 'premium';
}

export interface Garment {
  image: string;
  material: string;
  color: string;
  id?: string;
  uploadedAt?: string;
}

export interface OutfitIdea {
  outfitName: string;
  colorName: string;
  fabricType: string;
  idealOccasion: string;
  whyItWorks: string;
  suggestedPairingItems: string;
}

// ✨ NEW: AI-Generated Dress Matrix Row
export interface AIGeneratedDressRow {
  country: Country;
  gender: Gender;
  dressName: string;
  description: string;
  occasion: Occasion;
  notes: string;
}

export interface StyleAdvice {
  fashionSummary: string;
  colorPalette: ColorPaletteItem[];
  outfitIdeas: OutfitIdea[];
  wardrobeOutfitIdeas?: OutfitIdea[];
  // ✨ NEW: AI-Generated Dress Matrix
  generatedDressMatrix: AIGeneratedDressRow[];
  materialAdvice: string;
  motivationalNote: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

// ✅ MAIN USER PROFILE - WITH ALL REQUIRED PROPERTIES
export interface UserProfile {
  id?: string; // ✨ ADD: Firebase user ID
  name: string;
  age: string;
  gender: Gender;
  preferredOccasions: Occasion[];
  preferredStyles: Style[];
  favoriteColors: string[];
  profilePhoto?: string;
  bodyType?: BodyType;
  preferredFabrics: string[];
  fashionIcons: string;
  hasSeenPlanModal?: boolean;
  subscription?: Subscription; // ✨ Razorpay subscription
}

export interface OutfitData {
  'Colour Combination': string;
  'T-Shirt/Shirt': string;
  'Trousers/Bottom': string;
  'Jacket/Layer': string;
  'Shoes & Accessories': string;
}

// ✅ UPDATED: Plan Configuration (Razorpay instead of LemonSqueezy)
export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: FeatureLimits;
  popular?: boolean;
  // ✨ RAZORPAY FIELDS
  razorpayPaymentLinkId?: string; // Razorpay Payment Link ID
  razorpayProductId?: string; // Product ID in Razorpay
}
