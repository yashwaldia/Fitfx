import React, { useState, useEffect } from 'react';
import PlanCard from './PlanCard';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import { loadRazorpayScript } from '../services/razorpayService';
import type { SubscriptionTier } from '../types';

interface PlanSelectionModalProps {
  onPlanSelect: (tier: SubscriptionTier) => Promise<void>;
  isOpen: boolean;
  isLoading?: boolean;
  onClose?: () => void;
  currentTier?: SubscriptionTier;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ 
  onPlanSelect, 
  isOpen, 
  isLoading = false,
  onClose,
  currentTier = 'free'
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript()
        .then((success) => {
          if (!success) {
            console.warn('⚠️ Failed to load Razorpay script');
          }
        })
        .catch((err) => {
          console.error('Error loading Razorpay:', err);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('🎬 PlanSelectionModal - currentTier:', currentTier);
    }
  }, [isOpen, currentTier]);

  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isOpen]);

  // ✨ Handle plan selection - Let App.tsx handle Razorpay
  const handlePlanSelect = async (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      console.log('⚠️ Already on this plan:', tier);
      return;
    }

    setSelectedTier(tier);
    setIsProcessing(true);
    setError(null);

    try {
      // ✨ Call onPlanSelect - App.tsx will handle Razorpay redirect
      console.log(`💳 Selecting plan: ${tier}`);
      await onPlanSelect(tier);
      
      // Success - App.tsx handles the redirect
    } catch (err) {
      console.error('❌ Error initiating checkout:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden">
        <div 
          className="bg-gray-900 border-2 border-gray-700 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 md:p-8 border-b border-gray-700 flex-shrink-0 relative">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-all group"
                aria-label="Close modal"
              >
                <svg 
                  className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2 pr-12">
              Choose Your Plan
            </h1>
            <p className="text-gray-300 text-base md:text-lg">
              Unlock premium features and elevate your styling experience
            </p>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="p-4 md:p-8">
              
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
                  ❌ {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrentPlan = plan.tier === currentTier;
                  
                  return (
                    <PlanCard
                      key={plan.tier}
                      plan={plan}
                      isSelected={selectedTier === plan.tier}
                      onSelect={() => handlePlanSelect(plan.tier as SubscriptionTier)}
                      isLoading={isProcessing && selectedTier === plan.tier}
                      isCurrent={isCurrentPlan}
                    />
                  );
                })}
              </div>

              <div className="mt-6 md:mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 <strong>New User?</strong> Start with Free tier - no credit card required. 
                  Upgrade anytime to unlock more features!
                </p>
              </div>

              <div className="mt-6 md:mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400">Frequently Asked Questions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-semibold text-white mb-2">Can I upgrade later?</h4>
                    <p className="text-sm text-gray-300">
                      Yes! You can upgrade from Free to Style+ or StyleX anytime from your settings.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-semibold text-white mb-2">Is there a trial period?</h4>
                    <p className="text-sm text-gray-300">
                      Free tier acts as your trial. Upgrade to paid plans when you're ready.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-semibold text-white mb-2">Can I cancel anytime?</h4>
                    <p className="text-sm text-gray-300">
                      Yes! Cancel your subscription anytime. No questions asked.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-semibold text-white mb-2">What payment methods do you accept?</h4>
                    <p className="text-sm text-gray-300">
                      We accept all major credit cards, debit cards, and digital wallets via Razorpay.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 pb-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Feature Comparison</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Feature</th>
                        <th className="text-center py-3 px-4 text-gray-300 font-semibold">Free</th>
                        <th className="text-center py-3 px-4 text-yellow-400 font-semibold">Style+</th>
                        <th className="text-center py-3 px-4 text-yellow-400 font-semibold">StyleX</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/50">
                      <tr className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300">Color Suggestions</td>
                        <td className="text-center py-3 px-4 text-gray-400">5</td>
                        <td className="text-center py-3 px-4 text-white">10</td>
                        <td className="text-center py-3 px-4 text-yellow-400 font-bold">15</td>
                      </tr>
                      <tr className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300">Outfit Previews</td>
                        <td className="text-center py-3 px-4 text-gray-400">3</td>
                        <td className="text-center py-3 px-4 text-white">5</td>
                        <td className="text-center py-3 px-4 text-yellow-400 font-bold">8</td>
                      </tr>
                      <tr className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300">Image Editor</td>
                        <td className="text-center py-3 px-4 text-gray-400">❌</td>
                        <td className="text-center py-3 px-4 text-green-400">✅</td>
                        <td className="text-center py-3 px-4 text-green-400">✅</td>
                      </tr>
                      <tr className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300">Wardrobe Items</td>
                        <td className="text-center py-3 px-4 text-gray-400">0</td>
                        <td className="text-center py-3 px-4 text-white">10</td>
                        <td className="text-center py-3 px-4 text-yellow-400 font-bold">∞</td>
                      </tr>
                      <tr className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300">Batch Generation</td>
                        <td className="text-center py-3 px-4 text-gray-400">❌</td>
                        <td className="text-center py-3 px-4 text-gray-400">❌</td>
                        <td className="text-center py-3 px-4 text-green-400">✅</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-sm text-gray-400">
                  💳 <strong>Secure payment powered by Razorpay</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Your payment information is encrypted and secure. You can manage or cancel your subscription anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlanSelectionModal;
