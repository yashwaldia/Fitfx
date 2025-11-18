import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../images/logo.png';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoImage} alt="FitFX Logo" className="h-10 w-auto" />
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
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
              className="text-yellow-400 font-medium"
            >
              Privacy Policy
            </button>
          </div>

          {/* Auth Buttons */}
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
            className="text-sm text-yellow-400 font-medium"
          >
            Privacy
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-yellow-400">Privacy Policy</h1>
            <p className="text-lg text-gray-400">
              Your privacy is important to us. Learn how we protect your data.
            </p>
            <p className="text-sm text-gray-500">Last Updated: November 18, 2025</p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {[
                  { id: 'introduction', label: 'Introduction' },
                  { id: 'info-collect', label: 'Information We Collect' },
                  { id: 'how-use', label: 'How We Use Your Info' },
                  { id: 'ai-processing', label: 'AI & Image Processing' },
                  { id: 'security', label: 'Data Security' },
                  { id: 'third-party', label: 'Third-Party Services' },
                  { id: 'your-rights', label: 'Your Rights' },
                  { id: 'retention', label: 'Data Retention' },
                  { id: 'children', label: "Children's Privacy" },
                  { id: 'changes', label: 'Policy Changes' },
                  { id: 'contact', label: 'Contact Us' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-400 hover:text-yellow-400 transition-colors py-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-6 md:p-10 space-y-10">
              {/* Section 1 */}
              <section id="introduction">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Welcome to FitFX ("we," "our," or "us"). We are committed to protecting your
                  personal information and your right to privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when you use our AI-powered
                  personal styling application.
                </p>
              </section>

              {/* Section 2 */}
              <section id="info-collect">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  2. Information We Collect
                </h2>
                <p className="text-gray-300 mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <div className="bg-gray-900/50 rounded-lg p-5 space-y-3">
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Personal Information:</strong> Name, email
                      address, and account credentials
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Profile Data:</strong> Gender, country, style
                      preferences, and occasion selections
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Images:</strong> Selfies and wardrobe photos you
                      upload for styling recommendations
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Usage Data:</strong> Information about how you
                      interact with our services
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Payment Information:</strong> Processed securely
                      through Razorpay (we do not store payment card details)
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="how-use">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-300 mb-4">We use the collected information to:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">
                      Provide personalized AI-powered styling recommendations
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">
                      Manage your digital wardrobe and outfit suggestions
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">Process your subscription and payments</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">Improve and optimize our services</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">
                      Communicate with you about updates and support
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-300">Ensure security and prevent fraud</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="ai-processing">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  4. AI and Image Processing
                </h2>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed">
                    Your uploaded images are processed using <strong className="text-blue-300">Google Gemini AI</strong> to
                    generate personalized styling advice. We do not share your images with third
                    parties for marketing purposes. Images are stored securely in{' '}
                    <strong className="text-blue-300">Firebase Cloud Storage</strong> and are only accessible to you and
                    our AI processing systems.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="security">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  5. Data Storage and Security
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use industry-standard security measures to protect your information, including
                  Firebase Authentication and Firestore database security rules. However, no method of
                  transmission over the internet is 100% secure, and we cannot guarantee absolute
                  security.
                </p>
              </section>

              {/* Section 6 */}
              <section id="third-party">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  6. Third-Party Services
                </h2>
                <p className="text-gray-300 mb-4">We use the following third-party services:</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-900/50">
                        <th className="border border-gray-700 px-4 py-3 text-left text-yellow-400 font-semibold">
                          Service
                        </th>
                        <th className="border border-gray-700 px-4 py-3 text-left text-yellow-400 font-semibold">
                          Purpose
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-800/30">
                        <td className="border border-gray-700 px-4 py-3 text-white font-medium">
                          Firebase
                        </td>
                        <td className="border border-gray-700 px-4 py-3 text-gray-300">
                          Authentication, database, and cloud storage
                        </td>
                      </tr>
                      <tr className="bg-gray-900/30">
                        <td className="border border-gray-700 px-4 py-3 text-white font-medium">
                          Google Gemini AI
                        </td>
                        <td className="border border-gray-700 px-4 py-3 text-gray-300">
                          AI-powered styling recommendations
                        </td>
                      </tr>
                      <tr className="bg-gray-800/30">
                        <td className="border border-gray-700 px-4 py-3 text-white font-medium">
                          Razorpay
                        </td>
                        <td className="border border-gray-700 px-4 py-3 text-gray-300">
                          Payment processing and subscription management
                        </td>
                      </tr>
                      <tr className="bg-gray-900/30">
                        <td className="border border-gray-700 px-4 py-3 text-white font-medium">
                          Vercel
                        </td>
                        <td className="border border-gray-700 px-4 py-3 text-gray-300">
                          Application hosting and deployment
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 7 */}
              <section id="your-rights">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  7. Your Rights
                </h2>
                <p className="text-gray-300 mb-4">You have the right to:</p>
                <div className="space-y-3">
                  {[
                    'Access and download your personal data',
                    'Request correction of inaccurate information',
                    'Request deletion of your account and associated data',
                    'Opt-out of marketing communications',
                    'Withdraw consent for data processing',
                  ].map((right, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 bg-gray-900/30 rounded-lg p-4"
                    >
                      <svg
                        className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-gray-300">{right}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 8 */}
              <section id="retention">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  8. Data Retention
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We retain your information for as long as your account is active or as needed to
                  provide services. If you delete your account, we will delete your personal
                  information within <strong className="text-yellow-400">30 days</strong>, except where we are required
                  to retain it for legal or compliance purposes.
                </p>
              </section>

              {/* Section 9 */}
              <section id="children">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  9. Children's Privacy
                </h2>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed">
                    FitFX is not intended for users under the age of <strong className="text-red-300">13</strong>. We do
                    not knowingly collect personal information from children under 13. If you believe
                    we have collected information from a child, please contact us immediately.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="changes">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  10. Changes to This Policy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any
                  changes by posting the new policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              {/* Section 11 */}
              <section id="contact">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4">
                  11. Contact Us
                </h2>
                <div className="bg-gray-900/50 rounded-lg p-6 border-l-4 border-yellow-400">
                  <p className="text-gray-300 mb-4">
                    If you have questions or concerns about this Privacy Policy, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      <strong className="text-white">Email:</strong>{' '}
                      <a
                        href="mailto:narisnarender@gmail.com"
                        className="text-yellow-400 hover:text-yellow-300 underline"
                      >
                        narisnarender@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Back to Top Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                Back to Top
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
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
              className="text-yellow-400 font-medium"
            >
              Privacy Policy
            </button>
          </div>
          <p className="text-gray-500 text-sm">© 2025 FitFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
