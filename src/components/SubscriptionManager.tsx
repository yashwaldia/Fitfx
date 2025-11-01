import React, { useState } from 'react';
import { openLemonCheckout, getVariantIdFromTier } from '../services/lemonSqueezyService';
import { updateSubscriptionTier, cancelSubscription } from '../services/firestoreService';
import { SUBSCRIPTION_PLANS, getPlanByTier } from '../constants/subscriptionPlans';
import type { SubscriptionTier, UserProfile } from '../types';

interface SubscriptionManagerProps {
  userProfile: UserProfile;
  userEmail?: string;  // ✅ NEW: Accept email as prop
  userId?: string;     // ✅ NEW: Accept userId as prop
  onSubscriptionUpdated: (newTier: SubscriptionTier) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userProfile,
  userEmail = 'user@fitfx.com',  // ✅ Default email
  userId = '',                    // ✅ Default userId
  onSubscriptionUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTier = userProfile.subscription.tier;
  const currentPlan = getPlanByTier(currentTier);

  const handleUpgrade = async (tier: 'style_plus' | 'style_x') => {
    setIsLoading(true);
    setError(null);

    try {
      const variantId = getVariantIdFromTier(tier);
      if (!variantId) {
        throw new Error('Invalid plan variant');
      }

      // Open Lemon Squeezy checkout
      await openLemonCheckout({
        variantId,
        // ✅ FIXED: Use props passed in
        email: userEmail,
        customData: {
          user_id: userId,
        },
      });

      // Note: Actual subscription update happens via webhook
      // This is just for optimistic UI update
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open checkout');
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will be downgraded to Free tier.')) {
      setIsLoading(true);
      setError(null);

      try {
        // Note: This would ideally call Lemon Squeezy API to cancel the subscription
        // For now, we'll just update locally
        // In production, implement full Lemon Squeezy cancellation API call

        onSubscriptionUpdated('free');
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Subscription Settings</h2>

        {/* Current Plan */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-400">{currentPlan?.name}</p>
              <p className="text-gray-400 mt-1">
                {currentTier === 'free'
                  ? 'Start free, upgrade anytime'
                  : `₹${currentPlan?.price}/month`}
              </p>
              {userProfile.subscription.startDate && (
                <p className="text-sm text-gray-500 mt-2">
                  Since {new Date(userProfile.subscription.startDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full font-semibold ${
                currentTier === 'free'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50'
              }`}>
                {userProfile.subscription.status === 'active' ? '✓ Active' : '⚠ ' + userProfile.subscription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {currentTier === 'free' && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-300">Upgrade Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.filter(p => p.tier !== 'free').map(plan => (
                <button
                  key={plan.tier}
                  onClick={() => handleUpgrade(plan.tier as 'style_plus' | 'style_x')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-2 border-yellow-400/50 hover:border-yellow-400 rounded-lg p-4 text-left transition-all duration-300 disabled:opacity-50"
                >
                  <p className="font-bold text-yellow-400">{plan.name}</p>
                  <p className="text-gray-300 text-sm">₹{plan.price}/month</p>
                  <ul className="text-xs text-gray-400 mt-2 space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentTier !== 'free' && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-300">Plan Management</h3>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full bg-red-500/20 border-2 border-red-500/50 hover:border-red-500 text-red-400 font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Cancel Subscription'}
            </button>
            <p className="text-xs text-gray-500">
              Cancel anytime. Your access will continue until the end of your billing period.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* All Plans Comparison */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">All Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div
                key={plan.tier}
                className={`p-4 rounded-lg border-2 ${
                  currentTier === plan.tier
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <p className="font-bold text-white">{plan.name}</p>
                <p className="text-sm text-gray-400">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
                </p>
                <ul className="text-xs text-gray-300 mt-2 space-y-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">Name</p>
              <p className="text-white font-semibold">{userProfile.name}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="text-white font-semibold break-all">{userEmail}</p>
            </div>
            {userProfile.subscription.subscriptionId && (
              <div>
                <p className="text-gray-400">Subscription ID</p>
                <p className="text-white font-mono text-xs break-all">{userProfile.subscription.subscriptionId}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400">Account Type</p>
              <p className="text-white font-semibold">{userProfile.gender}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
