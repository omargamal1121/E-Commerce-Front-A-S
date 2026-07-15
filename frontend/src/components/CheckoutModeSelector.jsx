import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CheckoutModeSelector = () => {
  const { token, setGuestCheckoutMode } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleGuestCheckout = () => {
    setGuestCheckoutMode(true);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-gray-50/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">Choose Your Checkout Path</h1>
          <p className="text-gray-600">Select how you'd like to proceed with your order</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guest Checkout Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100 hover:border-black cursor-pointer transition-all"
            onClick={handleGuestCheckout}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Continue as Guest</h3>
              <p className="text-sm text-gray-500 mb-4">
                No account required. Quick checkout with your email.
              </p>
              <div className="text-xs text-gray-400">
                <span className="font-semibold">✓</span> Fast checkout
                <br />
                <span className="font-semibold">✓</span> No password needed
                <br />
                <span className="font-semibold">✓</span> Link orders later
              </div>
            </div>
          </motion.div>

          {/* Login Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100 hover:border-black cursor-pointer transition-all"
            onClick={handleLogin}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Sign In</h3>
              <p className="text-sm text-gray-500 mb-4">
                Access your account and order history.
              </p>
              <div className="text-xs text-gray-400">
                <span className="font-semibold">✓</span> Order tracking
                <br />
                <span className="font-semibold">✓</span> Saved addresses
                <br />
                <span className="font-semibold">✓</span> Wishlist access
              </div>
            </div>
          </motion.div>

          {/* Signup Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100 hover:border-black cursor-pointer transition-all"
            onClick={handleSignup}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Create Account</h3>
              <p className="text-sm text-gray-500 mb-4">
                Join us for exclusive benefits and rewards.
              </p>
              <div className="text-xs text-gray-400">
                <span className="font-semibold">✓</span> All member benefits
                <br />
                <span className="font-semibold">✓</span> Exclusive offers
                <br />
                <span className="font-semibold">✓</span> Faster future checkout
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-gray-500 hover:text-black transition-colors"
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModeSelector;
