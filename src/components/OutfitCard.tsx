import React, { useState } from 'react';
import type { OutfitIdea } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

const handleSmartBuyClick = (item: string) => {
  alert(`Simulating "Smart Buy" search for: ${item}`);
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-start">
        <p className="w-24 flex-shrink-0 text-yellow-500/80 font-medium text-sm">{label}</p>
        <div className="text-gray-300 text-sm">{children}</div>
    </div>
);

// FIX: Added interface for component props to resolve missing type error.
interface OutfitCardProps {
  idea: OutfitIdea;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ idea }) => {
  const [isCopied, setIsCopied] = useState(false);
  const pairingItems = idea.suggestedPairingItems.split(',').map(item => item.trim());

  const handleCopyColors = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(idea.colorName).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    }).catch(err => {
        console.error('Failed to copy colors: ', err);
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl p-5 flex flex-col h-full shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2c2c2c] border border-gray-700 transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-[8px_8px_16px_#1a1a1a,_-8px_-8px_16px_#2c2c2c]">
      <div className="flex-grow">
        <h4 className="text-lg font-bold text-yellow-400 mb-1">{idea.outfitName}</h4>
        <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">{idea.idealOccasion}</p>
        
        <div className="space-y-3 mb-4">
            <DetailRow label="Colors">
                <div className="flex items-center gap-2">
                    <p>{idea.colorName}</p>
                    <button 
                        onClick={handleCopyColors} 
                        title="Copy Colors" 
                        className="text-gray-500 hover:text-yellow-400 transition-colors"
                        disabled={isCopied}
                    >
                        {isCopied ? 
                            <CheckIcon className="w-4 h-4 text-green-400" /> : 
                            <CopyIcon className="w-4 h-4" />
                        }
                    </button>
                </div>
            </DetailRow>
            <DetailRow label="Fabric"><p>{idea.fabricType}</p></DetailRow>
            <DetailRow label="Wear it with">
                <div className="flex flex-wrap gap-2">
                    {pairingItems.map((item, index) => (
                        <button 
                            key={index} 
                            onClick={() => handleSmartBuyClick(item)}
                            className="bg-gray-700/50 text-yellow-300/80 text-xs font-medium px-2 py-1 rounded-md transition-colors duration-200 hover:bg-yellow-400/20 hover:text-yellow-300"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </DetailRow>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-700">
        <p className="text-xs italic text-gray-400">
            <span className="font-semibold text-yellow-500/80">Why it works:</span> {idea.whyItWorks}
        </p>
      </div>
    </div>
  );
};

export default OutfitCard;