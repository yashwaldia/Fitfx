import React, { useState } from 'react';
import type { StyleAdvice } from '../types';
import OutfitCard from './OutfitCard';
import { PaletteIcon, ShirtIcon, SparklesIcon, RefreshIcon, UserCircleIcon, ColorSwatchIcon, WardrobeIcon } from './Icons';

interface AIResultDisplayProps {
  advice: StyleAdvice;
  image: string | null;
  onReset: () => void;
}

const InfoBlock: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-yellow-400">{icon}</div>
        <h3 className="text-xl font-semibold text-yellow-400">{title}</h3>
      </div>
      <div className="text-gray-300 prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed max-w-none">
        {children}
      </div>
    </div>
);


const AIResultDisplay: React.FC<AIResultDisplayProps> = ({ advice, image, onReset }) => {
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(advice.colorPalette[0]?.hexCode ?? null);

  return (
    <div className="animate-fade-in-up space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700">
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full flex-shrink-0 bg-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
                    {image ? (
                        <img src={image} alt="User selfie" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-12 h-12 text-gray-500" />
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                        Your Style Analysis
                    </h2>
                    <p className="text-gray-400">Here are your personalized recommendations!</p>
                </div>
            </div>
            <button
                onClick={onReset}
                className="inline-flex items-center justify-center px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all duration-300 ease-in-out hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
            >
                <RefreshIcon className="w-5 h-5 mr-2" />
                Start Over
            </button>
      </div>

      <InfoBlock icon={<PaletteIcon className="w-6 h-6" />} title="Fashion Summary">
        <p>{advice.fashionSummary}</p>
      </InfoBlock>

      <InfoBlock icon={<ColorSwatchIcon className="w-6 h-6" />} title="Your Personalized Color Palette">
        <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
                 <p className="text-gray-400 mb-4 text-sm">Click on a color to preview it. These key colors will make you look and feel your best. Use them as a foundation for your wardrobe.</p>
                <div className="space-y-3">
                    {advice.colorPalette.map((color, index) => (
                        <div 
                            key={index}
                            onClick={() => setSelectedColorHex(color.hexCode)}
                            className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg transition-all duration-300 hover:bg-gray-900 cursor-pointer border-2 border-transparent hover:border-yellow-400/50"
                        >
                            <div 
                                className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-gray-700 shadow-inner"
                                style={{ backgroundColor: color.hexCode }}
                            ></div>
                            <div>
                                <h4 className="font-semibold text-gray-200">{color.colorName}
                                    <span className="ml-2 text-xs font-mono text-gray-500 opacity-75">{color.hexCode}</span>
                                </h4>
                                <p className="text-sm text-gray-400">{color.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="md:w-1/3 flex items-center justify-center">
                <div 
                    className="w-full h-48 md:h-full rounded-2xl shadow-lg transition-colors duration-500 ease-in-out flex items-center justify-center border-2 border-gray-700"
                    style={{ backgroundColor: selectedColorHex ?? 'transparent' }}
                >
                    {!selectedColorHex && <p className="text-gray-500">Select a color</p>}
                </div>
            </div>
        </div>
      </InfoBlock>

      {advice.wardrobeOutfitIdeas && advice.wardrobeOutfitIdeas.length > 0 && (
        <div>
            <div className="flex items-center gap-3 mb-4 ml-2">
                <div className="text-yellow-400"><WardrobeIcon className="w-6 h-6" /></div>
                <h3 className="text-2xl font-semibold text-yellow-400">Outfit Ideas From Your Wardrobe</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advice.wardrobeOutfitIdeas.map((idea, index) => (
                <OutfitCard key={index} idea={idea} />
                ))}
            </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4 ml-2">
            <div className="text-yellow-400"><ShirtIcon className="w-6 h-6" /></div>
            <h3 className="text-2xl font-semibold text-yellow-400">New Outfit Ideas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advice.outfitIdeas.map((idea, index) => (
            <OutfitCard key={index} idea={idea} />
            ))}
        </div>
      </div>
      
      <InfoBlock icon={<SparklesIcon className="w-6 h-6" />} title="Material & Fabric Advice">
        <p>{advice.materialAdvice}</p>
      </InfoBlock>

      <div className="text-center text-yellow-300/80 italic text-lg border-t border-b border-yellow-400/20 py-6">
        "{advice.motivationalNote}"
      </div>
    </div>
  );
};

export default AIResultDisplay;