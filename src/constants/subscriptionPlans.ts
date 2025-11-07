import type { PlanConfig, FeatureLimits } from '../types';

// ✨ Feature limits for each tier
export const FEATURE_LIMITS: Record<string, FeatureLimits> = {
  free: {
    colorSuggestions: 5,
    outfitPreviews: 3,
    wardrobeLimit: 0,
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic',
  },
  style_plus: {
    colorSuggestions: 10,
    outfitPreviews: 5,
    wardrobeLimit: 10,
    imageEditorAccess: true,
    batchGeneration: false,
    chatbotAccess: 'standard',
  },
  style_x: {
    colorSuggestions: 15,
    outfitPreviews: 8,
    wardrobeLimit: -1, // ✨ Unlimited
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'premium',
  },
};

// ✨ RAZORPAY SUBSCRIPTION PLANS (INR pricing for India)
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
      'Basic chatbot access',
      'Basic wardrobe view'
    ],
    limits: FEATURE_LIMITS.free,
  },
  {
    tier: 'style_plus',
    name: 'Style+',
    price: 49,
    currency: 'INR',
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free ✓',
      'Unlimited selfie analyses',
      'Up to 10 color suggestions',
      'AI Image Editor access',
      '5 outfit previews per request',
      'Wardrobe management (10 items)',
      'Standard chatbot support',
      'Priority response times'
    ],
    limits: FEATURE_LIMITS.style_plus,
    // ✨ RAZORPAY: Payment Link (from Razorpay Dashboard)
    razorpayPaymentLinkId: process.env.REACT_APP_RAZORPAY_PLUS_LINK || '',
  },
  {
    tier: 'style_x',
    name: 'StyleX',
    price: 99,
    currency: 'INR',
    interval: 'month',
    features: [
      'Everything in Style+ ✓',
      'Up to 15 color suggestions',
      'Batch image generation (5 per day)',
      '8 outfit previews per request',
      'Unlimited wardrobe items',
      'Premium AI models (GPT-4 level)',
      'Priority support (24/7)',
      'Advanced style analytics',
      'Export to PDF/PNG',
      'Custom color palette creation'
    ],
    limits: FEATURE_LIMITS.style_x,
    // ✨ RAZORPAY: Payment Link (from Razorpay Dashboard)
    razorpayPaymentLinkId: process.env.REACT_APP_RAZORPAY_X_LINK || '',
  },
];

/**
 * Get plan by tier
 */
export function getPlanByTier(tier: string): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier);
}

/**
 * Get feature limits by tier
 */
export function getFeatureLimits(tier: string): FeatureLimits {
  return FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
}

/**
 * Get wardrobe limit for tier
 */
export function getWardrobeLimit(tier: string): number {
  return FEATURE_LIMITS[tier]?.wardrobeLimit || FEATURE_LIMITS.free.wardrobeLimit;
}

/**
 * Check if user can access specific feature
 */
export function canAccessFeature(
  tier: string,
  feature: keyof FeatureLimits
): boolean {
  const limits = getFeatureLimits(tier);
  const value = limits[feature];

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0 || value === -1;
  return true;
}

/**
 * Check if user can add more wardrobe items
 */
export function canAddWardrobeItem(tier: string, currentCount: number): boolean {
  const limit = getWardrobeLimit(tier);
  if (limit === -1) return true; // Unlimited
  if (limit === 0) return false; // No access
  return currentCount < limit;
}

/**
 * Get wardrobe limit message
 */
export function getWardrobeLimitMessage(tier: string): string {
  const limit = getWardrobeLimit(tier);
  if (limit === -1) return '✅ Unlimited wardrobe access';
  if (limit === 0) return '❌ Wardrobe not available in free tier';
  return `📦 ${limit} wardrobe items maximum`;
}

/**
 * ✨ Get Razorpay payment link for tier
 */
export function getRazorpayPaymentLink(tier: string): string {
  const plan = getPlanByTier(tier);
  return plan?.razorpayPaymentLinkId || '';
}

/**
 * Check if tier is paid
 */
export function isPaidTier(tier: string): boolean {
  return tier !== 'free';
}

/**
 * Get all available tiers for display
 */
export function getAvailableTiers() {
  return SUBSCRIPTION_PLANS.map((plan) => ({
    tier: plan.tier,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    popular: plan.popular || false,
  }));
}

/**
 * Format price with currency
 */
export function formatPriceDisplay(tier: string): string {
  const plan = getPlanByTier(tier);
  if (!plan) return 'Free';

  if (plan.price === 0) {
    return '✨ Free Forever';
  }

  return `₹${plan.price}/${plan.interval}`;
}

/**
 * Get feature list for display
 */
export function getPlanFeatures(tier: string): string[] {
  const plan = getPlanByTier(tier);
  return plan?.features || [];
}

/**
 * Compare limits between two tiers
 */
export function compareTierLimits(
  tier1: string,
  tier2: string
): Record<string, { tier1: any; tier2: any }> {
  const limits1 = getFeatureLimits(tier1);
  const limits2 = getFeatureLimits(tier2);

  return {
    colorSuggestions: { tier1: limits1.colorSuggestions, tier2: limits2.colorSuggestions },
    outfitPreviews: { tier1: limits1.outfitPreviews, tier2: limits2.outfitPreviews },
    wardrobeLimit: { tier1: limits1.wardrobeLimit, tier2: limits2.wardrobeLimit },
    imageEditor: { tier1: limits1.imageEditorAccess, tier2: limits2.imageEditorAccess },
    batchGeneration: { tier1: limits1.batchGeneration, tier2: limits2.batchGeneration },
    chatbot: { tier1: limits1.chatbotAccess, tier2: limits2.chatbotAccess },
  };
}
