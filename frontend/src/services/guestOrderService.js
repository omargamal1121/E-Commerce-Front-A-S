import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * Create a guest order
 * @param {Object} orderData - Guest order data
 * @param {string} orderData.customerName - Customer name (required)
 * @param {string} orderData.phoneNumber - Phone number (required)
 * @param {string} orderData.email - Email (optional)
 * @param {string} orderData.governorate - Governorate (optional)
 * @param {string} orderData.city - City (required)
 * @param {string} orderData.street - Street address (required)
 * @param {string} orderData.building - Building number (optional)
 * @param {string} orderData.notes - Order notes (optional)
 * @param {Array} orderData.items - Order items (required)
 * @param {number} orderData.items[].productId - Product ID (required)
 * @param {number} orderData.items[].productVariantId - Product variant ID (required)
 * @param {number} orderData.items[].quantity - Quantity (required)
 * @returns {Promise<Object>} Order response data
 */
export const createGuestOrder = async (orderData) => {
  try {
    const response = await axios.post(`${backendUrl}/api/Order/guest`, orderData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.statuscode === 200 || response.data.statuscode === 201) {
      return response.data.responseBody?.data;
    } else {
      throw new Error(response.data.responseBody?.message || 'Failed to create guest order');
    }
  } catch (error) {
    console.error('Error creating guest order:', error);
    throw error;
  }
};

/**
 * Get guest order by order number
 * @param {string} orderNumber - Order number
 * @returns {Promise<Object>} Order data
 */
export const getGuestOrderByNumber = async (orderNumber) => {
  try {
    const response = await axios.get(`${backendUrl}/api/Order/guest/number/${orderNumber}`);
    
    if (response.data.statuscode === 200) {
      return response.data.responseBody?.data;
    } else {
      throw new Error(response.data.responseBody?.message || 'Failed to fetch guest order');
    }
  } catch (error) {
    console.error('Error fetching guest order:', error);
    throw error;
  }
};

/**
 * Claim guest order after login
 * @param {string} orderNumber - Order number to claim
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Claim response data
 */
export const claimGuestOrder = async (orderNumber, token) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/Order/claim-guest`,
      { orderNumber },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.statuscode === 200) {
      return response.data.responseBody?.data;
    } else {
      throw new Error(response.data.responseBody?.message || 'Failed to claim guest order');
    }
  } catch (error) {
    console.error('Error claiming guest order:', error);
    throw error;
  }
};

/**
 * Save guest order data to localStorage
 * @param {Object} orderData - Guest order data
 */
export const saveGuestOrderData = (orderData) => {
  localStorage.setItem('guestOrderData', JSON.stringify(orderData));
};

/**
 * Get guest order data from localStorage
 * @returns {Object|null} Guest order data or null
 */
export const getGuestOrderData = () => {
  const data = localStorage.getItem('guestOrderData');
  return data ? JSON.parse(data) : null;
};

/**
 * Clear guest order data from localStorage
 */
export const clearGuestOrderData = () => {
  localStorage.removeItem('guestOrderData');
};

/**
 * Save guest order number to localStorage
 * @param {string} orderNumber - Order number
 */
export const saveGuestOrderNumber = (orderNumber) => {
  localStorage.setItem('guestOrderNumber', orderNumber);
};

/**
 * Get guest order number from localStorage
 * @returns {string|null} Order number or null
 */
export const getGuestOrderNumber = () => {
  return localStorage.getItem('guestOrderNumber');
};

/**
 * Clear guest order number from localStorage
 */
export const clearGuestOrderNumber = () => {
  localStorage.removeItem('guestOrderNumber');
};
