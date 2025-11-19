import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import logoImage from '../images/logo.png';


interface SignupProps {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (name.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });

      console.log('✅ User created successfully:', userCredential.user.uid);

      setSuccessMessage('Account created! Taking you in...');
      
      // ✨ REMOVED: await auth.signOut(); 
      // We want to keep the user logged in so they go straight to the app.

      setTimeout(() => {
        // ✨ Call the success handler which sets App.tsx state to 'loading'/'profile'
        onSignupSuccess();
        // ✨ Navigate directly to the app route
        navigate('/app'); 
      }, 1500);

    } catch (err: any) {
      console.error('❌ Signup error:', err);

      let errorMessage = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password authentication is not enabled.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    // Using the prop allows App.tsx to handle state changes if needed, 
    // but navigate is also fine for routing.
    onSwitchToLogin();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ✨ Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-gray-900 to-yellow-500/10 animate-gradient"></div>
      
      <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        <header className="text-center">
          <div className="flex items-center justify-center mb-4 animate-fade-in">
            <img 
              src={logoImage} 
              alt="FitFx Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </header>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-[5px_5px_30px_rgba(0,0,0,0.3)] border border-gray-700/50 space-y-6 animate-slide-up">
          <h2 className="text-2xl font-semibold text-yellow-400 text-center">Create Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-400">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isLoading || !!successMessage}
                className="w-full bg-gray-900/80 text-gray-200 rounded-full p-3 px-4 border-2 border-gray-700/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading || !!successMessage}
                className="w-full bg-gray-900/80 text-gray-200 rounded-full p-3 px-4 border-2 border-gray-700/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  disabled={isLoading || !!successMessage}
                  className="w-full bg-gray-900/80 text-gray-200 rounded-full p-3 px-4 pr-12 border-2 border-gray-700/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || !!successMessage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={isLoading || !!successMessage}
                  className="w-full bg-gray-900/80 text-gray-200 rounded-full p-3 px-4 pr-12 border-2 border-gray-700/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || !!successMessage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ✨ Modern Success Message */}
            {successMessage && (
              <div className="relative overflow-hidden bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 text-green-400 p-4 rounded-xl backdrop-blur-sm animate-fade-in-scale">
                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <svg className="w-6 h-6 animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <span className="font-medium">{successMessage}</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-teal-500 animate-progress"></div>
              </div>
            )}

            {/* ✨ Modern Error Message */}
            {error && !successMessage && (
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full px-8 py-3 shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : successMessage ? (
                  <>
                    <svg className="w-5 h-5 animate-bounce-once" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Success!</span>
                  </>
                ) : (
                  'Sign Up'
                )}
              </span>
              {!isLoading && !successMessage && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={handleSwitchToLogin}
                disabled={isLoading || !!successMessage}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50 hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-gradient { animation: gradient 15s ease infinite; background-size: 200% 200%; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-fade-in-scale { animation: fade-in-scale 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-progress { animation: progress 2s ease-out; }
        .animate-shake { animation: shake 0.5s ease-out; }
        .animate-bounce-once { animation: bounce-once 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default Signup;