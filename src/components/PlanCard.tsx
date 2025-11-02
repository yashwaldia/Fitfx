import React from 'react';
import type { PlanConfig } from '../types';
import type { SubscriptionTier } from '../types';

interface PlanCardProps {
  plan: PlanConfig;
  isSelected: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  onSelect,
  isLoading = false,
}) => {
  // ✅ FIXED: Dynamic price display (now reads from plan.price)
  const displayPrice = plan.price === 0 ? '0' : plan.price.toString();

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 ${
        isSelected
          ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-lg shadow-yellow-400/30'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800/70'
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
          
          {/* ✅ Price - Dynamic from plan.price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-4xl font-bold text-yellow-400">
              ₹{displayPrice}
            </span>
            {plan.price > 0 && (
              <span className="text-sm text-gray-400">/month</span>
            )}
          </div>

          {plan.tier === 'style_plus' && (
            <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
              Most Popular
            </div>
          )}
        </div>

        <ul className="space-y-2 mb-6 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-yellow-400 font-bold mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            {plan.tier === 'free' && (
              <>
                <p>🎨 5 Color Suggestions</p>
                <p>👔 No Wardrobe Access</p>
                <p>🖼️ No Image Editor</p>
              </>
            )}
            {plan.tier === 'style_plus' && (
              <>
                <p>🎨 10 Color Suggestions</p>
                <p>👔 10 Wardrobe Items</p>
                <p>🖼️ AI Image Editor Access</p>
              </>
            )}
            {plan.tier === 'style_x' && (
              <>
                <p>🎨 15 Color Suggestions</p>
                <p>👔 Unlimited Wardrobe Items</p>
                <p>🖼️ Batch Image Generation</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onSelect}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            plan.tier === 'free'
              ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-lg shadow-yellow-400/30 hover:shadow-xl hover:shadow-yellow-400/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : plan.tier === 'free' ? (
            'Continue with Free'
          ) : (
            `Choose ${plan.name}`
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
