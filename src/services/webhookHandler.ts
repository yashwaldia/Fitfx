import { 
  handleLemonSubscriptionCreated, 
  handleLemonSubscriptionUpdated, 
  handleLemonSubscriptionCancelled 
} from './subscriptionService';
import type { SubscriptionTier } from '../types';

/**
 * Parse Lemon Squeezy webhook payload
 */
export interface LemonWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: 'active' | 'cancelled' | 'past_due' | 'expired';
      customer_id: number;
      variant_id: number;
      ends_at?: string;
      [key: string]: any;
    };
    relationships?: {
      customer?: {
        data: {
          id: string;
        };
      };
    };
  };
}

/**
 * Determine subscription tier from variant ID
 */
export function getTierFromVariantId(variantId: number): SubscriptionTier | null {
  const styleplus = parseInt(process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID || '0');
  const stylex = parseInt(process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID || '0');

  if (variantId === styleplus) return 'style_plus';
  if (variantId === stylex) return 'style_x';
  return null;
}

/**
 * Handle subscription.created webhook
 */
export async function handleSubscriptionCreated(
  payload: LemonWebhookPayload
): Promise<void> {
  const uid = payload.meta.custom_data?.user_id;
  if (!uid) {
    console.error('No user_id in custom_data:', payload);
    return;
  }

  const tier = getTierFromVariantId(payload.data.attributes.variant_id);
  if (!tier) {
    console.error('Unknown variant ID:', payload.data.attributes.variant_id);
    return;
  }

  await handleLemonSubscriptionCreated(uid, {
    subscriptionId: payload.data.id,
    customerId: String(payload.data.attributes.customer_id),
    tier,
    endDate: payload.data.attributes.ends_at,
  });

  console.log(`✅ Subscription created for user ${uid} - Tier: ${tier}`);
}

/**
 * Handle subscription.updated webhook
 */
export async function handleSubscriptionUpdated(
  payload: LemonWebhookPayload
): Promise<void> {
  const uid = payload.meta.custom_data?.user_id;
  if (!uid) {
    console.error('No user_id in custom_data:', payload);
    return;
  }

  const tier = getTierFromVariantId(payload.data.attributes.variant_id);
  if (!tier) {
    console.error('Unknown variant ID:', payload.data.attributes.variant_id);
    return;
  }

  await handleLemonSubscriptionUpdated(uid, {
    subscriptionId: payload.data.id,
    tier,
    status: payload.data.attributes.status,
  });

  console.log(`✅ Subscription updated for user ${uid}`);
}

/**
 * Handle subscription.cancelled webhook
 */
export async function handleSubscriptionCancelled(
  payload: LemonWebhookPayload
): Promise<void> {
  const uid = payload.meta.custom_data?.user_id;
  if (!uid) {
    console.error('No user_id in custom_data:', payload);
    return;
  }

  await handleLemonSubscriptionCancelled(uid);
  console.log(`✅ Subscription cancelled for user ${uid}`);
}

/**
 * Main webhook router
 */
export async function handleWebhook(
  eventName: string,
  payload: LemonWebhookPayload
): Promise<void> {
  console.log(`🔔 Webhook received: ${eventName}`);

  switch (eventName) {
    case 'subscription_created':
      await handleSubscriptionCreated(payload);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(payload);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(payload);
      break;
    default:
      console.log(`⚠️ Unhandled event: ${eventName}`);
  }
}
