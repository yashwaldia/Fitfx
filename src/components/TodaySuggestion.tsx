import React from 'react';
import type { OutfitData } from '../types';
import { CalendarIcon } from './Icons';

interface TodaySuggestionProps {
  suggestion: OutfitData | null;
  onViewCalendar: () => void;
}

const TodaySuggestion: React.FC<TodaySuggestionProps> = ({ suggestion, onViewCalendar }) => {
  if (!suggestion) {
    return (
        <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-500">Loading today's suggestion...</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[inset_5px_5px_10px_#1a1a1a,inset_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">Today's Color Suggestion</h3>
        <div className="bg-gray-900/50 p-4 rounded-lg text-center space-y-2">
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                {suggestion['Colour Combination']}
            </p>
            <p className="text-sm text-gray-400">
                Try pairing a <span className="font-semibold text-gray-200">{suggestion['T-Shirt/Shirt']}</span> with <span className="font-semibold text-gray-200">{suggestion['Trousers/Bottom']}</span>.
            </p>
             <button onClick={onViewCalendar} className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline pt-2">
                <CalendarIcon className="w-4 h-4" />
                View Full Calendar Plan
            </button>
        </div>
    </div>
  );
};

export default TodaySuggestion;
