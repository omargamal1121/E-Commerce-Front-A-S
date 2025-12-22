/**
 * Utility functions for API requests with token refresh
 */

/**
 * Makes an authenticated API request with automatic token refresh
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body
 * @param {Function} refreshTokenFn - Function to refresh the token
 * @returns {Promise<Object>} - The API response
 */
export const fetchWithTokenRefresh = async (url, options = {}, refreshTokenFn) => {
  // First attempt with current token
  let response = await fetch(url, options);
  
  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshTokenFn();
    
    if (refreshed) {
      // Update Authorization header with new token
      const newToken = localStorage.getItem('token');
      if (newToken) {
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        };
        
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: newHeaders
        });
      }
    }
  }
  
  return response;
};

/**
 * Prepares headers with authentication token
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} - Headers object with authentication
 */
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...additionalHeaders
  };
};