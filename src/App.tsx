import React, { useState, useCallback, useEffect } from 'react';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserProfile, loadUserProfile, loadWardrobe, addWardrobeItem, updateWardrobeItem, deleteWardrobeItem } from './services/firestoreService';
import { getStyleAdvice } from './services/geminiService';
import type { StyleAdvice, Occasion, Style, Gender, Garment, UserProfile, OutfitData } from './types';
import SelfieUploader from './components/SelfieUploader';
import StyleSelector from './components/StyleSelector';
import UserDetailsSelector from './components/UserDetailsSelector';
import AIResultDisplay from './components/AIResultDisplay';
import Loader from './components/Loader';
import { LogoIcon, SparklesIcon, WardrobeIcon, EditIcon, CalendarIcon, LogoutIcon, UserCircleIcon, ColorSwatchIcon } from './components/Icons';
import WardrobeUploader from './components/WardrobeUploader';
import ImageEditor from './components/ImageEditor';
import Chatbot from './components/Chatbot';
import ColorSelector from './components/ColorSelector';
import CalendarPlan from './components/Suggestions';
import Login from './components/Login';
import Signup from './components/Signup';
import ProfileCreation from './components/ProfileCreation';
import TodaySuggestion from './components/TodaySuggestion';
import ColorMatrix from './components/ColorMatrix';
import { requestNotificationPermission } from './components/Notifications';
import logoImage from './images/logo.png';

type View = 'stylist' | 'wardrobe' | 'editor' | 'colorMatrix' | 'calendar';
type AuthStep = 'loading' | 'login' | 'profile' | 'loggedIn';

const App: React.FC = () => {
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('loading');
  const [showSignup, setShowSignup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // App state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<Occasion>('Professional');
  const [style, setStyle] = useState<Style>('American');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [styleAdvice, setStyleAdvice] = useState<StyleAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('stylist');
  const [todaySuggestion, setTodaySuggestion] = useState<OutfitData | null>(null);

  // Check authentication state and load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User logged in:');
        setUserId(user.uid);
        
        try {
          // Load user profile from Firestore
          const profile = await loadUserProfile(user.uid);
          
          if (profile) {
            // User has profile, load everything
            setUserProfile(profile);
            
            // Load wardrobe from Firestore
            const wardrobeData = await loadWardrobe(user.uid);
            setWardrobe(wardrobeData);
            
            // Pre-fill form data
            if (profile.age) setAge(profile.age);
            if (profile.gender) setGender(profile.gender);
            if (profile.preferredOccasions && profile.preferredOccasions.length > 0) {
              setOccasion(profile.preferredOccasions[0]);
            }
            if (profile.preferredStyles && profile.preferredStyles.length > 0) {
              setStyle(profile.preferredStyles[0]);
            }
            if (profile.favoriteColors) {
              setSelectedColors(profile.favoriteColors);
            }
            
            setAuthStep('loggedIn');
            generateTodaySuggestion();
          } else {
            // User logged in but no profile, show profile creation
            setAuthStep('profile');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setAuthStep('profile');
        }
      } else {
        // User not logged in
        setAuthStep('login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate today's suggestion
  const generateTodaySuggestion = () => {
    try {
      const suggestions: OutfitData[] = [
        {
          "Colour Combination": "Navy & White",
          "T-Shirt/Shirt": "White Cotton Shirt",
          "Trousers/Bottom": "Navy Blue Chinos",
          "Jacket/Layer": "Light Grey Blazer",
          "Shoes & Accessories": "Brown Leather Shoes"
        },
        {
          "Colour Combination": "Black & Beige",
          "T-Shirt/Shirt": "Beige T-Shirt",
          "Trousers/Bottom": "Black Jeans",
          "Jacket/Layer": "Black Denim Jacket",
          "Shoes & Accessories": "White Sneakers"
        }
      ];
      const dayOfWeek = new Date().getDay();
      const suggestion = suggestions[dayOfWeek % suggestions.length];
      setTodaySuggestion(suggestion);
    } catch (error) {
      console.error('Failed to generate today\'s suggestion:', error);
    }
  };

  // Handle profile creation and save to Firestore
  const handleProfileSave = async (profile: UserProfile) => {
    if (!userId) {
      console.error('No user logged in');
      return;
    }

    try {
      setAuthStep('loading');
      
      // Save to Firestore
      await saveUserProfile(userId, profile);
      
      // Update local state
      setUserProfile(profile);
      
      // Pre-fill form data
      if (profile.age) setAge(profile.age);
      if (profile.gender) setGender(profile.gender);
      if (profile.preferredOccasions && profile.preferredOccasions.length > 0) {
        setOccasion(profile.preferredOccasions[0]);
      }
      if (profile.preferredStyles && profile.preferredStyles.length > 0) {
        setStyle(profile.preferredStyles[0]);
      }
      if (profile.favoriteColors) {
        setSelectedColors(profile.favoriteColors);
      }
      
      setAuthStep('loggedIn');
      generateTodaySuggestion();
      setupNotifications();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
      setAuthStep('profile');
    }
  };

  // Setup notifications
  const setupNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        console.log('Notifications enabled');
      }
    } catch (error) {
      console.error('Failed to set up notifications:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserProfile(null);
      setAuthStep('login');
      setUserId(null);
      setUploadedImage(null);
      setStyleAdvice(null);
      setWardrobe([]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle color selection
  const handleColorSelect = (hex: string) => {
    setSelectedColors(prev => 
      prev.includes(hex) 
        ? prev.filter(c => c !== hex)
        : [...prev, hex]
    );
  };

  // Handle adding garment to wardrobe with Firestore save
  const handleAddToWardrobe = async (garment: Garment) => {
    if (!userId) {
      console.error('No user logged in');
      return;
    }

    try {
      // Save to Firestore
      await addWardrobeItem(userId, garment);
      
      // Update local state
      setWardrobe(prev => [...prev, garment]);
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      setError('Failed to add item to wardrobe. Please try again.');
    }
  };

  // Handle updating wardrobe item with Firestore update
  const handleUpdateWardrobe = async (index: number, updatedGarment: Garment) => {
    if (!userId) {
      console.error('No user logged in');
      return;
    }

    try {
      // Update in Firestore
      await updateWardrobeItem(userId, index, updatedGarment, wardrobe);
      
      // Update local state
      const updatedWardrobe = [...wardrobe];
      updatedWardrobe[index] = updatedGarment;
      setWardrobe(updatedWardrobe);
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      setError('Failed to update item. Please try again.');
    }
  };

  // Handle deleting wardrobe item with Firestore delete
  const handleDeleteFromWardrobe = async (index: number) => {
    if (!userId) {
      console.error('No user logged in');
      return;
    }

    try {
      // Delete from Firestore
      await deleteWardrobeItem(userId, index, wardrobe);
      
      // Update local state
      const updatedWardrobe = wardrobe.filter((_, i) => i !== index);
      setWardrobe(updatedWardrobe);
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  // Handle style advice submission
  const handleSubmit = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload a selfie first');
      return;
    }

    if (!age || !gender) {
      setError('Please fill in all details');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const advice = await getStyleAdvice(
        uploadedImage,
        occasion,
        style,
        age,
        gender,
        selectedColors,
        wardrobe,
        userProfile
      );
      setStyleAdvice(advice);
    } catch (err) {
      console.error('Error getting style advice:', err);
      setError('Failed to get style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, occasion, style, age, gender, selectedColors, wardrobe, userProfile]);

  // Render loading state
  if (authStep === 'loading') {
    return <Loader />;
  }

  // Render login/signup
  if (authStep === 'login') {
    return showSignup ? (
      <Signup
        onSignupSuccess={() => setAuthStep('profile')}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <Login
        onLoginSuccess={() => setAuthStep('profile')}
        onSwitchToSignup={() => setShowSignup(true)}
      />
    );
  }

  // Render profile creation
  if (authStep === 'profile') {
    return <ProfileCreation onProfileSave={handleProfileSave} />;
  }

  // Main app UI
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="FitFx Logo" 
              className="h-8 w-auto"
            />
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setView('stylist')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'stylist' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Selfie Stylist</span>
              </button>

              <button
                onClick={() => setView('wardrobe')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'wardrobe' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <WardrobeIcon className="w-5 h-5" />
                <span>Wardrobe</span>
              </button>

              <button
                onClick={() => setView('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'editor' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <EditIcon className="w-5 h-5" />
                <span>Image Editor</span>
              </button>

              <button
                onClick={() => setView('colorMatrix')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'colorMatrix' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <ColorSwatchIcon className="w-5 h-5" />
                <span>Color Matrix</span>
              </button>

              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'calendar' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar</span>
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {userProfile && (
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="w-8 h-8 text-yellow-400" />
                  <span className="hidden md:block text-sm">
                    Welcome, {userProfile.name}!
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
              >
                <LogoutIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'stylist' && (
          <div className="space-y-8">
            <TodaySuggestion 
              suggestion={todaySuggestion} 
              onViewCalendar={() => setView('calendar')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <SelfieUploader 
                  onImageUpload={setUploadedImage}
                  uploadedImage={uploadedImage}
                />
                <StyleSelector
                  occasion={occasion}
                  setOccasion={setOccasion}
                  style={style}
                  setStyle={setStyle}
                />
                <UserDetailsSelector
                  age={age}
                  gender={gender}
                  setAge={setAge}
                  setGender={setGender}
                />
                <ColorSelector
                  selectedColors={selectedColors}
                  onColorSelect={handleColorSelect}
                />

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !uploadedImage}
                  className="w-full group relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader />
                      <span className="ml-2">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Get Style Advice
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
              </div>

              <div className="lg:sticky lg:top-24 h-fit">
                {styleAdvice ? (
                  <AIResultDisplay 
                    advice={styleAdvice}
                    image={uploadedImage}
                    onReset={() => {
                      setStyleAdvice(null);
                      setUploadedImage(null);
                    }}
                  />
                ) : (
                  <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 text-center">
                    <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-50" />
                    <p className="text-gray-400">
                      Upload a selfie and get personalized style advice!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'wardrobe' && (
          <WardrobeUploader 
            wardrobe={wardrobe} 
            onAddToWardrobe={handleAddToWardrobe}
            onUpdateWardrobe={handleUpdateWardrobe}
            onDeleteFromWardrobe={handleDeleteFromWardrobe}
          />
        )}

        {view === 'editor' && <ImageEditor />}

        {view === 'colorMatrix' && <ColorMatrix userProfile={userProfile} wardrobe={wardrobe} />}

        {view === 'calendar' && <CalendarPlan />}
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default App;
