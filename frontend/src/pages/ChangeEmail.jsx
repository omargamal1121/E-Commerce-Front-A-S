import React, { useState, useContext } from 'react'
import { ShopContext } from '../context/ShopContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/apiUtils';

const ChangeEmail = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newEmail) {
      setError('Please enter a new email address');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/Account/change-email?NewEmail=${encodeURIComponent(newEmail)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.responseBody?.message || 'Email change request sent successfully. Please check your new email for verification.');
        setNewEmail('');
      } else {
        setError(data.responseBody?.message || data.message || 'Failed to change email. Please try again.');
      }
    } catch (err) {
      console.error('Change email error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-40 gap-4 text-gray-800'
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
    >
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='text-3xl prata-regular'>Change Email</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>
      <p className='text-sm text-gray-600 w-full text-center'>
        Enter your new email address below. A verification link will be sent to the new email.
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
        name="newEmail"
        value={newEmail}
        onChange={e => setNewEmail(e.target.value)}
        className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
        placeholder='Enter New Email Address'
        required
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-white hover:text-black'}`}
      >
        {loading ? 'Submitting...' : 'Change Email'}
      </button>
    </motion.form>
  );
};

export default ChangeEmail;