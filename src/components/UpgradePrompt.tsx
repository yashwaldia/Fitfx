import React from 'react';
import { SparklesIcon } from './Icons';
import type { SubscriptionTier } from '../types';

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  featureName: string;
  requiredTier: 'style_plus' | 'style_x';
  onUpgradeClick: () => void;
  message?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentTier,
  featureName,
  requiredTier,
  onUpgradeClick,
  message
}) => {
  const getUpgradeMessage = () => {
    if (currentTier === 'free') {
      return `Upgrade to ${requiredTier === 'style_x' ? 'StyleX' : 'Style+'} to unlock ${featureName}`;
    }
    if (currentTier === 'style_plus' && requiredTier === 'style_x') {
      return `Upgrade to StyleX to unlock ${featureName}`;
    }
    return `Unlock ${featureName} with a higher tier`;
  };

  return (
    <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-2 border-yellow-500/30 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <SparklesIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-300">{message || getUpgradeMessage()}</h4>
          <p className="text-sm text-gray-300 mt-1">
            Get access to this feature and many more by upgrading your plan.
          </p>
        </div>
      </div>
      <button
        onClick={onUpgradeClick}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded-lg transition-colors duration-300"
      >
        Upgrade Now
      </button>
    </div>
  );
};

export default UpgradePrompt;
