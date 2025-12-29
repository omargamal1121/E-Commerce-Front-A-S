import { fetchWithTokenRefresh, getAuthHeaders, safeParseJson } from '../utils/apiUtils';

class WishlistService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL;
  }

  /**
   * Add a product to wishlist
   * @param {number} productId - The product ID to add
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async addToWishlist(productId, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Wishlist/${productId}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await safeParseJson(response);

      if (response.ok) {
        return {
          success: true,
          data: data.responseBody?.data || data.data || data,
          message: data.responseBody?.message || data.message || 'Product added to wishlist'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to add product to wishlist'
        };
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        error: 'Error adding product to wishlist'
      };
    }
  }

  /**
   * Remove a product from wishlist
   * @param {number} productId - The product ID to remove
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async removeFromWishlist(productId, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Wishlist/${productId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await safeParseJson(response);

      if (response.ok) {
        return {
          success: true,
          data: data.responseBody?.data || data.data || data,
          message: data.responseBody?.message || data.message || 'Product removed from wishlist'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to remove product from wishlist'
        };
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return {
        success: false,
        error: 'Error removing product from wishlist'
      };
    }
  }

  /**
   * Get user's wishlist
   * @param {number} page - Page number (default: 1)
   * @param {number} pageSize - Items per page (default: 20)
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async getWishlist(page = 1, pageSize = 20, refreshTokenFn, all = false) {
    try {
      let url = `${this.backendUrl}/api/Wishlist?all=${all}&page=${page}&pageSize=${pageSize}`
      const response = await fetchWithTokenRefresh(
        url,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await safeParseJson(response);

      if (response.ok) {
        const wishlistData = data.responseBody?.data || data.data || (Array.isArray(data) ? data : []);
        return {
          success: true,
          data: wishlistData,
          message: data.responseBody?.message || data.message || 'Wishlist retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to get wishlist'
        };
      }
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return {
        success: false,
        error: 'Error getting wishlist'
      };
    }
  }

  async isInWishlist(productId, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Wishlist/${productId}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await safeParseJson(response);

      if (response.ok) {
        return {
          success: true,
          data: data.responseBody?.data ?? data.data ?? data,
          message: data.responseBody?.message || data.message
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to check wishlist'
        };
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return {
        success: false,
        error: 'Error checking wishlist'
      };
    }
  }

  /**
   * Clear entire wishlist
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async clearWishlist(refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Wishlist`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await safeParseJson(response);

      if (response.ok) {
        return {
          success: true,
          data: data.responseBody?.data || data.data || data,
          message: data.responseBody?.message || data.message || 'Wishlist cleared successfully'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to clear wishlist'
        };
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return {
        success: false,
        error: 'Error clearing wishlist'
      };
    }
  }
}

const wishlistService = new WishlistService();
export default wishlistService;
