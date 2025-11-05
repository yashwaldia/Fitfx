import React from 'react';
import type { StyleAdvice } from '../types';
import { PaletteIcon, SparklesIcon, RefreshIcon, UserCircleIcon } from './Icons';

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

// ✨ AI-GENERATED PERSONALIZED DRESS MATRIX TABLE
const AIGeneratedDressMatrix: React.FC<{ advice: StyleAdvice }> = ({ advice }) => {
  if (!advice.generatedDressMatrix || advice.generatedDressMatrix.length === 0) {
    return <p className="text-gray-400">No dress recommendations available.</p>;
  }

  return (
    <div className="overflow-x-auto bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-yellow-400/50 sticky top-0 bg-gray-800">
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Country</th>
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Gender</th>
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Dress Name</th>
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Description</th>
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Occasion</th>
            <th className="text-left px-4 py-3 font-bold text-yellow-400">Notes</th>
          </tr>
        </thead>
        <tbody>
          {advice.generatedDressMatrix.map((dress, index) => (
            <tr 
              key={index} 
              className="border-b border-gray-700/30 hover:bg-gray-800/40 transition-colors duration-200"
            >
              <td className="px-4 py-3 text-gray-200 font-semibold">{dress.country}</td>
              <td className="px-4 py-3 text-gray-300 capitalize">{dress.gender}</td>
              <td className="px-4 py-3 text-yellow-300 font-semibold">{dress.dressName}</td>
              <td className="px-4 py-3 text-gray-300 max-w-xs">{dress.description}</td>
              <td className="px-4 py-3 text-gray-300">{dress.occasion}</td>
              <td className="px-4 py-3 text-gray-400 text-xs italic">{dress.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AIResultDisplay: React.FC<AIResultDisplayProps> = ({ advice, image, onReset }) => {
  return (
    <div className="animate-fade-in-up space-y-8">
        {/* Header */}
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

      {/* Fashion Summary */}
      <InfoBlock icon={<PaletteIcon className="w-6 h-6" />} title="Fashion Summary">
        <p>{advice.fashionSummary}</p>
      </InfoBlock>

      {/* ✨ AI-GENERATED PERSONALIZED DRESS MATRIX */}
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-yellow-400"><PaletteIcon className="w-6 h-6" /></div>
          <h3 className="text-xl font-semibold text-yellow-400">Your Personalized Dress Recommendations</h3>
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          AI-generated recommendations tailored specifically to your skin tone, age, body type, location, and personal style. Each dress has been selected with YOU in mind.
        </p>
        <AIGeneratedDressMatrix advice={advice} />
      </div>

      {/* Material & Fabric Advice */}
      <InfoBlock icon={<SparklesIcon className="w-6 h-6" />} title="Material & Fabric Advice">
        <p>{advice.materialAdvice}</p>
      </InfoBlock>

      {/* Motivational Note */}
      <div className="text-center text-yellow-300/80 italic text-lg border-t border-b border-yellow-400/20 py-6">
        "{advice.motivationalNote}"
      </div>
    </div>
  );
};

export default AIResultDisplay;
