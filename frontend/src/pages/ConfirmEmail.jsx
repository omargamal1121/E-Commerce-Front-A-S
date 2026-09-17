import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const confirmUserEmail = async () => {
      if (!userId || !token) {
        setError('Invalid email confirmation link. Missing required parameters.');
        setLoading(false);
        return;
      }

      try {
        const encodedToken = encodeURIComponent(token);
        const encodedUserId = encodeURIComponent(userId);
        const response = await fetch(
          `${backendUrl}/api/Account/confirm-email?userId=${encodedUserId}&token=${encodedToken}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuccess('Your email has been confirmed successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError(
            data.responseBody?.message ||
              data.message ||
              'Email confirmation failed. The link may have expired or is invalid.'
          );
        }
      } catch (err) {
        console.error('Email confirmation error:', err);
        setError('Network error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    confirmUserEmail();
  }, [userId, token, backendUrl, navigate]);

  return (
    <motion.div
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-25 mb-20 gap-4 text-gray-800"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 60 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: 'easeOut' },
        },
      }}
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="text-3xl prata-regular">Email Confirmation</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 my-6">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Verifying your email address...</p>
        </div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm text-center"
        >
          {error}
        </motion.div>
      )}

      {success && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center"
        >
          {success}
        </motion.div>
      )}

      {!loading && (
        <button
          onClick={() => navigate('/login')}
          className="w-full font-light py-2 px-8 mt-4 border border-black bg-black text-white hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
        >
          Go to Login
        </button>
      )}
    </motion.div>
  );
};

export default ConfirmEmail;
