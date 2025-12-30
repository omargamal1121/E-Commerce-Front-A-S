import React, { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import authService from '../services/authService';

const SignUp = () => {
    const { backendUrl } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        phoneNumber: '',
        age: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const validateForm = () => {
        // Name validation
        if (!formData.name.match(/^[a-zA-Z][a-zA-Z\s\-,]*[a-zA-Z]$/)) {
            setError('Name must start and end with a letter and may contain spaces, hyphens, and commas in between');
            return false;
        }

        // Username validation
        if (!formData.userName.match(/^(?![_\.])[a-zA-Z0-9._]+(?<![_\.])$/)) {
            setError('Username must contain only letters, numbers, dots, and underscores, and must not start or end with a dot or underscore');
            return false;
        }

        // Phone number validation
        if (!formData.phoneNumber.match(/^01[0-9]{9}$/)) {
            setError('Phone number must be a valid 11-digit Egyptian number starting with 01');
            return false;
        }

        // Age validation
        const age = parseInt(formData.age);
        if (isNaN(age) || age < 18 || age > 100) {
            setError('Age must be between 18 and 100');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        // Password validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            setError('Confirm password does not match the password');
            return false;
        }

        return true;
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Register the user
            const response = await fetch(`${backendUrl}/api/Account/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    userName: formData.userName,
                    phoneNumber: formData.phoneNumber,
                    age: parseInt(formData.age),
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                })
            });
            const data = await response.json();
            if (response.ok) {
                // Handle Fashion-main API success response format
                const successMessage = data.responseBody?.message || 'User registered successfully!';
                setSuccess(`${successMessage} Redirecting to login...`);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // Handle Fashion-main API error response format
                const errorMessage = data.responseBody?.message ||
                    (data.responseBody?.error?.message) ||
                    'Failed to register. Please try again.';
                setError(errorMessage);
            }
        } catch (error) {
            console.log(error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to register. Please check your connection and try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const formVariants = {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
    };

    return (
        <motion.form
            onSubmit={onSubmitHandler}
            className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto gap-4 text-gray-800 mt-20'
            initial="hidden"
            animate="visible"
            variants={formVariants}
        >
            <div className='inline-flex items-center gap-2 mb-2 mt-10'>
                <p className='text-3xl prata-regular'>Sign Up</p>
                <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
            </div>

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
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Full Name'
                required
            />
            <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Username'
                required
            />
            <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Phone Number (e.g., 01xxxxxxxxx)'
                required
            />
            <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Age (18-100)'
                min="18"
                max="100"
                required
            />
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Email'
                required
            />
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Enter your Password'
                required
            />
            <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className='outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors'
                placeholder='Confirm your Password'
                required
            />
            <div className='w-full flex justify-between text-sm mt-[-8px]'>
                <p className='cursor-pointer'>Already have an account? <Link to="/login" className='hover:text-gray-600 hover:underline transition-all duration-300'>Login</Link></p>
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                    }`}
            >
                {loading ? 'Registering...' : 'Sign Up'}
            </button>

            <div className="w-full flex items-center justify-between mt-4">
                <hr className="w-full border-gray-300" />
                <span className="px-2 text-gray-500 text-sm">OR</span>
                <hr className="w-full border-gray-300" />
            </div>

            <button
                type="button"
                onClick={() => authService.initiateGoogleLogin()}
                className="w-full flex items-center justify-center gap-2 py-2 px-8 border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-300 mt-2"
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">Sign up with Google</span>
            </button>
        </motion.form>
    )
}

export default SignUp