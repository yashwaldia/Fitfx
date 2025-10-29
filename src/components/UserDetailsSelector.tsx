import React from 'react';
import type { Gender } from '../types';

interface UserDetailsSelectorProps {
  age: string;
  setAge: (age: string) => void;
  gender: Gender | null;
  setGender: (gender: Gender) => void;
}

const genders: Gender[] = ['Female', 'Male', 'Unisex', 'Kids'];

const NeumorphicButton: React.FC<{
  label: string;
  value: Gender;
  selectedValue: Gender | null;
  onClick: (value: Gender) => void;
}> = ({ label, value, selectedValue, onClick }) => {
  const isActive = value === selectedValue;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 w-full rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
        isActive
          ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2c2c2c]'
          : 'bg-gray-800 text-gray-400 shadow-[3px_3px_6px_#1a1a1a,_-3px_-3px_6px_#2c2c2c] hover:text-yellow-400'
      }`}
    >
      {label}
    </button>
  );
};

const UserDetailsSelector: React.FC<UserDetailsSelectorProps> = ({ age, setAge, gender, setGender }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4 text-center">Tell Us About Yourself</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-400 mb-2 text-center">Your Age</label>
                <input
                    type="text"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 28 or 18-25"
                    className="w-full bg-gray-900 text-center text-gray-200 rounded-full p-2 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"
                />
            </div>
            <div className="flex flex-col items-center">
                 <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Your Gender</label>
                <div className="flex w-full justify-center items-center gap-2 md:gap-4 p-1 bg-gray-900 rounded-full">
                    {genders.map((g) => (
                        <NeumorphicButton key={g} label={g} value={g} selectedValue={gender} onClick={setGender} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserDetailsSelector;