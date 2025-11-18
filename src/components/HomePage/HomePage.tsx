import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../images/logo.png';
import heroImage from '../../images/image4.png';
import featureImage1 from '../../images/image1.png';
import featureImage2 from '../../images/image2.png';
import featureImage3 from '../../images/image3.png';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="FitFX Logo" className="h-10 w-auto" />
          </div>

          {/* Nav Links - Left Aligned */}
          <div className="hidden md:flex items-center gap-6 flex-1 ml-12">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
            >
              Contact Us
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="text-gray-300 hover:text-yellow-400 transition-colors font-medium"
            >
              Privacy Policy
            </button>
          </div>

          {/* Auth Buttons - Right Aligned */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-lg hover:scale-105 transition-transform shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden flex justify-center gap-4 mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-300 hover:text-yellow-400"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="text-sm text-gray-300 hover:text-yellow-400"
          >
            Contact
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className="text-sm text-gray-300 hover:text-yellow-400"
          >
            Privacy
          </button>
        </div>
      </nav>

      {/* Hero Section - REDUCED PADDING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            FitFX
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-semibold">
            Smarter Fits. Sharper Looks.
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Your AI-powered personal styling assistant. Get personalized fashion recommendations,
            manage your digital wardrobe, and discover your perfect style with cutting-edge
            artificial intelligence.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-full shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* Hero Image - REDUCED TOP MARGIN */}
        <div className="mt-8">
          <img 
            src={heroImage} 
            alt="FitFX AI Styling Platform" 
            className="w-full h-auto rounded-2xl border border-gray-700 shadow-2xl"
          />
        </div>
      </section>

      {/* Features Section - REDUCED PADDING AND GAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-yellow-400">
          Why Choose FitFX?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <div className="text-yellow-400 text-4xl">✨</div>
            <h3 className="text-xl font-bold text-gray-200">AI-Powered Styling</h3>
            <p className="text-gray-400">
              Upload your selfie and get personalized outfit recommendations powered by Google Gemini AI,
              tailored to your preferences, occasion, and cultural context.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <div className="text-yellow-400 text-4xl">👔</div>
            <h3 className="text-xl font-bold text-gray-200">Digital Wardrobe</h3>
            <p className="text-gray-400">
              Organize and manage your clothing inventory digitally. Get outfit suggestions based on
              what you already own and maximize your wardrobe potential.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <div className="text-yellow-400 text-4xl">🎨</div>
            <h3 className="text-xl font-bold text-gray-200">Color Analysis</h3>
            <p className="text-gray-400">
              Discover your perfect color palette with AI-driven color analysis. Get personalized
              recommendations and create stunning color combinations.
            </p>
          </div>
        </div>

        {/* Features Images - REDUCED TOP MARGIN */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <img 
              src={featureImage1} 
              alt="AI Selfie Analysis" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <img 
              src={featureImage2} 
              alt="Digital Wardrobe Management" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <img 
              src={featureImage3} 
              alt="Color Analysis & Styling" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-6 text-sm">
            <button
              onClick={() => navigate('/contact')}
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Contact Us
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => navigate('/privacy')}
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 FitFX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
