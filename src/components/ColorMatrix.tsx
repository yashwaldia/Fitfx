import React, { useState, useEffect } from 'react';
import type { UserProfile, Garment } from '../types';
import { SparklesIcon, UserCircleIcon, RefreshIcon } from './Icons';
import { generatePersonalizedOutfits, PersonalizedOutfit } from '../services/outfitSuggestionService';
import { getColorHex, getColorName } from '../utils/colorUtils';

interface ColorMatrixProps {
  userProfile?: UserProfile | null;
  wardrobe: Garment[];
}

const ColorMatrix: React.FC<ColorMatrixProps> = ({ userProfile, wardrobe }) => {
    const [outfits, setOutfits] = useState<PersonalizedOutfit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'All' | 'Professional' | 'Party' | 'Casual'>('All');

    useEffect(() => {
        if (userProfile) {
            loadSuggestions();
        }
    }, [userProfile]);

    const loadSuggestions = async () => {
        if (!userProfile) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const suggestions = await generatePersonalizedOutfits(userProfile, wardrobe);
            setOutfits(suggestions);
        } catch (err: any) {
            console.error('Error loading suggestions:', err);
            setError('Failed to generate personalized suggestions. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOutfits = filter === 'All' 
        ? outfits 
        : outfits.filter(o => o.occasion === filter);

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <UserCircleIcon className="w-20 h-20 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 text-lg">Please complete your profile to get personalized suggestions</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-yellow-400 text-lg">Generating Your Personalized Outfit Suggestions...</p>
                    <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/50 border border-red-500 rounded-2xl p-8 text-center">
                <p className="text-red-200 text-lg mb-4">{error}</p>
                <button
                    onClick={loadSuggestions}
                    className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-full font-semibold hover:bg-yellow-500 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Personalized Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <SparklesIcon className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold text-yellow-400">
                        {userProfile.name}'s AI Style Guide
                    </h2>
                    <SparklesIcon className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-gray-400">
                    {outfits.length} personalized outfit combinations powered by AI
                </p>
            </div>

            {/* Your Preferences Section with Color Swatches */}
            {userProfile && (
                <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-yellow-400">Your Preferences</h4>
                        <button
                            onClick={loadSuggestions}
                            disabled={isLoading}
                            className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full text-gray-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            Regenerate
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {/* Styles */}
                        {userProfile.preferredStyles && userProfile.preferredStyles.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1.5">Styles:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.preferredStyles.map(style => (
                                        <span key={style} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                                            {style}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Favorite Colors with swatches */}
                        {userProfile.favoriteColors && userProfile.favoriteColors.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1.5">Favorite Colors:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.favoriteColors.map(color => {
                                        const colorName = getColorName(color);
                                        const hexColor = getColorHex(color);
                                        
                                        return (
                                            <div 
                                                key={color}
                                                className="flex items-center gap-2 bg-gray-700/50 text-gray-200 px-3 py-1.5 rounded-full text-xs font-medium"
                                            >
                                                <div 
                                                    className="w-4 h-4 rounded-sm border-2 border-gray-600 shadow-sm"
                                                    style={{ backgroundColor: hexColor }}
                                                />
                                                {colorName}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Occasions */}
                        {userProfile.preferredOccasions && userProfile.preferredOccasions.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1.5">Occasions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.preferredOccasions.map(occasion => (
                                        <span key={occasion} className="bg-yellow-900/30 text-yellow-200 px-3 py-1 rounded-full text-xs font-medium">
                                            {occasion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex justify-center">
                <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-full">
                    {['All', 'Professional', 'Party', 'Casual'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                                filter === f ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Outfit Cards Grid */}
            {filteredOutfits.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p>No outfits found for this occasion. Try "All" to see everything.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOutfits.map((outfit, index) => (
                        <div 
                            key={index}
                            className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-bold text-yellow-400 flex-1">
                                    {outfit.outfitName}
                                </h3>
                                <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">
                                    {outfit.styleCategory}
                                </span>
                            </div>

                            {/* Occasion Badge */}
                            <div className="mb-3">
                                <span className="inline-block text-xs bg-yellow-900/30 text-yellow-200 px-3 py-1 rounded-full">
                                    {outfit.occasion}
                                </span>
                            </div>

                            {/* Color Combination with Swatches */}
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Color Palette:</p>
                                <div className="flex flex-wrap gap-2">
                                    {outfit.colorCombination.map((color, idx) => {
                                        const hexColor = getColorHex(color);
                                        return (
                                            <div 
                                                key={idx}
                                                className="flex items-center gap-1.5 bg-gray-700/50 px-2 py-1 rounded-full"
                                            >
                                                <div 
                                                    className="w-3 h-3 rounded-sm border border-gray-600"
                                                    style={{ backgroundColor: hexColor }}
                                                />
                                                <span className="text-xs text-gray-300">{color}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Outfit Details */}
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Top:</p>
                                    <p className="text-gray-200">{outfit.topWear}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Bottom:</p>
                                    <p className="text-gray-200">{outfit.bottomWear}</p>
                                </div>
                                {outfit.layering && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Layer:</p>
                                        <p className="text-gray-200">{outfit.layering}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-500 text-xs">Footwear:</p>
                                    <p className="text-gray-200">{outfit.footwear}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Accessories:</p>
                                    <p className="text-gray-200">{outfit.accessories}</p>
                                </div>
                            </div>

                            {/* Why It Works */}
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-xs text-gray-400 italic">
                                    💡 {outfit.whyItWorks}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColorMatrix;
