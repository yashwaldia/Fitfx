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
 * Open Lemon Squeezy checkout in new window
 */
export async function openLemonCheckout(options: CheckoutOptions): Promise<void> {
  try {
    const { variantId, email, customData } = options;
    const storeId = process.env.REACT_APP_LEMON_STORE_ID;

    if (!storeId || !variantId) {
      throw new Error('Missing Lemon Squeezy configuration');
    }

    // Build checkout URL with custom data
    const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/${storeId}/${variantId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${customData?.user_id}`;

    // Open in popup or new window
    const width = 700;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      checkoutUrl,
      'lemonsqueezy-checkout',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    console.log('✅ Lemon Squeezy checkout opened');
  } catch (error) {
    console.error('Error opening checkout:', error);
    throw error;
  }
}

/**
 * Get tier from Lemon variant ID
 */
export function getTierFromVariantId(variantId: string): SubscriptionTier | null {
  const stylePlusId = process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID;
  const styleXId = process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID;

  if (variantId === stylePlusId) return 'style_plus';
  if (variantId === styleXId) return 'style_x';
  return null;
}

/**
 * Get variant ID from tier
 */
export function getVariantIdFromTier(tier: SubscriptionTier): string | null {
  switch (tier) {
    case 'style_plus':
      return process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID || null;
    case 'style_x':
      return process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID || null;
    default:
      return null;
  }
}

/**
 * Handle successful payment
 * Called after user completes Lemon Squeezy checkout
 */
export async function handlePaymentSuccess(
  uid: string,
  tier: SubscriptionTier,
  subscriptionData?: {
    subscriptionId?: string;
    customerId?: string;
  }
): Promise<void> {
  try {
    await updateSubscriptionTier(uid, tier, {
      subscriptionId: subscriptionData?.subscriptionId,
      customerId: subscriptionData?.customerId,
    });

    console.log(`✅ Payment successful! User upgraded to ${tier}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Listen for payment completion message from popup
 */
export function setupPaymentListener(
  uid: string,
  tier: SubscriptionTier,
  onSuccess: () => void,
  onError?: (error: Error) => void
): () => void {
  const handleMessage = async (event: MessageEvent) => {
    // Verify origin for security
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'LEMON_PAYMENT_SUCCESS') {
      try {
        await handlePaymentSuccess(uid, tier, event.data.data);
        onSuccess();
      } catch (error) {
        onError?.(error as Error);
      }
    }
  };

  window.addEventListener('message', handleMessage);

  // Return cleanup function
  return () => window.removeEventListener('message', handleMessage);
}
