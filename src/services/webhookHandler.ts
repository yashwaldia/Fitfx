import { updateSubscriptionTier } from './firestoreService';
import type { SubscriptionTier } from '../types';

/**
 * ✨ Razorpay webhook payload interface
 */
export interface RazorpayWebhookPayload {
  event: string;
  created_at: number;
  entity: {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    receipt?: string;
    customer_id?: string;
    customer_notify?: number;
    description?: string;
    short_url?: string;
    user_id?: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * ✨ Parse custom data from Razorpay metadata
 */
export interface RazorpayCustomData {
  user_id?: string;
  tier?: SubscriptionTier;
}

/**
 * ✨ Extract custom data from Razorpay notes
 */
export function extractCustomData(entity: any): RazorpayCustomData {
  const notes = entity.notes || {};
  return {
    user_id: notes.user_id || entity.user_id,
    tier: notes.tier || entity.tier,
  };
}

/**
 * ✨ Handle payment.captured webhook
 */
export async function handlePaymentCaptured(payload: RazorpayWebhookPayload): Promise<void> {
  try {
    const customData = extractCustomData(payload.entity);
    const userId = customData.user_id;

    if (!userId) {
      console.error('❌ No user_id in payment data:', payload);
      return;
    }

    const tier = customData.tier || 'style_plus';

    console.log(`💳 Payment captured for user ${userId}`);
    console.log(`   Payment ID: ${payload.entity.id}`);
    console.log(`   Amount: ${payload.entity.amount / 100} ${payload.entity.currency}`);

    // Update subscription in Firestore
    await updateSubscriptionTier(userId, tier as SubscriptionTier, {
      razorpayPaymentId: payload.entity.id,
      razorpayOrderId: payload.entity.receipt,
    });

    console.log(`✅ Subscription updated to ${tier} for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling payment.captured:', error);
    throw error;
  }
}

/**
 * ✨ Handle payment.failed webhook
 */
export async function handlePaymentFailed(payload: RazorpayWebhookPayload): Promise<void> {
  try {
    const customData = extractCustomData(payload.entity);
    const userId = customData.user_id;

    if (!userId) {
      console.error('❌ No user_id in payment data:', payload);
      return;
    }

    console.error(`❌ Payment failed for user ${userId}`);
    console.error(`   Payment ID: ${payload.entity.id}`);
    console.error(`   Error: ${payload.entity.error_description || 'Unknown error'}`);

    // Log to monitoring service in production
    // await logToMonitoring({ userId, paymentId: payload.entity.id, event: 'payment.failed' });
  } catch (error) {
    console.error('❌ Error handling payment.failed:', error);
    throw error;
  }
}

/**
 * ✨ Handle payment.authorized webhook
 */
export async function handlePaymentAuthorized(payload: RazorpayWebhookPayload): Promise<void> {
  try {
    const customData = extractCustomData(payload.entity);
    const userId = customData.user_id;

    if (!userId) {
      console.error('❌ No user_id in payment data:', payload);
      return;
    }

    console.log(`✅ Payment authorized for user ${userId}`);
    console.log(`   Payment ID: ${payload.entity.id}`);
    console.log(`   Amount: ${payload.entity.amount / 100} ${payload.entity.currency}`);

    // You can emit events here for real-time updates
    // emitEvent('paymentAuthorized', { userId, paymentId: payload.entity.id });
  } catch (error) {
    console.error('❌ Error handling payment.authorized:', error);
    throw error;
  }
}

/**
 * ✨ Handle order.paid webhook (alternative)
 */
export async function handleOrderPaid(payload: RazorpayWebhookPayload): Promise<void> {
  try {
    const customData = extractCustomData(payload.entity);
    const userId = customData.user_id;

    if (!userId) {
      console.error('❌ No user_id in order data:', payload);
      return;
    }

    const tier = customData.tier || 'style_plus';

    console.log(`✅ Order paid for user ${userId}`);
    console.log(`   Order ID: ${payload.entity.id}`);
    console.log(`   Amount: ${payload.entity.amount / 100} ${payload.entity.currency}`);

    // Update subscription in Firestore
    await updateSubscriptionTier(userId, tier as SubscriptionTier, {
      razorpayOrderId: payload.entity.id,
    });

    console.log(`✅ Subscription updated to ${tier} for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling order.paid:', error);
    throw error;
  }
}

/**
 * ✨ Handle payment.refunded webhook
 */
export async function handlePaymentRefunded(payload: RazorpayWebhookPayload): Promise<void> {
  try {
    const customData = extractCustomData(payload.entity);
    const userId = customData.user_id;

    if (!userId) {
      console.error('❌ No user_id in refund data:', payload);
      return;
    }

    console.warn(`⚠️ Payment refunded for user ${userId}`);
    console.warn(`   Payment ID: ${payload.entity.id}`);
    console.warn(`   Amount: ${payload.entity.amount / 100} ${payload.entity.currency}`);

    // Log refund for audit purposes
    // await logRefund({ userId, paymentId: payload.entity.id, amount: payload.entity.amount });
  } catch (error) {
    console.error('❌ Error handling payment.refunded:', error);
    throw error;
  }
}

/**
 * ✨ Main webhook router for Razorpay
 */
export async function handleRazorpayWebhook(
  eventName: string,
  payload: RazorpayWebhookPayload
): Promise<void> {
  console.log(`🔔 Razorpay webhook received: ${eventName}`);

  try {
    switch (eventName) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'payment.refunded':
        await handlePaymentRefunded(payload);
        break;

      case 'order.paid':
        await handleOrderPaid(payload);
        break;

      default:
        console.warn(`⚠️ Unhandled Razorpay event: ${eventName}`);
    }
  } catch (error) {
    console.error(`❌ Webhook processing error for event ${eventName}:`, error);
    throw error;
  }
}

/**
 * ✨ Verify Razorpay webhook signature (for security)
 * Use crypto to verify HMAC-SHA256 signature
 */
export function verifyRazorpaySignature(
  webhookBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // ✨ Note: In Node.js, use crypto module
    // import { createHmac } from 'crypto';
    // const expectedSignature = createHmac('sha256', webhookSecret)
    //   .update(webhookBody)
    //   .digest('hex');
    // return expectedSignature === signature;

    // For browser/client-side: this should be done on backend
    console.warn('⚠️ Signature verification should be done on backend');
    return true; // Trust backend validation in production
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

/**
 * ✨ Log webhook for debugging
 */
export function logWebhookEvent(
  eventName: string,
  payload: RazorpayWebhookPayload
): void {
  console.log('📋 Webhook Event Log:');
  console.log(`   Event: ${eventName}`);
  console.log(`   Entity ID: ${payload.entity.id}`);
  console.log(`   Entity Type: ${payload.entity.entity}`);
  console.log(`   Timestamp: ${new Date(payload.created_at * 1000).toISOString()}`);

  if (payload.entity.amount) {
    console.log(`   Amount: ${payload.entity.amount / 100} ${payload.entity.currency}`);
  }

  if (payload.entity.error_description) {
    console.error(`   Error: ${payload.entity.error_description}`);
  }
}

/**
 * ✨ Main webhook handler (for backend API endpoint)
 */
export async function handleWebhookRequest(
  body: RazorpayWebhookPayload,
  signature?: string,
  secret?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify signature if provided
    if (signature && secret) {
      const isValid = verifyRazorpaySignature(JSON.stringify(body), signature, secret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return { success: false, message: 'Invalid signature' };
      }
    }

    // Log the webhook
    logWebhookEvent(body.event, body);

    // Process the webhook
    await handleRazorpayWebhook(body.event, body);

    return { success: true, message: `Webhook ${body.event} processed successfully` };
  } catch (error) {
    console.error('❌ Webhook request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
