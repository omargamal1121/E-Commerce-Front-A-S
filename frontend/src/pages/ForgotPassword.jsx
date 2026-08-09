import React, { useState, useContext } from 'react'
import { ShopContext } from '../context/ShopContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const {backendUrl} = useContext(ShopContext)
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/Account/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(t('RESET_LINK_SENT'));
        setEmail('');
      } else {
        setError(data.message || t('FAILED_TO_SEND'));
      }
    } catch (err) {
      setError(t('NETWORK_ERROR'), err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
    >
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='text-3xl prata-regular'>{t('FORGOT_PASSWORD')}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>
      <p className='text-sm text-gray-600 w-full text-center'>
        {t('FORGOT_PASSWORD_DESC')}
      </p>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
        >
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm"
        >
          {success}
        </motion.div>
      )}
      <input
        type="email"
        name="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
        placeholder={t('ENTER_EMAIL')}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-white hover:text-black'}`}
      >
        {loading ? t('SENDING') : t('SEND_RESET_INSTRUCTIONS')}
      </button>
      {success && (
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full font-light py-2 px-8 mt-2 border border-gray-300 transition-all duration-300 cursor-pointer bg-white text-black hover:bg-gray-100"
        >
          {t('BACK_TO_LOGIN')}
        </button>
      )}
    </motion.form>
  );
};

export default ForgotPassword; 
