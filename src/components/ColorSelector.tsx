import React from 'react';
import { PaletteIcon } from './Icons';

interface ColorSelectorProps {
  selectedColors: string[];
  onColorSelect: (hex: string) => void;
}

const FASHION_COLORS = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" }, { name: "Charcoal", hex: "#36454F" }, { name: "Grey", hex: "#808080" },
  { name: "Navy", hex: "#000080" }, { name: "Royal Blue", hex: "#4169E1" }, { name: "Sky Blue", hex: "#87CEEB" }, { name: "Turquoise", hex: "#40E0D0" },
  { name: "Emerald", hex: "#50C878" }, { name: "Olive", hex: "#808000" }, { name: "Mint Green", hex: "#98FF98" }, { name: "Sage", hex: "#B2AC88" },
  { name: "Red", hex: "#FF0000" }, { name: "Burgundy", hex: "#800020" }, { name: "Maroon", hex: "#800000" }, { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Fuchsia", hex: "#FF00FF" }, { name: "Blush Pink", hex: "#DE5D83" }, { name: "Lilac", hex: "#C8A2C8" }, { name: "Lavender", hex: "#E6E6FA" },
  { name: "Purple", hex: "#800080" }, { name: "Plum", hex: "#8E4585" }, { name: "Beige", hex: "#F5F5DC" }, { name: "Cream", hex: "#FFFDD0" },
  { name: "Tan", hex: "#D2B48C" }, { name: "Brown", hex: "#A52A2A" }, { name: "Chocolate", hex: "#7B3F00" }, { name: "Mustard", hex: "#FFDB58" },
  { name: "Gold", hex: "#FFD700" }, { name: "Orange", hex: "#FFA500" }, { name: "Coral", hex: "#FF7F50" }, { name: "Peach", hex: "#FFE5B4" },
];

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColors, onColorSelect }) => {
  const limit = 20;
  const isLimitReached = selectedColors.length >= limit;

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <PaletteIcon className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-400">Select Your Favorite Colors (Optional)</h3>
        </div>
        <p className={`text-sm font-medium ${isLimitReached ? 'text-yellow-400' : 'text-gray-400'}`}>
          {selectedColors.length} / {limit} selected
        </p>
      </div>
      <p className="text-gray-400 text-sm text-center mb-4">Choose colors you love. Our AI will try to include them in your recommendations!</p>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
        {FASHION_COLORS.map(({ name, hex }) => {
          const isSelected = selectedColors.includes(hex);
          return (
            <button
              key={hex}
              title={name}
              onClick={() => onColorSelect(hex)}
              disabled={isLimitReached && !isSelected}
              className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-200 border-2 
                ${isSelected 
                  ? 'border-yellow-400 scale-110 shadow-lg' 
                  : `border-gray-700/50 hover:border-gray-500 hover:scale-110`
                }
                ${isLimitReached && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}
              `}
              style={{ backgroundColor: hex }}
            >
                {isSelected && <span className="text-black font-bold text-lg">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorSelector;
