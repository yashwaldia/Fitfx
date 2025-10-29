import type { UserProfile, OutfitData } from '../types';

// This interface is local to this file as it's how the JSON is structured.
interface SuggestionsData {
  professional: { american: OutfitData[]; indian: OutfitData[] };
  party: { american: OutfitData[]; indian: OutfitData[] };
  casual: { american: OutfitData[]; indian: OutfitData[] };
}

/**
 * Requests permission from the user to send notifications.
 * @returns A promise that resolves with the user's permission choice.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.error("This browser does not support desktop notifications.");
    return 'denied';
  }

  // If permission is already granted, we're good.
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // If permission has been denied, we can't ask again.
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  // Otherwise, ask the user for permission.
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Generates and sends a daily outfit notification if permission is granted
 * and a notification hasn't been sent for the current day.
 * @param userProfile - The user's style profile.
 * @param suggestions - The full dataset of outfit suggestions.
 */
export const scheduleDailyNotification = (userProfile: UserProfile, suggestions: SuggestionsData): void => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const lastNotificationDate = localStorage.getItem('fitfx-last-notification-date');
  const today = new Date().toISOString().split('T')[0];

  // Only send one notification per day
  if (lastNotificationDate === today) {
    console.log("Notification has already been sent today.");
    return;
  }

  // Determine occasion based on the day of the week
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const occasion: 'professional' | 'party' | 'casual' = 
    (dayOfWeek >= 1 && dayOfWeek <= 5) ? 'professional' : (dayOfWeek === 6 ? 'party' : 'casual');
  
  // Prefer user's style, with a fallback
  const preferredStyle = userProfile.preferredStyles[0]?.toLowerCase();
  const styleType: 'american' | 'indian' = (preferredStyle === 'american' || preferredStyle === 'indian') ? preferredStyle : 'american';

  const possibleOutfits = suggestions[occasion][styleType];
  if (!possibleOutfits || possibleOutfits.length === 0) return;

  const randomIndex = Math.floor(Math.random() * possibleOutfits.length);
  const suggestion = possibleOutfits[randomIndex];

  const title = "✨ Your FitFx Outfit Suggestion!";
  const body = `Today is a ${occasion} day! Try this combo: ${suggestion['Colour Combination']}. Perfect with a ${suggestion['T-Shirt/Shirt']}.`;
  
  // The icon can be a public URL or a local file in the public directory
  const icon = '/vite.svg'; 

  new Notification(title, { body, icon });

  // Record that a notification was sent today
  localStorage.setItem('fitfx-last-notification-date', today);
};
