import React from 'react';
import type { SubscriptionTier } from '../types';

interface SubscriptionExpiredNoticeProps {
  previousTier: SubscriptionTier;
  hiddenItems: number;
}

const SubscriptionExpiredNotice: React.FC<SubscriptionExpiredNoticeProps> = ({ previousTier, hiddenItems }) => {
  const getFreezeMessage = () => {
    switch (previousTier) {
      case 'style_plus':
        return `Your Style+ subscription has expired. You now have access to only 1 wardrobe item (Free tier). ${hiddenItems} ${hiddenItems === 1 ? 'item is' : 'items are'} hidden.`;
      case 'style_x':
        return `Your StyleX subscription has expired. You now have access to only 1 wardrobe item (Free tier). ${hiddenItems} ${hiddenItems === 1 ? 'item is' : 'items are'} hidden.`;
      default:
        return 'Your subscription has expired.';
    }
  };

  const getTierEmoji = () => {
    switch (previousTier) {
      case 'style_plus': return '📌';
      case 'style_x': return '⭐';
      default: return '⏰';
    }
  };

  return (
    <div className="bg-red-900/20 border-2 border-red-700/50 rounded-xl p-4 space-y-3 animate-pulse-slow">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-1 animate-bounce">{getTierEmoji()}</span>
        <div className="flex-1">
          <h3 className="text-red-300 font-bold text-sm md:text-base">Subscription Expired</h3>
          <p className="text-red-200 text-xs md:text-sm mt-1">{getFreezeMessage()}</p>
        </div>
      </div>
      <div className="bg-red-900/30 rounded-lg p-3 text-xs text-red-100 border border-red-800/30">
        <div className="flex gap-2">
          <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="font-semibold mb-1">Your wardrobe is safe!</p>
            <p>All {hiddenItems} hidden {hiddenItems === 1 ? 'item' : 'items'} will reappear automatically when you renew your subscription. Nothing will be deleted.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <a href="/subscription" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 font-bold text-sm rounded-full hover:bg-yellow-300 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/30">
          <span>🔄</span> Renew Subscription
        </a>
        <a href="/plans" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 text-gray-200 font-semibold text-sm rounded-full hover:bg-gray-600 transition-all duration-300">
          <span>📋</span> View Plans
        </a>
      </div>
      <div className="text-xs text-red-300 pt-2 border-t border-red-800/30">
        📞 Need help? <a href="mailto:support@fitfx.com" className="underline hover:text-red-200">Contact Support</a>
      </div>
    </div>
  );
};

export default SubscriptionExpiredNotice;
