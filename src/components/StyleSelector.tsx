import React from 'react';
import type { Occasion, Country } from '../types';

interface StyleSelectorProps {
  occasion: Occasion;
  setOccasion: (occasion: Occasion) => void;
  country: Country;
  setCountry: (country: Country) => void;
}

// ✨ UPDATED: 9 Occasions instead of 4
const occasions: Occasion[] = [
  'Traditional',
  'Cultural',
  'Modern',
  'Casual',
  'Festive',
  'Wedding',
  'Formal',
  'Business',
  'Street Fusion'
];

// ✨ UPDATED: 6 Countries instead of 3 Styles
const countries: Country[] = [
  'India',
  'USA',
  'Japan',
  'France',
  'Africa (Nigeria, Ghana, Kenya)',
  'Arab Region'
];

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

const StyleSelector: React.FC<StyleSelectorProps> = ({
  occasion,
  setOccasion,
  country,
  setCountry,
}) => {
  return (
    <div className="space-y-6">
      {/* ✨ SECTION 1: Choose the Occasion (9 options) */}
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">
          Choose the Occasion
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-gray-900 rounded-full">
          {occasions.map((o) => (
            <NeumorphicButton<Occasion>
              key={o}
              label={o}
              value={o}
              selectedValue={occasion}
              onClick={setOccasion}
            />
          ))}
        </div>
      </div>

      {/* ✨ SECTION 2: Select Your Country (6 options - replaced "Style") */}
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">
          Select Your Country
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-gray-900 rounded-full">
          {countries.map((c) => (
            <NeumorphicButton<Country>
              key={c}
              label={c}
              value={c}
              selectedValue={country}
              onClick={setCountry}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;
