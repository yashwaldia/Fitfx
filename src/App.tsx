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
  getUserSubscriptionTier,
} from './services/firestoreService';
import { getStyleAdvice } from './services/geminiService';
// ✨ UPDATED: Razorpay import instead of LemonSqueezy
import { redirectToRazorpayLink, loadRazorpayScript } from './services/razorpayService';
import type {
  StyleAdvice,
  Occasion,
  Country,
  Gender,
  Garment,
  UserProfile,
  OutfitData,
  SubscriptionTier,
} from './types';

// Components
import SelfieUploader from './components/SelfieUploader';
import StyleSelector from './components/StyleSelector';
import UserDetailsSelector from './components/UserDetailsSelector';
import AIResultDisplay from './components/AIResultDisplay';
import Loader from './components/Loader';
import {
  LogoIcon,
  SparklesIcon,
  WardrobeIcon,
  EditIcon,
  CalendarIcon,
  LogoutIcon,
  UserCircleIcon,
  ColorSwatchIcon,
} from './components/Icons';
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
import PlanSelectionModal from './components/PlanSelectionModal';
import SubscriptionManager from './components/SubscriptionManager';
import { requestNotificationPermission } from './components/Notifications';
import logoImage from './images/logo.png';

type View = 'stylist' | 'wardrobe' | 'editor' | 'colorMatrix' | 'calendar' | 'settings';
type AuthStep = 'loading' | 'login' | 'profile' | 'loggedIn';

// ✨ DEBUG: Log Razorpay configuration
if (typeof window !== 'undefined') {
  console.log('=== RAZORPAY CONFIGURATION ===');
  console.log('REACT_APP_RAZORPAY_KEY_ID:', process.env.REACT_APP_RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing');
  console.log('REACT_APP_RAZORPAY_PLUS_LINK:', process.env.REACT_APP_RAZORPAY_PLUS_LINK ? '✅ Configured' : '❌ Missing');
  console.log('REACT_APP_RAZORPAY_X_LINK:', process.env.REACT_APP_RAZORPAY_X_LINK ? '✅ Configured' : '❌ Missing');
  const allLoaded =
    process.env.REACT_APP_RAZORPAY_KEY_ID &&
    process.env.REACT_APP_RAZORPAY_PLUS_LINK &&
    process.env.REACT_APP_RAZORPAY_X_LINK;
  console.log(allLoaded ? '✅ YES - Ready to use Razorpay!' : '❌ NO - Check .env.local');
}

const App: React.FC = () => {
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('loading');
  const [showSignup, setShowSignup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // ✅ Subscription state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // App state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<Occasion>('Traditional');
  const [country, setCountry] = useState<Country>('India');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [styleAdvice, setStyleAdvice] = useState<StyleAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('stylist');
  const [todaySuggestion, setTodaySuggestion] = useState<OutfitData | null>(null);

  /**
   * Check authentication state and load user data
   */
  useEffect(() => {
    // ✨ Load Razorpay script on app mount
    loadRazorpayScript()
      .then((success) => {
        if (success) {
          console.log('✅ Razorpay script loaded successfully');
        } else {
          console.warn('⚠️ Failed to load Razorpay script');
        }
      })
      .catch((err) => {
        console.error('❌ Error loading Razorpay:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('✅ User logged in:', currentUser.uid);
        setUserId(currentUser.uid);
        setUser(currentUser);

        try {
          const profile = await loadUserProfile(currentUser.uid);

          if (profile) {
            setUserProfile(profile);

            const wardrobeData = await loadWardrobe(currentUser.uid);
            setWardrobe(wardrobeData);

            if (profile.age) setAge(profile.age);
            if (profile.gender) setGender(profile.gender);
            if (profile.preferredOccasions && profile.preferredOccasions.length > 0) {
              setOccasion(profile.preferredOccasions[0]);
            }
            if (profile.favoriteColors) {
              setSelectedColors(profile.favoriteColors);
            }

            if (profile.subscription?.tier) {
              setSubscriptionTier(profile.subscription.tier);
            }

            if (!profile.hasSeenPlanModal && profile.subscription?.tier === 'free') {
              setShowPlanModal(true);
            }

            setAuthStep('loggedIn');
            generateTodaySuggestion();
          } else {
            setAuthStep('profile');
          }
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          setAuthStep('profile');
        }
      } else {
        setAuthStep('login');
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Load subscription tier on mount
   */
  useEffect(() => {
    if (userId && authStep === 'loggedIn') {
      const loadSubscription = async () => {
        try {
          const tier = await getUserSubscriptionTier(userId);
          console.log('📊 Loaded subscription tier:', tier);
          setSubscriptionTier(tier || 'free');
        } catch (error) {
          console.error('❌ Error loading subscription:', error);
          setSubscriptionTier('free');
        }
      };
      loadSubscription();
    }
  }, [userId, authStep]);

  /**
   * Generate today's suggestion
   */
  const generateTodaySuggestion = () => {
    try {
      const suggestions: OutfitData[] = [
        {
          'Colour Combination': 'Navy & White',
          'T-Shirt/Shirt': 'White Cotton Shirt',
          'Trousers/Bottom': 'Navy Blue Chinos',
          'Jacket/Layer': 'Light Grey Blazer',
          'Shoes & Accessories': 'Brown Leather Shoes',
        },
        {
          'Colour Combination': 'Black & Beige',
          'T-Shirt/Shirt': 'Beige T-Shirt',
          'Trousers/Bottom': 'Black Jeans',
          'Jacket/Layer': 'Black Denim Jacket',
          'Shoes & Accessories': 'White Sneakers',
        },
      ];
      const dayOfWeek = new Date().getDay();
      const suggestion = suggestions[dayOfWeek % suggestions.length];
      setTodaySuggestion(suggestion);
    } catch (error) {
      console.error('❌ Failed to generate today\'s suggestion:', error);
    }
  };

  /**
   * Handle profile save
   */
  const handleProfileSave = async (profile: UserProfile) => {
    if (!userId) {
      console.error('❌ No user logged in');
      return;
    }

    try {
      setAuthStep('loading');

      profile.subscription = {
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
      };
      profile.hasSeenPlanModal = false;

      await saveUserProfile(userId, profile);

      setUserProfile(profile);
      setSubscriptionTier('free');

      if (profile.age) setAge(profile.age);
      if (profile.gender) setGender(profile.gender);
      if (profile.preferredOccasions && profile.preferredOccasions.length > 0) {
        setOccasion(profile.preferredOccasions[0]);
      }
      if (profile.favoriteColors) {
        setSelectedColors(profile.favoriteColors);
      }

      setAuthStep('loggedIn');
      generateTodaySuggestion();
      setupNotifications();

      setShowPlanModal(true);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
      setAuthStep('profile');
    }
  };

  /**
   * Setup notifications
   */
  const setupNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        console.log('✅ Notifications enabled');
      }
    } catch (error) {
      console.error('❌ Failed to set up notifications:', error);
    }
  };

  /**
   * ✨ Handle plan selection with Razorpay
   */
  const handlePlanSelect = async (tier: SubscriptionTier) => {
    setIsSelectingPlan(true);
    try {
      if (!userId) throw new Error('No user ID');
      if (!user) throw new Error('No user');

      console.log('📦 Plan selected:', tier);

      if (tier === 'free') {
        console.log('✅ Free tier selected - closing modal');
        await markPlanModalSeen(userId);
        setShowPlanModal(false);
        setSubscriptionTier('free');
        return;
      }

      console.log('💳 Opening Razorpay payment for tier:', tier);

      // ✨ Redirect to Razorpay payment link
      redirectToRazorpayLink(tier);

      await markPlanModalSeen(userId);
      setShowPlanModal(false);
    } catch (err) {
      console.error('❌ Error selecting plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to select plan');
    } finally {
      setIsSelectingPlan(false);
    }
  };

  /**
   * Handle subscription updated
   */
  const handleSubscriptionUpdated = async (newTier: SubscriptionTier) => {
    setSubscriptionTier(newTier);
    if (userProfile?.subscription) {
      userProfile.subscription.tier = newTier;
      setUserProfile({ ...userProfile });
    }
  };

  /**
   * Handle open plan modal
   */
  const handleOpenPlanModal = () => {
    setShowPlanModal(true);
  };

  /**
   * Handle logout
   */
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
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  /**
   * Handle color select
   */
  const handleColorSelect = (hex: string) => {
    setSelectedColors((prev) => (prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]));
  };

  /**
   * Handle add to wardrobe
   */
  const handleAddToWardrobe = async (garment: Garment) => {
    if (!userId) {
      console.error('❌ No user logged in');
      return;
    }

    try {
      await addWardrobeItem(userId, garment);
      setWardrobe((prev) => [...prev, garment]);
    } catch (error) {
      console.error('❌ Error adding wardrobe item:', error);
      setError('Failed to add item to wardrobe. Please try again.');
    }
  };

  /**
   * Handle update wardrobe
   */
  const handleUpdateWardrobe = async (index: number, updatedGarment: Garment) => {
    if (!userId) {
      console.error('❌ No user logged in');
      return;
    }

    try {
      await updateWardrobeItem(userId, index, updatedGarment, wardrobe);
      const updatedWardrobe = [...wardrobe];
      updatedWardrobe[index] = updatedGarment;
      setWardrobe(updatedWardrobe);
    } catch (error) {
      console.error('❌ Error updating wardrobe item:', error);
      setError('Failed to update item. Please try again.');
    }
  };

  /**
   * Handle delete from wardrobe
   */
  const handleDeleteFromWardrobe = async (index: number) => {
    if (!userId) {
      console.error('❌ No user logged in');
      return;
    }

    try {
      await deleteWardrobeItem(userId, index, wardrobe);
      const updatedWardrobe = wardrobe.filter((_, i) => i !== index);
      setWardrobe(updatedWardrobe);
    } catch (error) {
      console.error('❌ Error deleting wardrobe item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  /**
   * Handle submit for style advice
   */
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
        country,
        age,
        gender,
        selectedColors,
        wardrobe,
        userProfile
      );
      setStyleAdvice(advice);
    } catch (err) {
      console.error('❌ Error getting style advice:', err);
      setError('Failed to get style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, occasion, country, age, gender, selectedColors, wardrobe, userProfile]);

  // ==================== RENDER FUNCTIONS ====================

  const renderStylistView = () => (
    <div className="space-y-8">
      <TodaySuggestion
        suggestion={todaySuggestion}
        onViewCalendar={() => setView('calendar')}
      />

      {!styleAdvice && !isLoading && (
        <div className="space-y-8 animate-fade-in-up">
          <SelfieUploader onImageUpload={setUploadedImage} uploadedImage={uploadedImage} />

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
                country={country}
                setCountry={setCountry}
              />
              <ColorSelector selectedColors={selectedColors} onColorSelect={handleColorSelect} />

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
      subscriptionTier={subscriptionTier}
      subscriptionEndDate={undefined}
    />
  );

  const renderEditorView = () => (
    <ImageEditor
      wardrobe={wardrobe}
      subscriptionTier={subscriptionTier}
      onUpgradeClick={handleOpenPlanModal}
    />
  );

  const renderColorMatrixView = () => <ColorMatrix userProfile={userProfile} wardrobe={wardrobe} />;

  const renderCalendarView = () => <CalendarPlan />;

  const renderSettingsView = () =>
    userProfile?.subscription && user ? (
      <SubscriptionManager
        userProfile={userProfile}
        userEmail={user.email}
        userId={user.uid}
        onSubscriptionUpdated={handleSubscriptionUpdated}
        onOpenPlanModal={handleOpenPlanModal}
      />
    ) : null;

  if (authStep === 'loading') {
    return <Loader />;
  }

  if (authStep === 'login') {
    return showSignup ? (
      <Signup onSignupSuccess={() => setAuthStep('profile')} onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onLoginSuccess={() => setAuthStep('profile')} onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  if (authStep === 'profile') {
    return <ProfileCreation onProfileSave={handleProfileSave} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <PlanSelectionModal
        isOpen={showPlanModal}
        onPlanSelect={handlePlanSelect}
        isLoading={isSelectingPlan}
        onClose={() => setShowPlanModal(false)}
        currentTier={subscriptionTier}
      />

      <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-4 md:px-6 lg:px-8 py-3 md:py-4">
        <div className="max-w-full mx-auto">
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <img src={logoImage} alt="FitFx Logo" className="h-8 w-auto" />
              <span
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  subscriptionTier === 'free'
                    ? 'bg-gray-700 text-gray-300'
                    : subscriptionTier === 'style_plus'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                }`}
              >
                {subscriptionTier === 'free' ? '🎁 Free' : subscriptionTier === 'style_plus' ? '⭐ Style+' : '👑 StyleX'}
              </span>
            </div>

            <nav className="flex items-center gap-2 flex-1 justify-center">
              {[
                { view: 'stylist', icon: SparklesIcon, label: 'Selfie' },
                { view: 'wardrobe', icon: WardrobeIcon, label: 'Wardrobe' },
                { view: 'editor', icon: EditIcon, label: 'Editor' },
                { view: 'colorMatrix', icon: ColorSwatchIcon, label: 'Color' },
                { view: 'calendar', icon: CalendarIcon, label: 'Calendar' },
                { view: 'settings', icon: UserCircleIcon, label: 'Settings' },
              ].map(({ view: v, icon: Icon, label }) => (
                <button
                  key={v}
                  onClick={() => setView(v as View)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap ${
                    view === v ? 'bg-yellow-400 text-gray-900 font-bold' : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 flex-shrink-0">
              {subscriptionTier === 'free' && (
                <button
                  onClick={handleOpenPlanModal}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-lg hover:scale-105 transition-transform shadow-lg text-sm whitespace-nowrap"
                >
                  ⭐ Upgrade
                </button>
              )}

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <img src={logoImage} alt="FitFx Logo" className="h-6 w-auto" />
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    subscriptionTier === 'free'
                      ? 'bg-gray-700 text-gray-300'
                      : subscriptionTier === 'style_plus'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  }`}
                >
                  {subscriptionTier === 'free' ? '🎁' : subscriptionTier === 'style_plus' ? '⭐' : '👑'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {subscriptionTier === 'free' && (
                  <button
                    onClick={handleOpenPlanModal}
                    className="px-2 py-1 bg-yellow-400 text-gray-900 font-bold rounded text-xs whitespace-nowrap"
                  >
                    Upgrade
                  </button>
                )}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>

            <nav className="grid grid-cols-3 gap-2">
              {[
                { view: 'stylist', icon: SparklesIcon, label: 'Selfie' },
                { view: 'wardrobe', icon: WardrobeIcon, label: 'Wardrobe' },
                { view: 'editor', icon: EditIcon, label: 'Editor' },
                { view: 'colorMatrix', icon: ColorSwatchIcon, label: 'Color' },
                { view: 'calendar', icon: CalendarIcon, label: 'Calendar' },
                { view: 'settings', icon: UserCircleIcon, label: 'Settings' },
              ].map(({ view: v, icon: Icon, label }) => (
                <button
                  key={v}
                  onClick={() => setView(v as View)}
                  className={`flex flex-col items-center gap-1 p-2 rounded transition-all text-xs ${
                    view === v ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        {view === 'stylist' && renderStylistView()}
        {view === 'wardrobe' && renderWardrobeView()}
        {view === 'editor' && renderEditorView()}
        {view === 'colorMatrix' && renderColorMatrixView()}
        {view === 'calendar' && renderCalendarView()}
        {view === 'settings' && renderSettingsView()}
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 max-w-sm space-y-4 animate-fade-in-up">
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

      <Chatbot subscriptionTier={subscriptionTier} userId={userId || 'guest-user'} />
    </div>
  );
};

export default App;
