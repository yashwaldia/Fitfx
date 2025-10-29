import React, { useState, useEffect } from 'react';
import type { OutfitData } from '../types';

interface SuggestionsData {
  professional: { american: OutfitData[]; indian: OutfitData[] };
  party: { american: OutfitData[]; indian: OutfitData[] };
  casual: { american: OutfitData[]; indian: OutfitData[] };
}

interface TableRowData extends OutfitData {
  style: 'American' | 'Indian';
}

type StyleFilter = 'Select All' | 'American' | 'Indian';

interface OccasionTableProps {
  title: string;
  data: TableRowData[];
  filter: StyleFilter;
  setFilter: (filter: StyleFilter) => void;
}


const OccasionTable: React.FC<OccasionTableProps> = ({ title, data, filter, setFilter }) => {
  const headers = ["Style", "Colour Combination", "T-Shirt/Shirt", "Trousers/Bottom", "Jacket/Layer", "Shoes & Accessories"];
  const filters: StyleFilter[] = ['Select All', 'American', 'Indian'];

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-2xl font-bold text-yellow-400">{title}</h3>
        <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-full">
            {filters.map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        filter === f ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-yellow-400 uppercase bg-gray-900/50">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-4 py-3 whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{row.style}</td>
                <td className="px-4 py-3">{row["Colour Combination"]}</td>
                <td className="px-4 py-3">{row["T-Shirt/Shirt"]}</td>
                <td className="px-4 py-3">{row["Trousers/Bottom"]}</td>
                <td className="px-4 py-3">{row["Jacket/Layer"] || '-'}</td>
                <td className="px-4 py-3">{row["Shoes & Accessories"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const ColorMatrix: React.FC = () => {
    const [suggestionsData, setSuggestionsData] = useState<SuggestionsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [professionalFilter, setProfessionalFilter] = useState<StyleFilter>('Select All');
    const [partyFilter, setPartyFilter] = useState<StyleFilter>('Select All');
    const [casualFilter, setCasualFilter] = useState<StyleFilter>('Select All');

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

    if (isLoading) return <div className="text-center p-8 text-yellow-400">Loading Style Matrix...</div>;
    if (error) return <div className="text-center p-8 text-red-400 bg-red-900/50 rounded-lg">{error}</div>;
    if (!suggestionsData) return null;

    const professionalData: TableRowData[] = [
      ...suggestionsData.professional.american.map(d => ({ ...d, style: 'American' as const })),
      ...suggestionsData.professional.indian.map(d => ({ ...d, style: 'Indian' as const })),
    ].filter(d => professionalFilter === 'Select All' || d.style === professionalFilter);

    const partyData: TableRowData[] = [
      ...suggestionsData.party.american.map(d => ({ ...d, style: 'American' as const })),
      ...suggestionsData.party.indian.map(d => ({ ...d, style: 'Indian' as const })),
    ].filter(d => partyFilter === 'Select All' || d.style === partyFilter);

    const casualData: TableRowData[] = [
      ...suggestionsData.casual.american.map(d => ({ ...d, style: 'American' as const })),
      ...suggestionsData.casual.indian.map(d => ({ ...d, style: 'Indian' as const })),
    ].filter(d => casualFilter === 'Select All' || d.style === casualFilter);


    return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 text-center">Outfit Color Matrix</h2>
            <p className="text-center text-gray-400 -mt-6">Explore curated outfit combinations for any occasion.</p>
            <OccasionTable title="Professional Looks" data={professionalData} filter={professionalFilter} setFilter={setProfessionalFilter} />
            <OccasionTable title="Party Wear" data={partyData} filter={partyFilter} setFilter={setPartyFilter} />
            <OccasionTable title="Casual Wear" data={casualData} filter={casualFilter} setFilter={setCasualFilter} />
        </div>
    );
};

export default ColorMatrix;