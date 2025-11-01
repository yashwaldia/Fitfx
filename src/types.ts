export interface ColorPaletteItem {
  colorName: string;
  hexCode: string;
  description: string;
}

export type Occasion = 'Professional' | 'Party' | 'Casual' | 'Other';
export type Style = 'American' | 'Indian' | 'Fusion' | 'Other';
export type Gender = 'Male' | 'Female' | 'Unisex' | 'Kids';
export type AgeGroup = 'Teen (13-17)' | 'Young Adult (18-25)' | 'Adult (26-35)' | 'Middle-Aged (36-45)' | 'Senior (46+)';

export type BodyType =
  'Rectangle' | 'Triangle' | 'Inverted Triangle' | 'Hourglass' | 'Round (Apple)' |
  'Pear' | 'Athletic' | 'Slim / Lean' | 'Petite' | 'Tall' | 'Curvy' | 'Oval' |
  'Straight / Column' | 'Diamond' | 'Muscular / V Shape' | 'Lollipop' |
  'Skittle' | 'Top Hourglass' | 'Bottom Hourglass' | 'Plus Size';

// ✅ NEW: Subscription Types
export type SubscriptionTier = 'free' | 'style_plus' | 'style_x';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired';

// ✅ NEW: Subscription Interface
export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  subscriptionId?: string;           // Lemon Squeezy subscription ID
  customerId?: string;                // Lemon Squeezy customer ID
  startDate?: string;                 // ISO timestamp
  endDate?: string;                   // ISO timestamp
  cancelAtPeriodEnd?: boolean;        // Will cancel at end of billing period
}

// ✅ NEW: Feature Limits per Tier
export interface FeatureLimits {
  colorSuggestions: number;           // Max color suggestions
  outfitPreviews: number;             // Max outfit generations per request
  wardrobeLimit: number;              // Max wardrobe items (0 = disabled, -1 = unlimited)
  imageEditorAccess: boolean;         // Can access Image Editor
  batchGeneration: boolean;           // Can generate multiple variations
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

export interface StyleAdvice {
  fashionSummary: string;
  colorPalette: ColorPaletteItem[];
  outfitIdeas: OutfitIdea[];
  wardrobeOutfitIdeas?: OutfitIdea[];
  materialAdvice: string;
  motivationalNote: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

// ✅ UPDATED: UserProfile with Subscription
export interface UserProfile {
  profilePhoto?: string;
  name: string;
  age: string;
  gender: Gender;
  bodyType?: BodyType;
  preferredOccasions: Occasion[];
  preferredStyles: Style[];
  favoriteColors: string[];
  preferredFabrics?: string[];
  fashionIcons?: string;
  
  // ✅ NEW: Subscription fields
  subscription: Subscription;
  hasSeenPlanModal?: boolean;         // Track if user has seen plan selection
}

export interface OutfitData {
  "Colour Combination": string;
  "T-Shirt/Shirt": string;
  "Trousers/Bottom": string;
  "Jacket/Layer": string;
  "Shoes & Accessories": string;
}

// ✅ NEW: Plan Configuration
export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: FeatureLimits;
  popular?: boolean;
  lemonsqueezyVariantId?: string;     // For payment integration
}
