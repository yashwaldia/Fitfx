import { updateSubscriptionTier } from './firestoreService';
import type { SubscriptionTier } from '../types';


/**
 * Initialize Lemon Squeezy checkout
 */
export interface CheckoutOptions {
  variantId: string;
  email: string;
  customData?: {
    user_id: string;
  };
}


/**
 * ✅ NEW: Validate environment variables at module load time
 */
function validateEnvVariables(): void {
  const requiredVars = {
    'REACT_APP_LEMON_STORE_ID': process.env.REACT_APP_LEMON_STORE_ID,
    'REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID': process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID,
    'REACT_APP_LEMON_STYLE_X_VARIANT_ID': process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing Lemon Squeezy environment variables: ${missing.join(', ')}. ` +
      `Check your .env.local file.`
    );
  } else {
    console.log('✅ All Lemon Squeezy environment variables loaded');
  }
}

// Run validation when module loads
validateEnvVariables();


/**
 * Open Lemon Squeezy checkout in new window
 * ✅ UPDATED: Better error handling and logging
 */
export async function openLemonCheckout(options: CheckoutOptions): Promise<void> {
  try {
    const { variantId, email, customData } = options;
    const storeId = process.env.REACT_APP_LEMON_STORE_ID;

    // ✅ NEW: Enhanced validation with detailed error messages
    if (!storeId) {
      throw new Error(
        'Lemon Squeezy Store ID is missing. Check REACT_APP_LEMON_STORE_ID in .env.local'
      );
    }

    if (!variantId) {
      throw new Error(
        'Variant ID is missing. Cannot open checkout without a valid plan variant.'
      );
    }

    if (!email) {
      throw new Error('Email is required for Lemon Squeezy checkout');
    }

    // ✅ NEW: Log the checkout URL (for debugging)
    const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/${storeId}/${variantId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${customData?.user_id || 'unknown'}`;
    
    console.log('🍋 Opening Lemon Squeezy Checkout:', {
      store: storeId,
      variant: variantId,
      email: email,
      userId: customData?.user_id,
    });

    // Open in popup or new window
    const width = 700;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popupWindow = window.open(
      checkoutUrl,
      'lemonsqueezy-checkout',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    // ✅ NEW: Check if popup was blocked
    if (!popupWindow) {
      throw new Error(
        'Popup blocked! Please enable popups in your browser and try again.'
      );
    }

    console.log('✅ Lemon Squeezy checkout opened successfully');
  } catch (error) {
    console.error('❌ Error opening checkout:', error);
    throw error;
  }
}


/**
 * Get tier from Lemon Squeezy variant ID
 * ✅ UPDATED: Better type handling and validation
 */
export function getTierFromVariantId(variantId: string | number): SubscriptionTier | null {
  const stylePlusId = process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID;
  const styleXId = process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID;

  // ✅ NEW: Convert to string for consistent comparison
  const variantIdStr = String(variantId);

  if (!stylePlusId || !styleXId) {
    console.warn('⚠️ Variant IDs not configured in environment');
    return null;
  }

  if (variantIdStr === stylePlusId) {
    console.log('✅ Variant matched: style_plus');
    return 'style_plus';
  }

  if (variantIdStr === styleXId) {
    console.log('✅ Variant matched: style_x');
    return 'style_x';
  }

  console.warn(`⚠️ Unknown variant ID: ${variantIdStr}`);
  return null;
}


/**
 * Get variant ID from subscription tier
 * ✅ UPDATED: Better error handling and null checks
 */
export function getVariantIdFromTier(tier: SubscriptionTier): string | null {
  switch (tier) {
    case 'style_plus': {
      const id = process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID;
      if (!id) {
        console.error('❌ REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID not configured');
      }
      return id || null;
    }
    case 'style_x': {
      const id = process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID;
      if (!id) {
        console.error('❌ REACT_APP_LEMON_STYLE_X_VARIANT_ID not configured');
      }
      return id || null;
    }
    case 'free':
      return null; // Free tier doesn't have a variant
    default:
      console.warn(`⚠️ Unknown tier: ${tier}`);
      return null;
  }
}


/**
 * Handle successful payment
 * Called after user completes Lemon Squeezy checkout (via webhook or callback)
 * ✅ UPDATED: Better logging and error handling
 */
export async function handlePaymentSuccess(
  uid: string,
  tier: SubscriptionTier,
  subscriptionData?: {
    subscriptionId?: string;
    customerId?: string;
    orderId?: string;
  }
): Promise<void> {
  try {
    if (!uid) {
      throw new Error('User ID is required to process payment');
    }

    if (tier === 'free') {
      throw new Error('Cannot process payment for free tier');
    }

    console.log('💳 Processing payment success:', {
      uid,
      tier,
      subscriptionId: subscriptionData?.subscriptionId,
    });

    await updateSubscriptionTier(uid, tier, {
      subscriptionId: subscriptionData?.subscriptionId,
      customerId: subscriptionData?.customerId,
    });

    console.log(`✅ Payment successful! User upgraded to ${tier}`);
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    throw error;
  }
}


/**
 * Listen for payment completion message from popup
 * ✅ UPDATED: Better security checks and event handling
 */
export function setupPaymentListener(
  uid: string,
  tier: SubscriptionTier,
  onSuccess: () => void,
  onError?: (error: Error) => void
): () => void {
  const handleMessage = async (event: MessageEvent) => {
    try {
      // ✅ NEW: Verify origin for security
      if (event.origin !== window.location.origin) {
        console.warn('⚠️ Message from untrusted origin:', event.origin);
        return;
      }

      // ✅ NEW: Better event type checking
      if (event.data?.type === 'LEMON_PAYMENT_SUCCESS') {
        console.log('📨 Received payment success message');

        await handlePaymentSuccess(uid, tier, event.data.data);
        onSuccess();
      } else if (event.data?.type === 'LEMON_PAYMENT_ERROR') {
        const error = new Error(event.data.message || 'Payment failed');
        console.error('❌ Payment error:', error);
        onError?.(error);
      }
    } catch (error) {
      console.error('❌ Error in payment listener:', error);
      onError?.(error as Error);
    }
  };

  window.addEventListener('message', handleMessage);

  // ✅ NEW: Return cleanup function with logging
  return () => {
    console.log('🧹 Cleaning up payment listener');
    window.removeEventListener('message', handleMessage);
  };
}


/**
 * ✅ NEW: Helper function to check if payment system is ready
 */
export function isLemonSqueezyConfigured(): boolean {
  const storeId = process.env.REACT_APP_LEMON_STORE_ID;
  const stylePlusId = process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID;
  const styleXId = process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID;

  const isConfigured = !!(storeId && stylePlusId && styleXId);

  if (!isConfigured) {
    console.warn(
      '⚠️ Lemon Squeezy is not fully configured. Missing: ' +
      [
        !storeId ? 'REACT_APP_LEMON_STORE_ID' : null,
        !stylePlusId ? 'REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID' : null,
        !styleXId ? 'REACT_APP_LEMON_STYLE_X_VARIANT_ID' : null,
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  return isConfigured;
}


/**
 * ✅ NEW: Get all configured variant IDs for debugging
 */
export function getConfiguredVariants(): Record<string, string | undefined> {
  return {
    store_id: process.env.REACT_APP_LEMON_STORE_ID,
    style_plus_variant: process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID,
    style_x_variant: process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID,
  };
}
