import React, { useState, useEffect } from 'react';
import AIEdit from './AIEdit';
import AITryOn from './AITryOn';
import AIFabricMixer from './AIFabricMixer';
import type { Garment, SubscriptionTier } from '../types';

interface ImageEditorProps {
  wardrobe?: Garment[];
  subscriptionTier?: SubscriptionTier;
  onUpgradeClick?: () => void;
}

type EditorMode = 'edit' | 'try-on' | 'fabric-mix';

const ImageEditor: React.FC<ImageEditorProps> = ({
  wardrobe = [],
  subscriptionTier = 'free',
  onUpgradeClick,
}) => {
  // ✅ Add useEffect to debug and log subscription tier
  useEffect(() => {
    console.log('🎬 ImageEditor.tsx - Received subscriptionTier prop:', subscriptionTier);
    console.log('📊 Type of subscriptionTier:', typeof subscriptionTier);
  }, [subscriptionTier]);

  // ✅ Feature access control based on subscription
  const features = {
    aiEdit: ['free', 'style_plus', 'style_x'].includes(subscriptionTier),
    aiTryOn: ['style_plus', 'style_x'].includes(subscriptionTier),
    aiFabricMix: ['style_x'].includes(subscriptionTier),
  };

  // ✅ Debug log features state
  useEffect(() => {
    console.log('🔐 Features state:', {
      subscriptionTier,
      aiEdit: features.aiEdit,
      aiTryOn: features.aiTryOn,
      aiFabricMix: features.aiFabricMix,
    });
  }, [features, subscriptionTier]);

  const [mode, setMode] = useState<EditorMode>('edit');
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: EditorMode) => {
    console.log('🔄 Mode change attempted:', newMode);
    console.log('📋 Current features:', features);
    
    if (newMode === 'try-on' && !features.aiTryOn) {
      console.log('❌ Try-On locked - subscription:', subscriptionTier);
      setError('✨ AI Try-On is available with Style+ subscription and above');
      if (onUpgradeClick) onUpgradeClick();
      return;
    }
    if (newMode === 'fabric-mix' && !features.aiFabricMix) {
      console.log('❌ Fabric Mixer locked - subscription:', subscriptionTier);
      setError('✨ AI Fabric Mixer is exclusive to StyleX subscription');
      if (onUpgradeClick) onUpgradeClick();
      return;
    }
    
    console.log('✅ Mode changed to:', newMode);
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Main Editor Section */}
      <div className="bg-gray-900 rounded-lg p-6 space-y-4 border-2 border-yellow-400/30">
        <div style={{ textAlign: 'center' }}>
          <h2 className="text-yellow-400 text-2xl font-bold mb-2">✨ AI Outfit Editor</h2>
          <p className="text-gray-400 text-sm">Unlock powerful AI features with your subscription</p>
          {/* ✅ Debug info (remove in production) */}
          <p className="text-yellow-600 text-xs mt-2">
            Subscription: <span className="font-bold">{subscriptionTier}</span>
          </p>
        </div>

        {/* Mode Selector with Subscription Gating */}
        <div className="flex justify-center mb-6">
          <div className="flex p-1 bg-gray-900 rounded-full gap-1 flex-wrap justify-center">
            {/* AI Edit Button */}
            <button
              onClick={() => handleModeChange('edit')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                mode === 'edit' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              ✏️ AI Edit
            </button>

            {/* AI Try-On Button */}
            {features.aiTryOn ? (
              <button
                onClick={() => handleModeChange('try-on')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                  mode === 'try-on' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                👗 AI Try-On
              </button>
            ) : (
              <button
                onClick={() => handleModeChange('try-on')}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-gray-500 hover:text-yellow-400 transition-colors cursor-not-allowed"
              >
                👗 Try-On 🔒
              </button>
            )}

            {/* Fabric Mixer Button */}
            {features.aiFabricMix ? (
              <button
                onClick={() => handleModeChange('fabric-mix')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                  mode === 'fabric-mix' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                🧵 Fabric Mixer
              </button>
            ) : (
              <button
                onClick={() => handleModeChange('fabric-mix')}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-gray-500 hover:text-yellow-400 transition-colors cursor-not-allowed"
              >
                🧵 Fabric 🔒
              </button>
            )}
          </div>
        </div>

        {/* Render Active Mode */}
        {mode === 'edit' && <AIEdit wardrobe={wardrobe} onError={setError} />}
        {mode === 'try-on' && features.aiTryOn && <AITryOn onError={setError} />}
        {mode === 'fabric-mix' && features.aiFabricMix && <AIFabricMixer onError={setError} />}

        {/* Error Message with Upgrade Button */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm">{error}</p>
            {(error.includes('Try-On') || error.includes('Fabric Mixer')) && onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="mt-2 w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold py-2 rounded transition-colors"
              >
                💎 Upgrade Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;