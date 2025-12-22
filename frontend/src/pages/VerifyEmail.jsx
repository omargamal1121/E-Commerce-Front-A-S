import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // All registration data is in location.state
    const formData = location.state || {};
    const email = formData.email || '';
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!code) {
            setError('Please enter the verification code.');
            return;
        }
        setLoading(true);
        try {
            // Send all registration data + code to register endpoint
            const response = await fetch('/api/account/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ ...formData, code }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('Email verified and account created! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.message || 'Verification failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please try again.' , err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
        >
            <div className='inline-flex items-center gap-2 mb-2 mt-10'>
                <p className='text-3xl prata-regular'>Verify Email</p>
                <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
            </div>
            <p className='text-sm text-gray-600 w-full text-center'>
                Please enter the verification code sent to <span className='font-semibold'>{email}</span>
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
                type="text"
                name="code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter verification code'
                required
            />
            <button
                type="submit"
                disabled={loading}
                className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-white hover:text-black'}`}
            >
                {loading ? 'Verifying & Registering...' : 'Verify & Register'}
            </button>
        </motion.form>
    );
};

export default VerifyEmail; 