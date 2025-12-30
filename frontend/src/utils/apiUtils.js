import authService from "../services/authService";

/**
 * Utility functions for API requests with token refresh
 */

/**
 * Makes an authenticated API request with automatic token refresh
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body
 * @param {Function} [refreshTokenFn] - Optional function to refresh the token
 * @returns {Promise<Object>} - The API response
 */
export const fetchWithTokenRefresh = async (url, options = {}, refreshTokenFn) => {
  // Ensure headers exist
  const headers = options.headers || {};

  // First attempt with current token
  let response = await fetch(url, { ...options, credentials: 'include' });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    console.warn(`⚠️ 401 Unauthorized for ${url}. Attempting token refresh...`);
    try {
      let newToken = null;
      if (refreshTokenFn) {
        console.log("👉 Using provided refreshTokenFn (ShopContext)...");
        const success = await refreshTokenFn();
        if (success) newToken = localStorage.getItem("token");
      } else {
        console.log("👉 Using authService for refresh...");
        newToken = await authService.refreshToken();
        if (newToken) {
          localStorage.setItem("token", newToken);
        }
      }

      if (newToken) {
        console.log(`🚀 Refresh successful. Retrying: ${url}`);
        // Update Authorization header with new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        };

        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include'
        });
      } else {
        // If refresh failed (returned null/false)
        authService.logout();
      }
    } catch (error) {
      console.error("Fetch retry failed:", error);
      authService.logout();
    }
  }

  return response;
};

/**
 * Safely parses JSON response, returning empty object if body is empty or malformed
 * @param {Response} response - The fetch Response object
 * @returns {Promise<Object>} - The parsed data or an empty object
 */
export const safeParseJson = async (response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {};
  }
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