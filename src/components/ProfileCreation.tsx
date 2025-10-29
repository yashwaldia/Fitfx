import React, { useState, useRef } from 'react';
import type { UserProfile, Occasion, Style, Gender, AgeGroup, BodyType } from '../types';
import { LogoIcon, SparklesIcon, WardrobeIcon, CameraIcon, UserCircleIcon } from './Icons';
import ColorSelector from './ColorSelector';

interface ProfileCreationProps {
  onProfileSave: (profile: UserProfile) => void;
}

const styles: Style[] = ['American', 'Indian', 'Fusion', 'Other'];
const genders: Gender[] = ['Male', 'Female', 'Unisex', 'Kids'];
const occasions: Occasion[] = ['Professional', 'Party', 'Casual', 'Other'];
const ageGroups: AgeGroup[] = ['Teen (13-17)', 'Young Adult (18-25)', 'Adult (26-35)', 'Middle-Aged (36-45)', 'Senior (46+)'];
const TOTAL_STEPS = 7;
const bodyTypesWithDesc: { type: BodyType; description: string }[] = [
    { type: 'Rectangle', description: 'Balanced shoulders, waist & hips' },
    { type: 'Triangle', description: 'Wider hips, narrower shoulders' },
    { type: 'Inverted Triangle', description: 'Broader shoulders, narrower hips' },
    { type: 'Hourglass', description: 'Defined waist, balanced bust & hips' },
    { type: 'Round (Apple)', description: 'Fuller midsection, slimmer legs' },
    { type: 'Pear', description: 'Wider lower body, smaller upper body' },
    { type: 'Athletic', description: 'Muscular build, defined shoulders' },
    { type: 'Slim / Lean', description: 'Narrow frame with minimal curves' },
    { type: 'Petite', description: 'Smaller bone structure, shorter height' },
    { type: 'Tall', description: 'Elongated frame, long limbs' },
    { type: 'Curvy', description: 'Pronounced curves, especially bust & hips' },
    { type: 'Oval', description: 'Softer, rounder torso' },
    { type: 'Straight / Column', description: 'Little waist definition' },
    { type: 'Diamond', description: 'Wider hips, narrower bust & shoulders' },
    { type: 'Muscular / V Shape', description: 'Broad chest tapering to a slim waist' },
    { type: 'Lollipop', description: 'Full bust with slim hips & waist' },
    { type: 'Skittle', description: 'Curvy hips & thighs, slim shoulders' },
    { type: 'Top Hourglass', description: 'Larger bust with a defined waist' },
    { type: 'Bottom Hourglass', description: 'Larger hips with a defined waist' },
    { type: 'Plus Size', description: 'Fuller figure with balanced proportions' }
];

const fabrics: string[] = ['Cotton', 'Linen', 'Silk', 'Wool', 'Denim', 'Leather', 'Velvet', 'Satin', 'Polyester', 'Rayon'];


const Stepper: React.FC<{ step: number }> = ({ step }) => (
    <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-yellow-400">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
            <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            ></div>
        </div>
    </div>
);

const SelectionButton = <T extends string,>({ item, selectedItems, onSelect, isMultiSelect = false }: {
    item: T;
    selectedItems: T | T[];
    onSelect: (item: T) => void;
    isMultiSelect?: boolean;
}) => {
  const isActive = isMultiSelect ? (selectedItems as T[]).includes(item) : selectedItems === item;
  return (
    <button
      onClick={() => onSelect(item)}
      className={`px-4 py-2 w-full rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
        isActive
          ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2c2c2c]'
          : 'bg-gray-800 text-gray-400 shadow-[3px_3px_6px_#1a1a1a,_-3px_-3px_6px_#2c2c2c] hover:text-yellow-400'
      }`}
    >
      {item}
    </button>
  );
};

const DescriptionSelectionButton: React.FC<{
    item: { type: BodyType; description: string };
    selectedItem: BodyType | undefined;
    onSelect: (item: BodyType) => void;
}> = ({ item, selectedItem, onSelect }) => {
    const isActive = selectedItem === item.type;
    return (
        <button
            onClick={() => onSelect(item.type)}
            className={`flex flex-col items-center justify-center text-center p-3 w-full min-h-[100px] rounded-2xl text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
                isActive
                    ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2c2c2c]'
                    : 'bg-gray-800 text-gray-400 shadow-[3px_3px_6px_#1a1a1a,_-3px_-3px_6px_#2c2c2c] hover:text-yellow-400'
            }`}
        >
            <span className="font-bold">{item.type}</span>
            <span className="text-xs text-gray-500 mt-1">{item.description}</span>
        </button>
    );
};


const ProfileCreation: React.FC<ProfileCreationProps> = ({ onProfileSave }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  const [preferredOccasions, setPreferredOccasions] = useState<Occasion[]>([]);
  const [preferredStyles, setPreferredStyles] = useState<Style[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | undefined>();
  const [preferredFabrics, setPreferredFabrics] = useState<string[]>([]);
  const [fashionIcons, setFashionIcons] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for profile photo
        setError('Photo is too large. Please upload an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handleMultiSelect = <T extends string>(item: T, state: T[], setState: React.Dispatch<React.SetStateAction<T[]>>) => {
      setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };
  
  const handleColorSelect = (hex: string) => {
    setFavoriteColors(prev => {
        const isSelected = prev.includes(hex);
        if (isSelected) return prev.filter(c => c !== hex);
        if (prev.length < 20) return [...prev, hex];
        return prev;
    });
  };

  const handleSelectAllOccasions = () => {
    if (preferredOccasions.length === occasions.length) {
      setPreferredOccasions([]);
    } else {
      setPreferredOccasions([...occasions]);
    }
  };

  const handleSelectAllFabrics = () => {
    if (preferredFabrics.length === fabrics.length) {
      setPreferredFabrics([]);
    } else {
      setPreferredFabrics([...fabrics]);
    }
  };


  const nextStep = () => {
    setError(null);
    if (step === 1 && !name.trim()) { setError("Please enter your name."); return; }
    if (step === 2 && preferredStyles.length === 0) { setError("Please select at least one style."); return; }
    if (step === 3 && !bodyType) { setError("Please select your body type."); return; }
    if (step === 4 && !age.trim()) { setError("Please select an age group or enter an age."); return; }

    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };
  
  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleSave = () => {
    const profile: UserProfile = {
        name, age, gender, preferredOccasions, preferredStyles, favoriteColors,
        profilePhoto: profilePhoto ?? undefined,
        bodyType,
        preferredFabrics,
        fashionIcons
    };
    onProfileSave(profile);
  };
  
  const renderStepContent = () => {
      switch(step) {
          case 1:
              return (
                  <div className="text-center">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4">Welcome to FitFx!</h3>
                      <p className="text-gray-400 mb-6">Let's get started by creating your style profile.</p>
                      <div className="max-w-xs mx-auto space-y-6">
                          <div className="relative w-32 h-32 mx-auto rounded-full cursor-pointer group" onClick={handlePhotoClick}>
                              {profilePhoto ? (
                                <img src={profilePhoto} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <UserCircleIcon className="w-32 h-32 text-gray-700" />
                              )}
                              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CameraIcon className="w-8 h-8 text-white" />
                              </div>
                              <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/png, image/jpeg" className="hidden" />
                          </div>

                           <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">First, what should we call you?</label>
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Alex Doe" className="w-full bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"/>
                           </div>
                      </div>
                  </div>
              );
          case 2:
              return (
                  <div>
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">What's Your Style?</h3>
                      <p className="text-center text-gray-400 mb-6">Select one or more. This helps us find your vibe.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
                          {styles.map(s => <SelectionButton key={s} item={s} selectedItems={preferredStyles} onSelect={(item) => handleMultiSelect(item, preferredStyles, setPreferredStyles)} isMultiSelect />)}
                      </div>
                  </div>
              );
          case 3:
               return (
                  <div className="w-full">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Your Fit</h3>
                      <p className="text-center text-gray-400 mb-6">This helps in personalizing silhouettes and cuts.</p>
                      <div className="max-w-3xl mx-auto space-y-6">
                           <div>
                               <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Your Gender</label>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
                                  {genders.map(g => <SelectionButton key={g} item={g} selectedItems={gender} onSelect={(item) => setGender(item)} />)}
                               </div>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Your Body Type</label>
                               <div className="max-h-60 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 bg-gray-900/30 rounded-lg">
                                  {bodyTypesWithDesc.map(bt => <DescriptionSelectionButton key={bt.type} item={bt} selectedItem={bodyType} onSelect={setBodyType} />)}
                               </div>
                           </div>
                      </div>
                  </div>
              )
          case 4:
              return (
                  <div>
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">What's Your Age?</h3>
                      {gender === 'Kids' ? (
                          <div className="max-w-xs mx-auto">
                              <label htmlFor="age-kids" className="block text-sm font-medium text-gray-400 mb-2 text-center">Child's Age</label>
                              <input type="number" id="age-kids" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 8" className="w-full bg-gray-900 text-center text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"/>
                          </div>
                      ) : (
                          <div className="max-w-2xl mx-auto">
                             <p className="text-center text-gray-400 mb-6">This helps us recommend age-appropriate styles.</p>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {ageGroups.map(ag => <SelectionButton key={ag} item={ag} selectedItems={age} onSelect={setAge} />)}
                             </div>
                          </div>
                      )}
                  </div>
              );
          case 5:
              return (
                  <div>
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Your Tastes</h3>
                       <div className="space-y-8">
                           <div>
                                <div className="flex justify-between items-center max-w-lg mx-auto mb-2 px-1">
                                    <h4 className="text-md font-medium text-gray-300">What occasions do you usually dress for?</h4>
                                    <button onClick={handleSelectAllOccasions} className="text-sm font-semibold text-yellow-400 hover:underline">
                                        {preferredOccasions.length === occasions.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                               <div className="flex flex-wrap justify-center items-center gap-2 max-w-lg mx-auto p-2 bg-gray-900 rounded-lg">
                                    {occasions.map(o => <SelectionButton key={o} item={o} selectedItems={preferredOccasions} onSelect={(item) => handleMultiSelect(item, preferredOccasions, setPreferredOccasions)} isMultiSelect />)}
                               </div>
                           </div>
                           <ColorSelector selectedColors={favoriteColors} onColorSelect={handleColorSelect} />
                      </div>
                  </div>
              );
          case 6:
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Advanced Tastes (Optional)</h3>
                        <div className="max-w-xl mx-auto space-y-8">
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-md font-medium text-gray-300">Any fabrics you love?</h4>
                                    <button onClick={handleSelectAllFabrics} className="text-sm font-semibold text-yellow-400 hover:underline">
                                        {preferredFabrics.length === fabrics.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 p-2 bg-gray-900 rounded-lg">
                                    {fabrics.map(f => <SelectionButton key={f} item={f} selectedItems={preferredFabrics} onSelect={(item) => handleMultiSelect(item, preferredFabrics, setPreferredFabrics)} isMultiSelect />)}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fashion-icons" className="block text-sm font-medium text-gray-400 mb-2 text-center">Fashion icons or celebrities whose style you admire?</label>
                                <input type="text" id="fashion-icons" value={fashionIcons} onChange={(e) => setFashionIcons(e.target.value)} placeholder="e.g., Zendaya, Harry Styles" className="w-full bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"/>
                            </div>
                        </div>
                    </div>
                );
          case 7:
              return (
                  <div className="text-center">
                       <SparklesIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4"/>
                       <h3 className="text-2xl font-semibold text-yellow-400 mb-2">You're All Set, {name}!</h3>
                       <p className="text-gray-400 max-w-md mx-auto mb-6">Your profile is ready. For even better recommendations, add items from your closet to your digital wardrobe.</p>
                       <WardrobeIcon className="w-24 h-24 text-gray-600 mx-auto"/>
                  </div>
              );
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
         <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <LogoIcon className="h-12 w-12 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
              Create Your Profile
            </h1>
          </div>
          <p className="text-lg text-gray-400">Personalize your FitFx experience</p>
        </header>
        
        <main className="bg-gray-800/50 rounded-2xl p-6 md:p-8 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
            <Stepper step={step} />
            <div className="min-h-[400px] flex items-center justify-center">
                {renderStepContent()}
            </div>
            {error && <p className="text-center text-red-400 pt-4">{error}</p>}
            <div className="flex justify-between items-center mt-8">
                <button onClick={prevStep} disabled={step === 1} className="px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                    Back
                </button>
                {step < TOTAL_STEPS ? (
                     <button onClick={nextStep} className="px-6 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-full">
                        Next
                    </button>
                ) : (
                    <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg">
                        Explore The App
                    </button>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileCreation;