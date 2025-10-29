import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PaletteIcon, ShirtIcon, EditIcon } from './Icons';
import type { OutfitData, Occasion, Style } from '../types';

type OccasionCamelCase = 'professional' | 'party' | 'casual';
type StyleCamelCase = 'american' | 'indian';

interface SuggestionsData {
  professional: { american: OutfitData[]; indian: OutfitData[] };
  party: { american: OutfitData[]; indian: OutfitData[] };
  casual: { american: OutfitData[]; indian: OutfitData[] };
}

interface CalendarSuggestion extends OutfitData {
    occasion: Occasion;
    style: Style;
    dateString: string;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOCAL_STORAGE_KEY = 'fitfx-calendar-custom';


// Helper to get a color from a string for the badge
const colorNameToHex = (colorName: string = '') => {
    const lowerColor = colorName.toLowerCase().trim();
    const colorMap: { [key: string]: string } = {
        'navy': '#000080', 'white': '#FFFFFF', 'tan': '#D2B48C', 'grey': '#808080',
        'black': '#000000', 'blue': '#4169E1', 'green': '#50C878', 'pink': '#FF69B4',
        'red': '#FF0000', 'ivory': '#FFFFF0', 'sage': '#B2AC88', 'burgundy': '#800020',
        'gold': '#FFD700', 'silver': '#C0C0C0', 'purple': '#800080', 'orange': '#FFA500',
        'yellow': '#FFDB58', 'brown': '#A52A2A', 'denim': '#1560BD', 'olive': '#808000',
        'maroon': '#800000', 'lavender': '#E6E6FA', 'cream': '#FFFDD0', 'cognac': '#9A463D',
        'champagne': '#F7E7CE', 'camel': '#C19A6B', 'khaki': '#C3B091', 'coral': '#FF7F50'
    };
    for (const key in colorMap) {
        if (lowerColor.includes(key)) return colorMap[key];
    }
    return '#4B5563'; // gray-600 fallback
};


const CalendarPlan: React.FC = () => {
    const [suggestionsData, setSuggestionsData] = useState<SuggestionsData | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<Record<string, CalendarSuggestion>>({});
    const [selectedSuggestion, setSelectedSuggestion] = useState<CalendarSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editableSuggestion, setEditableSuggestion] = useState<CalendarSuggestion | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('suggestionsData.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: SuggestionsData = await response.json();
                setSuggestionsData(data);
            } catch (e: any) {
                setError(`Failed to load style guide: ${e.message}.`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const generateMonthlySuggestions = useCallback((year: number, month: number, data: SuggestionsData): Record<string, CalendarSuggestion> => {
        const suggestions: Record<string, CalendarSuggestion> = {};
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let usedIndices: { [key: string]: number[] } = {
            'professional-american': [], 'professional-indian': [],
            'party-american': [], 'party-indian': [],
            'casual-american': [], 'casual-indian': [],
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            let occasionCamel: OccasionCamelCase = 'casual';
            if (dayOfWeek >= 1 && dayOfWeek <= 5) occasionCamel = 'professional';
            if (dayOfWeek === 6) occasionCamel = 'party';
            
            const styleCamel: StyleCamelCase = Math.random() > 0.5 ? 'american' : 'indian';
            const key = `${occasionCamel}-${styleCamel}`;
            
            const possibleOutfits = data[occasionCamel][styleCamel];
            if (usedIndices[key].length >= possibleOutfits.length) {
                usedIndices[key] = []; // Reset if we've used all options
            }
            
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * possibleOutfits.length);
            } while (usedIndices[key].includes(randomIndex));
            
            usedIndices[key].push(randomIndex);
            
            const occasionTitleCase = (occasionCamel.charAt(0).toUpperCase() + occasionCamel.slice(1)) as Occasion;
            const styleTitleCase = (styleCamel.charAt(0).toUpperCase() + styleCamel.slice(1)) as Style;

            suggestions[dateString] = {
                ...possibleOutfits[randomIndex],
                occasion: occasionTitleCase,
                style: styleTitleCase,
                dateString,
            };
        }
        return suggestions;
    }, []);

    useEffect(() => {
        if (suggestionsData) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const baseSuggestions = generateMonthlySuggestions(year, month, suggestionsData);

            const customSuggestionsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const customSuggestions = customSuggestionsRaw ? JSON.parse(customSuggestionsRaw) : {};
            
            const mergedSuggestions = { ...baseSuggestions, ...customSuggestions };
            setCalendarData(mergedSuggestions);
        }
    }, [currentDate, suggestionsData, generateMonthlySuggestions]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const handleEdit = () => {
        setEditableSuggestion(selectedSuggestion);
        setIsEditing(true);
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        setEditableSuggestion(null);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!editableSuggestion) return;
        const { name, value } = e.target;
        setEditableSuggestion({
            ...editableSuggestion,
            [name]: value,
        });
    };

    const handleSave = () => {
        if (!editableSuggestion) return;
        
        const { dateString } = editableSuggestion;
        const customSuggestionsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const customSuggestions = customSuggestionsRaw ? JSON.parse(customSuggestionsRaw) : {};
        
        customSuggestions[dateString] = editableSuggestion;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customSuggestions));
        
        setCalendarData(prev => ({ ...prev, [dateString]: editableSuggestion }));
        setSelectedSuggestion(editableSuggestion);
        setIsEditing(false);
        setEditableSuggestion(null);
    };

    const handleCloseModal = () => {
        setSelectedSuggestion(null);
        setIsEditing(false);
        setEditableSuggestion(null);
    };

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        
        return [...blanks, ...days].map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="rounded-lg bg-gray-800/20"></div>;
            
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const suggestion = calendarData[dateString];
            const firstColor = suggestion ? suggestion['Colour Combination'].split(/\s*[+,&]\s*/)[0] : '';

            return (
                <div 
                    key={day}
                    onClick={() => setSelectedSuggestion(suggestion)}
                    className="p-2 rounded-lg bg-gray-800/50 cursor-pointer transition-all duration-300 hover:bg-gray-700/80 hover:shadow-lg hover:-translate-y-1 border border-gray-700/50"
                >
                    <div className="text-right text-sm font-bold text-gray-300">{day}</div>
                    {suggestion && (
                        <div className="mt-1 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 p-1 bg-gray-900/50 rounded">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorNameToHex(firstColor) }}></div>
                                <p className="truncate text-gray-400">{suggestion['Colour Combination']}</p>
                            </div>
                            <div className="p-1 bg-yellow-500/10 text-yellow-300 text-center rounded capitalize">{suggestion.occasion}</div>
                        </div>
                    )}
                </div>
            );
        });
    };

    if (isLoading) return <div className="text-center p-8 text-yellow-400">Loading Calendar Plan...</div>;
    if (error) return <div className="text-center p-8 text-red-400 bg-red-900/50 rounded-lg">{error}</div>;

    const renderModalContent = () => {
        const suggestion = isEditing ? editableSuggestion : selectedSuggestion;
        if (!suggestion) return null;

        if (isEditing) {
            return (
                 <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Occasion</label>
                            <select name="occasion" value={suggestion.occasion} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none">
                                <option>Professional</option>
                                <option>Party</option>
                                <option>Casual</option>
                                <option>Other</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Style</label>
                            <select name="style" value={suggestion.style} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none">
                                <option>American</option>
                                <option>Indian</option>
                                <option>Fusion</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Colour Combination</label>
                        <input type="text" name="Colour Combination" value={suggestion['Colour Combination']} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Top</label>
                        <input type="text" name="T-Shirt/Shirt" value={suggestion['T-Shirt/Shirt']} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none" />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Bottom</label>
                        <input type="text" name="Trousers/Bottom" value={suggestion['Trousers/Bottom']} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Layer</label>
                        <input type="text" name="Jacket/Layer" value={suggestion['Jacket/Layer']} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Shoes & Accessories</label>
                        <textarea name="Shoes & Accessories" value={suggestion['Shoes & Accessories']} onChange={handleInputChange} className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none" rows={2}></textarea>
                    </div>
                </div>
            )
        }

        return (
             <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                    <PaletteIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1"/>
                    <div>
                        <span className="font-semibold text-gray-300">Color Palette:</span>
                        <div className="mt-2 space-y-1.5">
                            {suggestion['Colour Combination'].split(/\s*[+,&]\s*/).map((color, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded-full border border-gray-600"
                                        style={{ backgroundColor: colorNameToHex(color.trim()) }}
                                    ></div>
                                    <span className="text-gray-400">{color.trim()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                    <ShirtIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1"/>
                    <div>
                        <p><span className="font-semibold text-gray-300">Top: </span>{suggestion['T-Shirt/Shirt']}</p>
                        <p><span className="font-semibold text-gray-300">Bottom: </span>{suggestion['Trousers/Bottom']}</p>
                        <p><span className="font-semibold text-gray-300">Layer: </span>{suggestion['Jacket/Layer']}</p>
                        <p><span className="font-semibold text-gray-300">Shoes & Accessories: </span>{suggestion['Shoes & Accessories']}</p>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 text-center">Your Ideal Day Calendar</h2>
            <p className="text-center text-gray-400 -mt-6">Daily outfit inspiration tailored for you. Click a day to edit!</p>

            <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <h3 className="text-xl font-semibold text-yellow-400">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ChevronRightIcon className="w-6 h-6"/></button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-2">
                    {WEEK_DAYS.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                    {renderCalendarGrid()}
                </div>
            </div>

            {selectedSuggestion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={handleCloseModal}>
                    <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 m-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-yellow-400">{isEditing ? 'Edit Your Plan' : `${selectedSuggestion.occasion} Inspiration`}</h3>
                            <p className="text-sm text-gray-400 capitalize mb-4">{isEditing ? `For ${new Date(selectedSuggestion.dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : `${selectedSuggestion.style} Style`}</p>
                            {renderModalContent()}
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-b-2xl flex justify-end gap-4">
                            {isEditing ? (
                                <>
                                    <button onClick={handleCancel} className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-full hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-full hover:bg-yellow-400 transition-colors">Save Changes</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-full hover:bg-gray-600 transition-colors">Close</button>
                                    <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-yellow-300 font-semibold rounded-full hover:bg-gray-500 transition-colors">
                                        <EditIcon className="w-4 h-4"/>
                                        Edit
                                    </button>
                                    <button onClick={() => alert('Outfit saved for this day!')} className="px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-full hover:bg-yellow-400 transition-colors">Plan to Wear</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPlan;
