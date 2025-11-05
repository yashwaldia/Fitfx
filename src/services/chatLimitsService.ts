import type { SubscriptionTier } from '../types';

// Define message limits per tier per day
const CHAT_MESSAGE_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  style_plus: 20,
  style_x: 999, // Unlimited (practical limit)
};

// Storage key for tracking daily messages
const getStorageKey = (userId: string): string => `chat_messages_${userId}_${new Date().toDateString()}`;

export const getChatMessageLimit = (tier: SubscriptionTier): number => {
  return CHAT_MESSAGE_LIMITS[tier];
};

export const getDailyMessageCount = (userId: string): number => {
  const key = getStorageKey(userId);
  const count = localStorage.getItem(key);
  return count ? parseInt(count, 10) : 0;
};

export const getRemainingMessages = (userId: string, tier: SubscriptionTier): number => {
  const limit = getChatMessageLimit(tier);
  const used = getDailyMessageCount(userId);
  return Math.max(0, limit - used);
};

export const incrementMessageCount = (userId: string): void => {
  const key = getStorageKey(userId);
  const current = getDailyMessageCount(userId);
  localStorage.setItem(key, (current + 1).toString());
};

export const canSendMessage = (userId: string, tier: SubscriptionTier): boolean => {
  return getRemainingMessages(userId, tier) > 0;
};

export const getMessageLimitWarning = (remaining: number, limit: number): string => {
  if (remaining === 0) {
    return `You've reached your daily limit of ${limit} messages. Upgrade to access more!`;
  }
  if (remaining <= 2) {
    return `⚠️ Only ${remaining} message(s) remaining today.`;
  }
  return '';
};
