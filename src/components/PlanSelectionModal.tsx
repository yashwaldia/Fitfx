import React, { useState } from 'react';
import PlanCard from './PlanCard';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import type { SubscriptionTier } from '../types';

interface PlanSelectionModalProps {
  onPlanSelect: (tier: SubscriptionTier) => Promise<void>;
  isOpen: boolean;
  isLoading?: boolean;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ onPlanSelect, isOpen, isLoading = false }) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlanSelect = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setIsProcessing(true);
    try {
      await onPlanSelect(tier);
    } catch (error) {
      console.error('Error selecting plan:', error);
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Non-dismissible */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 border-b border-gray-700">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">Choose Your Plan</h1>
            <p className="text-gray-300 text-lg">
              Unlock premium features and elevate your styling experience
            </p>
          </div>

          {/* Plans Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <PlanCard
                  key={plan.tier}
                  plan={plan}
                  isSelected={selectedTier === plan.tier}
                  onSelect={() => handlePlanSelect(plan.tier as SubscriptionTier)}
                  isLoading={isProcessing && selectedTier === plan.tier}
                />
              ))}
            </div>

            {/* Info Text */}
            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>New User?</strong> Start with Free tier - no credit card required. 
                Upgrade anytime to unlock more features!
              </p>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Frequently Asked Questions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FAQ Item 1 */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Can I upgrade later?</h4>
                  <p className="text-sm text-gray-300">
                    Yes! You can upgrade from Free to Style+ or StyleX anytime from your settings.
                  </p>
                </div>

                {/* FAQ Item 2 */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Is there a trial period?</h4>
                  <p className="text-sm text-gray-300">
                    Free tier acts as your trial. Upgrade to paid plans when you're ready.
                  </p>
                </div>

                {/* FAQ Item 3 */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Can I cancel anytime?</h4>
                  <p className="text-sm text-gray-300">
                    Yes! Cancel your subscription anytime. No questions asked.
                  </p>
                </div>

                {/* FAQ Item 4 */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">What payment methods do you accept?</h4>
                  <p className="text-sm text-gray-300">
                    We accept all major credit cards, debit cards, and digital wallets via Lemon Squeezy.
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Feature Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Feature</th>
                      <th className="text-center py-3 px-4 text-gray-300 font-semibold">Free</th>
                      <th className="text-center py-3 px-4 text-yellow-400 font-semibold">Style+</th>
                      <th className="text-center py-3 px-4 text-yellow-400 font-semibold">StyleX</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-300">Color Suggestions</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">10</td>
                      <td className="text-center py-3 px-4">15</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-300">Outfit Previews</td>
                      <td className="text-center py-3 px-4">3</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">8</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-300">Image Editor</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-300">Wardrobe Items</td>
                      <td className="text-center py-3 px-4">0</td>
                      <td className="text-center py-3 px-4">10</td>
                      <td className="text-center py-3 px-4">∞</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-300">Batch Generation</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlanSelectionModal;
