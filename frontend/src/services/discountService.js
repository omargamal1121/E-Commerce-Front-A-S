import { fetchWithTokenRefresh, getAuthHeaders } from '../utils/apiUtils';

class DiscountService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL;
  }

  /**
   * Get discount information for a specific product
   * @param {number} productId - The product ID
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async getProductDiscount(productId, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Products/${productId}/Discount?isActive=true&includeDeleted=false`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await response.json();

      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data,
          message: data.responseBody.message || 'Discount retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to get product discount'
        };
      }
    } catch (error) {
      console.error('Error getting product discount:', error);
      return {
        success: false,
        error: 'Error getting product discount'
      };
    }
  }

  /**
   * Get detailed product information including discount
   * @param {number} productId - The product ID
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async getProductDetails(productId, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Products/${productId}?isActive=true&includeDeleted=false`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await response.json();

      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data,
          message: data.responseBody.message || 'Product details retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to get product details'
        };
      }
    } catch (error) {
      console.error('Error getting product details:', error);
      return {
        success: false,
        error: 'Error getting product details'
      };
    }
  }

  /**
   * Get all products with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async getAllProducts(page = 1, pageSize = 100, refreshTokenFn) {
    try {
      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Products?isActive=true&includeDeleted=false&page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        refreshTokenFn
      );

      const data = await response.json();

      if (response.ok && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data || [],
          message: data.responseBody.message || 'Products retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.message || data.message || 'Failed to get products'
        };
      }
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        success: false,
        error: 'Error getting products'
      };
    }
  }

  /**
   * Advanced search for products
   * @param {Object} searchCriteria - Criteria to filter products
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @param {Function} refreshTokenFn - Function to refresh the token
   * @returns {Promise<Object>} - API response
   */
  async advancedSearch(searchCriteria = {}, page = 1, pageSize = 10, refreshTokenFn) {
    try {
      const queryParams = new URLSearchParams({
        page,
        pageSize,
        isActive: true,
        includeDeleted: false
      });

      const response = await fetchWithTokenRefresh(
        `${this.backendUrl}/api/Products/advanced-search?${queryParams.toString()}`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchCriteria)
        },
        refreshTokenFn
      );

      const data = await response.json();

      if (response.status === 200 && data.responseBody) {
        return {
          success: true,
          data: data.responseBody.data || [],
          message: data.responseBody.message || 'Search successful'
        };
      } else if (response.status === 404) {
        return {
          success: true,
          data: [],
          message: data.responseBody?.message || 'No products found'
        };
      } else {
        return {
          success: false,
          error: data.responseBody?.errors?.messages?.[0] || data.message || 'Search failed'
        };
      }
    } catch (error) {
      console.error('Error in advanced search:', error);
      return {
        success: false,
        error: 'Error performing advanced search'
      };
    }
  }
}

const discountService = new DiscountService();
export default discountService;
