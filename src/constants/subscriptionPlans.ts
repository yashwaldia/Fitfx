import type { PlanConfig, FeatureLimits } from '../types';

// Feature limits for each tier
export const FEATURE_LIMITS: Record<string, FeatureLimits> = {
  free: {
    colorSuggestions: 5,
    outfitPreviews: 3,
    wardrobeLimit: 0,              // No wardrobe access
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic'
  },
  style_plus: {
    colorSuggestions: 10,
    outfitPreviews: 5,
    wardrobeLimit: 10,             // Max 10 items
    imageEditorAccess: true,
    batchGeneration: false,
    chatbotAccess: 'standard'
  },
  style_x: {
    colorSuggestions: 15,
    outfitPreviews: 8,
    wardrobeLimit: -1,             // Unlimited (-1)
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'premium'
  }
};

// Plan configurations
export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: [
      'Basic profile creation',
      '1 selfie analysis',
      'Up to 5 color suggestions',
      '3 outfit previews',
      'Basic chatbot access'
    ],
    limits: FEATURE_LIMITS.free
  },
  {
    tier: 'style_plus',
    name: 'Style+',
    price: 49,
    currency: 'INR',
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free',
      'Up to 10 color suggestions',
      'AI Image Editor access',
      '5 outfit previews per request',
      'Wardrobe management (10 items)',
      'Standard chatbot support'
    ],
    limits: FEATURE_LIMITS.style_plus,
    lemonsqueezyVariantId: process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID || ''
  },
  {
    tier: 'style_x',
    name: 'StyleX',
    price: 99,
    currency: 'INR',
    interval: 'month',
    features: [
      'Everything in Style+',
      'Up to 15 color suggestions',
      'Batch image generation',
      '8 outfit previews per request',
      'Unlimited wardrobe items',
      'Premium AI models',
      'Priority support'
    ],
    limits: FEATURE_LIMITS.style_x,
    lemonsqueezyVariantId: process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID || ''
  }
];

// Helper functions
export function getPlanByTier(tier: string): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
}

export function getFeatureLimits(tier: string): FeatureLimits {
  return FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
}

// ✅ FIXED: Proper type checking
export function canAccessFeature(tier: string, feature: keyof FeatureLimits): boolean {
  const limits = getFeatureLimits(tier);
  const value = limits[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0 || value === -1; // -1 means unlimited
  return true;
}
