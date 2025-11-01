import React, { useState, useCallback, useEffect } from 'react';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  saveUserProfile, 
  loadUserProfile, 
  loadWardrobe, 
  addWardrobeItem, 
  updateWardrobeItem, 
  deleteWardrobeItem,
  markPlanModalSeen,
  getUserSubscriptionTier
} from './services/firestoreService';
import { getStyleAdvice } from './services/geminiService';
import type { StyleAdvice, Occasion, Style, Gender, Garment, UserProfile, OutfitData, SubscriptionTier } from './types';


// Components
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


// ✅ NEW: Subscription components
import PlanSelectionModal from './components/PlanSelectionModal';
import SubscriptionManager from './components/SubscriptionManager';


import { requestNotificationPermission } from './components/Notifications';
import logoImage from './images/logo.png';


type View = 'stylist' | 'wardrobe' | 'editor' | 'colorMatrix' | 'calendar' | 'settings';
type AuthStep = 'loading' | 'login' | 'profile' | 'loggedIn';
// ✅ TEMPORARY: Environment Variables Test (Remove after verification)
if (typeof window !== 'undefined') {
  console.log('=== LEMON SQUEEZY ENV VARIABLES ===');
  console.log('REACT_APP_LEMON_STORE_ID:', process.env.REACT_APP_LEMON_STORE_ID);
  console.log('REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID:', process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID);
  console.log('REACT_APP_LEMON_STYLE_X_VARIANT_ID:', process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID);
  console.log('=== All env vars loaded? ===');
  const allLoaded = 
    process.env.REACT_APP_LEMON_STORE_ID &&
    process.env.REACT_APP_LEMON_STYLE_PLUS_VARIANT_ID &&
    process.env.REACT_APP_LEMON_STYLE_X_VARIANT_ID;
  console.log(allLoaded ? '✅ YES - Ready to use!' : '❌ NO - Check .env.local');
}


const App: React.FC = () => {
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('loading');
  const [showSignup, setShowSignup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);


  // ✅ NEW: Subscription state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('User logged in:', currentUser.uid);
        setUserId(currentUser.uid);
        setUser(currentUser);
        
        try {
          // Load user profile from Firestore
          const profile = await loadUserProfile(currentUser.uid);
          
          if (profile) {
            // User has profile, load everything
            setUserProfile(profile);
            
            // Load wardrobe from Firestore
            const wardrobeData = await loadWardrobe(currentUser.uid);
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
            
            // ✅ NEW: Load subscription tier
            if (profile.subscription?.tier) {
              setSubscriptionTier(profile.subscription.tier);
            }
            
            // ✅ NEW: Show plan modal if user hasn't seen it
            if (!profile.hasSeenPlanModal && profile.subscription?.tier === 'free') {
              setShowPlanModal(true);
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
      
      // ✅ NEW: Initialize subscription for new user
      profile.subscription = {
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
      };
      profile.hasSeenPlanModal = false;
      
      // Save to Firestore
      await saveUserProfile(userId, profile);
      
      // Update local state
      setUserProfile(profile);
      setSubscriptionTier('free');
      
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
      
      // ✅ NEW: Show plan modal for new user
      setShowPlanModal(true);
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


  // ✅ NEW: Handle plan selection
  const handlePlanSelect = async (tier: SubscriptionTier) => {
    setIsSelectingPlan(true);
    try {
      if (!userId) throw new Error('No user ID');


      if (tier === 'free') {
        // Free tier - just close modal
        await markPlanModalSeen(userId);
        setShowPlanModal(false);
        setSubscriptionTier('free');
      } else {
        // Paid tier - open Lemon Squeezy checkout
        const { openLemonCheckout } = await import('./services/lemonSqueezyService');
        const { getVariantIdFromTier } = await import('./services/lemonSqueezyService');
        
        const variantId = getVariantIdFromTier(tier);
        if (!variantId) throw new Error('Invalid plan configuration');


        await openLemonCheckout({
          variantId,
          email: user?.email || 'user@example.com',
          customData: { user_id: userId },
        });


        // Mark modal as seen
        await markPlanModalSeen(userId);
        setShowPlanModal(false);
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to select plan');
    } finally {
      setIsSelectingPlan(false);
    }
  };


  // ✅ NEW: Handle subscription update
  const handleSubscriptionUpdated = async (newTier: SubscriptionTier) => {
    setSubscriptionTier(newTier);
    if (userProfile?.subscription) {
      userProfile.subscription.tier = newTier;
      setUserProfile({ ...userProfile });
    }
  };


  // ✅ NEW: Handle opening plan modal from anywhere
  const handleOpenPlanModal = () => {
    setShowPlanModal(true);
  };


  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserProfile(null);
      setAuthStep('login');
      setUserId(null);
      setUser(null);
      setUploadedImage(null);
      setStyleAdvice(null);
      setWardrobe([]);
      setShowLogoutConfirm(false);
      setView('stylist');
      setSubscriptionTier('free');
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
      // ✅ NEW: Check subscription limit for wardrobe
      const { getFeatureLimits } = await import('./constants/subscriptionPlans');
      const limits = getFeatureLimits(subscriptionTier);
      
      if (limits.wardrobeLimit > 0 && wardrobe.length >= limits.wardrobeLimit) {
        setError(`Wardrobe limit (${limits.wardrobeLimit} items) reached. Upgrade to add more items.`);
        return;
      }


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


  // ==================== RENDER FUNCTIONS ====================
  
  const renderStylistView = () => (
    <div className="space-y-8">
      <TodaySuggestion 
        suggestion={todaySuggestion} 
        onViewCalendar={() => setView('calendar')}
      />


      {!styleAdvice && !isLoading && (
        <div className="space-y-8 animate-fade-in-up">
          <SelfieUploader 
            onImageUpload={setUploadedImage}
            uploadedImage={uploadedImage}
          />
          
          {/* Only show these if image is uploaded */}
          {uploadedImage && (
            <>
              <UserDetailsSelector
                age={age}
                gender={gender}
                setAge={setAge}
                setGender={setGender}
              />
              <StyleSelector
                occasion={occasion}
                setOccasion={setOccasion}
                style={style}
                setStyle={setStyle}
              />
              <ColorSelector
                selectedColors={selectedColors}
                onColorSelect={handleColorSelect}
              />
              
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="group relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg shadow-yellow-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Get Style Advice
                </button>
              </div>
            </>
          )}
        </div>
      )}


      {isLoading && <Loader />}
      
      {error && !isLoading && (
        <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>
      )}


      {styleAdvice && !isLoading && (
        <AIResultDisplay 
          advice={styleAdvice}
          image={uploadedImage}
          onReset={() => {
            setStyleAdvice(null);
            setUploadedImage(null);
            setError(null);
          }}
        />
      )}
    </div>
  );


  const renderWardrobeView = () => (
    <WardrobeUploader 
      wardrobe={wardrobe} 
      onAddToWardrobe={handleAddToWardrobe}
      onUpdateWardrobe={handleUpdateWardrobe}
      onDeleteFromWardrobe={handleDeleteFromWardrobe}
    />
  );


  const renderEditorView = () => (
    <ImageEditor wardrobe={wardrobe} />
  );


  const renderColorMatrixView = () => (
    <ColorMatrix userProfile={userProfile} wardrobe={wardrobe} />
  );


  const renderCalendarView = () => (
    <CalendarPlan />
  );


  // ✅ UPDATED: Render settings view with modal trigger prop
  const renderSettingsView = () => (
    userProfile?.subscription && user && (  // ✅ Added null check for subscription
      <SubscriptionManager 
        userProfile={userProfile}
        userEmail={user.email}       // ✅ Pass Firebase auth email
        userId={user.uid}            // ✅ Pass Firebase auth UID
        onSubscriptionUpdated={handleSubscriptionUpdated}
        onOpenPlanModal={handleOpenPlanModal} // ✅ NEW: Pass modal trigger function
      />
    )
  );


  // ==========================================================


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
      {/* ✅ NEW: Plan Selection Modal */}
      <PlanSelectionModal 
        isOpen={showPlanModal}
        onPlanSelect={handlePlanSelect}
        isLoading={isSelectingPlan}
      />


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
              {/* ✅ NEW: Show subscription tier in header */}
              <span className={`text-xs px-2 py-1 rounded-full ${
                subscriptionTier === 'free'
                  ? 'bg-gray-700 text-gray-300'
                  : subscriptionTier === 'style_plus'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
              }`}>
                {subscriptionTier === 'free' ? '🎁 Free' : subscriptionTier === 'style_plus' ? '⭐ Style+' : '👑 StyleX'}
              </span>
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
                <span>My Wardrobe</span>
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
                <span>Color Suggestion</span>
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


              {/* ✅ NEW: Settings button */}
              <button
                onClick={() => setView('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === 'settings' ? 'bg-yellow-400 text-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                <UserCircleIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>

              {/* ✅ NEW: Upgrade Button in Header - Only for free tier users */}
              {subscriptionTier === 'free' && (
                <button
                  onClick={handleOpenPlanModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Upgrade</span>
                </button>
              )}
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
                onClick={() => setShowLogoutConfirm(true)}
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
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">✕</button>
          </div>
        )}


        {view === 'stylist' && renderStylistView()}
        {view === 'wardrobe' && renderWardrobeView()}
        {view === 'editor' && renderEditorView()}
        {view === 'colorMatrix' && renderColorMatrixView()}
        {view === 'calendar' && renderCalendarView()}
        {view === 'settings' && renderSettingsView()}
      </main>


      {/* ✅ NEW: Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 max-w-sm space-y-4">
            <h2 className="text-2xl font-bold text-yellow-400">Logout?</h2>
            <p className="text-gray-300">Are you sure you want to logout?</p>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};


export default App;
