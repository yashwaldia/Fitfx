import React, { useState } from 'react';
// ✨ UPDATED IMPORTS: Use new subscription functions
import { createAndRedirectToSubscription, cancelUserSubscription } from '../services/razorpayService';
import { SUBSCRIPTION_PLANS, getPlanByTier } from '../constants/subscriptionPlans';
import { SparklesIcon } from './Icons';
import type { SubscriptionTier, UserProfile } from '../types';

interface SubscriptionManagerProps {
  userProfile: UserProfile;
  userEmail?: string;
  userId?: string;
  onSubscriptionUpdated: (newTier: SubscriptionTier) => void;
  onOpenPlanModal?: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userProfile,
  userEmail = 'user@fitfx.com',
  userId = '',
  onSubscriptionUpdated,
  onOpenPlanModal,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Safe null coalescing with fallback
  const currentTier = userProfile?.subscription?.tier ?? 'free';
  const currentPlan = getPlanByTier(currentTier);
  const subscription = userProfile?.subscription;

  /**
   * Helper function to get plan features display
   */
  const getPlanFeatureDisplay = (tier: SubscriptionTier) => {
    const displays = {
      free: {
        chat: '5 messages/day',
        outfits: '3 ideas',
        colors: '5 colors',
        wardrobe: 'No access',
        editor: 'No access',
      },
      style_plus: {
        chat: '20 messages/day',
        outfits: 'Unlimited ideas',
        colors: '10 colors',
        wardrobe: '10 items',
        editor: 'AI Editor',
      },
      style_x: {
        chat: 'Unlimited messages',
        outfits: 'Unlimited ideas',
        colors: '15+ colors',
        wardrobe: 'Unlimited',
        editor: 'Advanced Editor',
      },
    };
    return displays[tier] || displays.free;
  };

  /**
   * ✨ Handle upgrade via Razorpay Subscription
   */
  const handleUpgrade = async (tier: 'style_plus' | 'style_x') => {
    setIsLoading(true);
    setError(null);

    try {
      // ✨ VALIDATE USER DATA FROM PROPS
      if (!userId) {
        throw new Error('User not authenticated. Please log in.');
      }

      if (!userEmail) {
        throw new Error('User email not found.');
      }

      console.log(`💳 Initiating Razorpay subscription upgrade for tier: ${tier}`);
      
      // ✨ NEW: Create subscription via API
      await createAndRedirectToSubscription(
        tier,
        userId,
        userEmail,
        userProfile?.name || 'User'
      );

      // Note: Redirect happens inside the function, so we might not reach here
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open payment';
      setError(errorMessage);
      console.error('❌ Upgrade error:', errorMessage);
      setIsLoading(false);
    }
  };

  /**
   * ✨ Handle cancel subscription via API
   */
  const handleCancel = async () => {
    if (!subscription?.razorpaySubscriptionId) {
      setError('No active subscription ID found to cancel.');
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to cancel your subscription? Your access will continue until the end of the current billing cycle, then you will be downgraded to Free tier.'
      )
    ) {
      setIsLoading(true);
      setError(null);

      try {
        // ✨ Call backend API to cancel
        await cancelUserSubscription(userId, subscription.razorpaySubscriptionId);
        
        setSuccessMessage('Subscription cancelled successfully. Access remains until end of cycle.');
        
        // Refresh UI (optional, or wait for webhook/reload)
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        console.log('✅ Subscription cancelled');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
        setError(errorMessage);
        console.error('❌ Cancellation error:', errorMessage);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          💳 Subscription Settings
        </h2>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6">
             ✓ {successMessage}
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Current Plan</h3>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-3xl font-bold text-yellow-400">{currentPlan?.name}</p>
              <p className="text-gray-400 mt-1">
                {currentTier === 'free' ? (
                  'Start free, upgrade anytime'
                ) : (
                  <>
                    ₹<span className="text-yellow-300">{currentPlan?.price}</span>/month
                  </>
                )}
              </p>
              {subscription?.startDate && (
                <p className="text-sm text-gray-500 mt-2">
                  Since {new Date(subscription.startDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>

            {/* Status Badge & Upgrade Button */}
            <div className="flex flex-col items-end gap-3">
              <span
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${
                  currentTier === 'free'
                    ? 'bg-gray-700 text-gray-300'
                    : subscription?.status === 'active' 
                        ? 'bg-green-400/20 text-green-300 border border-green-400/50'
                        : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50'
                }`}
              >
                {subscription?.status === 'active' ? '✓ Active' : '⚠ ' + (subscription?.status ?? 'unknown')}
              </span>

              {/* Upgrade Button - Visible when not on StyleX tier */}
              {onOpenPlanModal && currentTier !== 'style_x' && (
                <button
                  onClick={onOpenPlanModal}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {currentTier === 'free' ? 'Upgrade Plan' : 'Upgrade to StyleX'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Plan Features Detail */}
        {currentPlan && (
          <div className="bg-gray-900/30 rounded-lg p-4 mb-6 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">✨ Your Benefits</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <p className="text-2xl mb-1">💬</p>
                <p className="text-xs text-gray-400">Chat Messages</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {getPlanFeatureDisplay(currentTier).chat}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1">👔</p>
                <p className="text-xs text-gray-400">Outfit Ideas</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {getPlanFeatureDisplay(currentTier).outfits}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1">🎨</p>
                <p className="text-xs text-gray-400">Colors</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {getPlanFeatureDisplay(currentTier).colors}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1">👜</p>
                <p className="text-xs text-gray-400">Wardrobe</p>
                <p
                  className={`text-sm font-semibold ${
                    getPlanFeatureDisplay(currentTier).wardrobe.includes('No')
                      ? 'text-gray-500'
                      : 'text-yellow-300'
                  }`}
                >
                  {getPlanFeatureDisplay(currentTier).wardrobe}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1">🖼️</p>
                <p className="text-xs text-gray-400">Image Editor</p>
                <p
                  className={`text-sm font-semibold ${
                    getPlanFeatureDisplay(currentTier).editor.includes('No')
                      ? 'text-gray-500'
                      : 'text-yellow-300'
                  }`}
                >
                  {getPlanFeatureDisplay(currentTier).editor}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Options - Show for Free tier */}
        {currentTier === 'free' && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-300">🚀 Upgrade Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.filter((p) => p.tier !== 'free').map((plan) => (
                <button
                  key={plan.tier}
                  onClick={() => handleUpgrade(plan.tier as 'style_plus' | 'style_x')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-2 border-yellow-400/50 hover:border-yellow-400 rounded-lg p-4 text-left transition-all duration-300 disabled:opacity-50 hover:bg-gradient-to-r hover:from-yellow-400/30 hover:to-yellow-600/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-yellow-400">{plan.name}</p>
                      <p className="text-gray-300 text-sm">₹{plan.price}/month</p>
                    </div>
                    {plan.tier === 'style_plus' && (
                      <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-bold">
                        Popular ⭐
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plan Management - Show for paid users */}
        {currentTier !== 'free' && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-300">⚙️ Plan Management</h3>

            {/* Upgrade to StyleX Button for Style+ users */}
            {currentTier === 'style_plus' && onOpenPlanModal && (
              <button
                onClick={onOpenPlanModal}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                Upgrade to StyleX for More Features
              </button>
            )}

            {/* Cancel Subscription Button */}
            {subscription?.razorpaySubscriptionId && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full bg-red-500/20 border-2 border-red-500/50 hover:border-red-500 text-red-400 font-semibold py-3 rounded-lg transition-all disabled:opacity-50 hover:bg-red-500/30"
              >
                {isLoading ? '⏳ Processing...' : '❌ Cancel Subscription'}
              </button>
            )}
            
            <p className="text-xs text-gray-500">
              Cancel anytime. Your access will continue until the end of your billing period.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* All Plans Comparison */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">📊 All Plans Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const features = getPlanFeatureDisplay(plan.tier as SubscriptionTier);
              const isCurrentPlan = currentTier === plan.tier;

              return (
                <div
                  key={plan.tier}
                  className={`p-4 rounded-lg border-2 transition-all transform ${
                    isCurrentPlan
                      ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-lg shadow-yellow-400/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-white">{plan.name}</p>
                    {isCurrentPlan && (
                      <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-bold">
                        Current ✓
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-sm text-gray-400 mb-3">
                    {plan.price === 0 ? '🎉 Free Forever' : `₹${plan.price}/month`}
                  </p>

                  {/* Feature Comparison Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-300 pb-2 border-b border-gray-700">
                      <span>💬 Chat:</span>
                      <span className="text-yellow-300 font-semibold">{features.chat}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 pb-2 border-b border-gray-700">
                      <span>👔 Outfits:</span>
                      <span className="text-yellow-300 font-semibold">{features.outfits}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 pb-2 border-b border-gray-700">
                      <span>🎨 Colors:</span>
                      <span className="text-yellow-300 font-semibold">{features.colors}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 pb-2 border-b border-gray-700">
                      <span>👜 Wardrobe:</span>
                      <span
                        className={
                          features.wardrobe.includes('No')
                            ? 'text-gray-500'
                            : 'text-yellow-300 font-semibold'
                        }
                      >
                        {features.wardrobe}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>🖼️ Editor:</span>
                      <span
                        className={
                          features.editor.includes('No')
                            ? 'text-gray-500'
                            : 'text-yellow-300 font-semibold'
                        }
                      >
                        {features.editor}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">👤 Account Information</h3>
          <div className="space-y-3 text-sm bg-gray-900/30 rounded-lg p-4 border border-gray-700">
            <div>
              <p className="text-gray-400">Name</p>
              <p className="text-white font-semibold">{userProfile?.name ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="text-white font-semibold break-all">{userEmail}</p>
            </div>

            {/* ✨ Razorpay Subscription ID (NEW) */}
            {subscription?.razorpaySubscriptionId && (
              <div>
                <p className="text-gray-400">Subscription ID</p>
                <p className="text-white font-mono text-xs break-all bg-gray-800 p-2 rounded">
                  {subscription.razorpaySubscriptionId}
                </p>
              </div>
            )}

            {/* ✨ Razorpay Payment ID */}
            {subscription?.razorpayPaymentId && (
              <div>
                <p className="text-gray-400">Payment ID</p>
                <p className="text-white font-mono text-xs break-all bg-gray-800 p-2 rounded">
                  {subscription.razorpayPaymentId}
                </p>
              </div>
            )}

            <div>
              <p className="text-gray-400">Account Type</p>
              <p className="text-white font-semibold">{userProfile?.gender ?? 'N/A'}</p>
            </div>

            {subscription && (
              <div>
                <p className="text-gray-400">Subscription Status</p>
                <p
                  className={`font-semibold ${
                    subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {subscription.status === 'active' ? '✓ Active' : '⚠️ ' + subscription.status}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
