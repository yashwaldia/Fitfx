import React from 'react';
import { CheckCircleIcon } from './Icons';
import type { PlanConfig } from '../types';

interface PlanCardProps {
  plan: PlanConfig;
  isSelected?: boolean;
  onSelect: (tier: string) => void;
  isLoading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onSelect, isLoading }) => {
  const isFreeTier = plan.tier === 'free';
  
  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-500/30'
          : 'border-gray-600 bg-gray-800/50 hover:border-yellow-300'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} overflow-hidden`}
      onClick={() => !isLoading && onSelect(plan.tier)}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-1 rounded-bl-lg font-bold text-sm">
          Most Popular
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Plan Name */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-yellow-400">₹{plan.price}</span>
            {!isFreeTier && <span className="text-gray-400">/month</span>}
            {isFreeTier && <span className="text-gray-400 text-lg">Forever Free</span>}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2 py-4 border-t border-b border-gray-700">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => !isLoading && onSelect(plan.tier)}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
            isFreeTier
              ? 'bg-gray-700 text-yellow-400 border border-yellow-400/50 hover:bg-gray-600'
              : isSelected
              ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
              : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : isFreeTier ? (
            'Continue with Free'
          ) : isSelected ? (
            '✓ Selected'
          ) : (
            'Choose Plan'
          )}
        </button>

        {/* Limits Info */}
        <div className="text-xs text-gray-400 space-y-1 pt-2">
          <div>🎨 {plan.limits.colorSuggestions} Color Suggestions</div>
          <div>👗 {plan.limits.wardrobeLimit === -1 ? 'Unlimited' : plan.limits.wardrobeLimit === 0 ? 'No Access' : plan.limits.wardrobeLimit} Wardrobe Items</div>
          {plan.limits.imageEditorAccess && <div>✨ AI Image Editor Access</div>}
          {plan.limits.batchGeneration && <div>🖼️ Batch Image Generation</div>}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
