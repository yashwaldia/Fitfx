import React from 'react';
import type { Occasion, Style } from '../types';

interface StyleSelectorProps {
  occasion: Occasion;
  setOccasion: (occasion: Occasion) => void;
  style: Style;
  setStyle: (style: Style) => void;
}

const occasions: Occasion[] = ['Professional', 'Party', 'Casual', 'Other'];
const styles: Style[] = ['American', 'Indian', 'Fusion'];

// The props for the NeumorphicButton component.
interface NeumorphicButtonProps<T> {
  label: string;
  value: T;
  selectedValue: T;
  onClick: (value: T) => void;
}

// FIX: Replaced the 'function' declaration with a 'const' arrow function using TSX-compatible
// generic syntax (<T,>). This helps TypeScript correctly identify it as a React component,
// which knows how to handle the special 'key' prop without it being in the props interface.
const NeumorphicButton = <T,>({
  label,
  value,
  selectedValue,
  onClick,
}: NeumorphicButtonProps<T>) => {
  const isActive = value === selectedValue;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
        isActive
          ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2c2c2c]'
          : 'bg-gray-800 text-gray-400 shadow-[3px_3px_6px_#1a1a1a,_-3px_-3px_6px_#2c2c2c] hover:text-yellow-400'
      }`}
    >
      {label}
    </button>
  );
};

const StyleSelector: React.FC<StyleSelectorProps> = ({ occasion, setOccasion, style, setStyle }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">Choose the Occasion</h3>
        <div className="flex justify-center items-center gap-2 md:gap-4 p-2 bg-gray-900 rounded-full">
          {occasions.map((o) => (
            <NeumorphicButton<Occasion> key={o} label={o} value={o} selectedValue={occasion} onClick={setOccasion} />
          ))}
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">Select Your Style</h3>
        <div className="flex justify-center items-center gap-2 md:gap-4 p-2 bg-gray-900 rounded-full">
          {styles.map((s) => (
            <NeumorphicButton<Style> key={s} label={s} value={s} selectedValue={style} onClick={setStyle} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;