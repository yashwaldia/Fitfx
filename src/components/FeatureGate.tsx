import React from 'react';
import { LockIcon } from './Icons';
import { getFeatureLimits, canAccessFeature } from '../constants/subscriptionPlans';
import type { SubscriptionTier, FeatureLimits } from '../types';

interface FeatureGateProps {
  tier: SubscriptionTier;
  feature: keyof FeatureLimits;  // ✅ FIXED: Properly typed to keyof FeatureLimits
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ 
  tier, 
  feature, 
  children, 
  fallback,
  onUpgradeClick 
}) => {
  const hasAccess = canAccessFeature(tier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, show that
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state UI
  return (
    <div className="relative opacity-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50 rounded-lg z-10 flex items-center justify-center">
        <button
          onClick={onUpgradeClick}
          className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-yellow-500 transition-colors pointer-events-auto"
        >
          <LockIcon className="w-5 h-5" />
          Upgrade to Unlock
        </button>
      </div>
      {children}
    </div>
  );
};

export default FeatureGate;
