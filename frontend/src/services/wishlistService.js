import { fetchWithTokenRefresh, getAuthHeaders } from '../utils/apiUtils';

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

      const data = await response.json();
      
      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data,
          message: data.responseBody.message || 'Product added to wishlist'
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

      const data = await response.json();
      
      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data,
          message: data.responseBody.message || 'Product removed from wishlist'
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
  async getWishlist(page = 1, pageSize = 20, refreshTokenFn,all=false) {
    try {
      let url=`${this.backendUrl}/api/Wishlist?all=${all}&page=${page}&pageSize=${pageSize}`
      const response = await fetchWithTokenRefresh(
        url,

        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );
      console.log(url)

      const data = await response.json();
      console.log("Raw wishlist API response:", data);
      
      if (response.ok && data.responseBody) {
        console.log("Wishlist responseBody:", data.responseBody);
        // Ensure we're properly extracting the data array from the response
        const wishlistData = data.responseBody.data || [];
        console.log("Extracted wishlist data:", wishlistData);
        return {
          success: true,
          data: wishlistData,
          message: data.responseBody.message || 'Wishlist retrieved successfully'
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

  /**
   * Check if a product is in wishlist
   * @param {number} productId - The product ID to check
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */


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

      const data = await response.json();
      
      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data,
          message: data.responseBody.message || 'Wishlist cleared successfully'
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
