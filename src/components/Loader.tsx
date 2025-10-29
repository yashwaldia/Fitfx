
import React from 'react';
import { SparklesIcon } from './Icons';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <SparklesIcon className="w-12 h-12 text-yellow-400 animate-pulse" />
      <h2 className="text-2xl font-semibold text-yellow-400">Styling Your Look...</h2>
      <p className="text-gray-400 max-w-md">
        Our AI is analyzing your selfie to find the perfect color palettes, fabrics, and outfit combinations just for you. This might take a moment!
      </p>
    </div>
  );
};

export default Loader;
