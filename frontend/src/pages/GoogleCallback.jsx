import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setToken, setUser } = useContext(ShopContext);

    useEffect(() => {
        const processLogin = async () => {
            const searchParams = new URLSearchParams(location.search);
            // Check for both token and accessToken
            const token = searchParams.get('token') || searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');
            const error = searchParams.get('remoteError');
            const userJson = searchParams.get('user');

            if (error) {
                console.error('Google login error:', error);
                toast.error(`Google login failed: ${error}`);
                navigate('/login');
                return;
            }

            if (token) {
                try {
                    // Store tokens
                    localStorage.setItem('token', token);
                    if (refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                    }

                    // Parse and store user data
                    let userData = {};
                    if (userJson) {
                        try {
                            userData = JSON.parse(decodeURIComponent(userJson));
                        } catch (e) {
                            console.error('Failed to parse user data', e);
                        }
                    }

                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update context
                    setToken(token);
                    setUser(userData);

                    toast.success('Successfully logged in with Google!');

                    // Redirect based on role
                    const rawRoles = userData.roles || userData.role || userData.userRoles || [];
                    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
                    const norm = roles.map((r) => String(r || '').toLowerCase());

                    const isAdmin = norm.includes('admin');
                    const isDelivery = norm.includes('deliverycompany') || norm.includes('delivery');

                    if (isAdmin) {
                        const adminUrl = import.meta.env.VITE_ADMIN_URL;
                        if (adminUrl) {
                            window.location.href = adminUrl;
                        } else {
                            navigate('/', { replace: true });
                        }
                    } else if (isDelivery) {
                        navigate('/orders', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }

                } catch (err) {
                    console.error('Error processing Google login:', err);
                    toast.error('Failed to process login');
                    navigate('/login');
                }
            } else {
                // No token found, maybe user cancelled or something went wrong
                toast.error('Login failed. No token received.');
                navigate('/login');
            }
        };

        processLogin();
    }, [location, navigate, setToken, setUser]);

    return (
        <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-lg text-gray-600">Processing Google Login...</p>
        </div>
    );
};

export default GoogleCallback;
