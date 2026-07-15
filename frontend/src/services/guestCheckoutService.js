/**
 * guestCheckoutService.js
 *
 * Thin service layer for anonymous (guest) checkout API calls.
 */

import { getGuestToken, saveGuestToken } from "../utils/guestSession";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * Places a guest order.
 *
 * @param {Object} payload - Full order payload matching the API spec:
 *   customerName, phoneNumber, email, governorate, city, street,
 *   building, floor, apartment, state, postalCode, notes,
 *   items: [{ productId, productVariantId, quantity }]
 *
 * @returns {Promise<{ success: boolean, orderNumber: string|null, orderId: number|null, message: string }>}
 */
export async function placeGuestOrder(payload) {
  try {
    const guestToken = getGuestToken();
    const headers = { "Content-Type": "application/json" };
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }

    const response = await fetch(`${backendUrl}/api/order/guest`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[guestCheckoutService] placeGuestOrder raw response:", {
      httpStatus: response.status,
      data,
    });

    // Support both envelope shapes: data.data (new) and data.responseBody.data (legacy)
    const body = data?.data ?? data?.responseBody?.data ?? null;
    const success = data?.success ?? (response.status === 201);

    // If we get a guest token in the response, save it
    if (body?.guestToken) {
      saveGuestToken(body.guestToken);
    }

    if (success && body?.orderNumber) {
      return { success: true, orderNumber: body.orderNumber, orderId: body.orderId, message: data.message };
    }

    let errorMessage = data?.message || data?.responseBody?.message || "Failed to place guest order.";
    const detailedErrors = data?.responseBody?.errors?.messages;
    if (Array.isArray(detailedErrors) && detailedErrors.length > 0) {
      errorMessage = `${errorMessage} - Details: ${detailedErrors.join(", ")}`;
    }

    return {
      success: false,
      orderNumber: null,
      orderId: null,
      message: errorMessage,
    };
  } catch (error) {
    console.error("[guestCheckoutService] placeGuestOrder error:", error);
    return { success: false, orderNumber: null, orderId: null, message: "Network error. Please try again." };
  }
}

/**
 * Initiates an online payment for an existing guest order.
 *
 * @param {string} orderNumber   - The order number returned by placeGuestOrder.
 * @param {number} paymentMethod - Numeric enum value from GET /api/Enums/PaymentMethods.
 * @param {string} [walletPhone] - Optional mobile wallet phone number.
 * @param {string} [notes]       - Optional payment notes.
 *
 * @returns {Promise<{ success: boolean, redirectUrl: string|null, message: string }>}
 */
export async function initiateGuestPayment(orderNumber, paymentMethod, walletPhone = "", notes = "") {
  try {
    const guestToken = getGuestToken();
    const headers = { "Content-Type": "application/json" };
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }

    const requestBody = {
      orderNumber,
      paymentDetails: {
        paymentMethod,          // numeric enum id (e.g. 1 = Card, 2 = Mobile Wallet)
        currency: "EGP",
        walletPhoneNumber: walletPhone || null,
        notes: notes || null,
      },
    };

    console.log("[guestCheckoutService] initiateGuestPayment REQUEST →", {
      url: `${backendUrl}/api/payment`,
      body: requestBody,
    });

    const response = await fetch(`${backendUrl}/api/payment`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("[guestCheckoutService] initiateGuestPayment RESPONSE ←", {
      httpStatus: response.status,
      data,
    });

    // Support both envelope shapes
    const body = data?.data ?? data?.responseBody?.data ?? null;
    const success = data?.success ?? response.ok;

    // If we get a guest token in the response, save it
    if (body?.guestToken) {
      saveGuestToken(body.guestToken);
    }

    if (success && body?.isRedirectRequired && body?.redirectUrl) {
      return { success: true, redirectUrl: body.redirectUrl, message: data.message };
    }

    return {
      success: false,
      redirectUrl: null,
      message: data?.message || data?.responseBody?.message || "Payment initiation failed.",
    };
  } catch (error) {
    console.error("[guestCheckoutService] initiateGuestPayment error:", error);
    return { success: false, redirectUrl: null, message: "Network error. Please try again." };
  }
}

/**
 * Fetches order details by order number for guest users.
 * Uses the dedicated guest endpoint /api/Order/guest/number/{orderNumber}
 * for users who are not logged in.
 *
 * @param {string} orderNumber - The order number to fetch details for
 *
 * @returns {Promise<{ success: boolean, data: Object|null, message: string }>}
 */
export async function getGuestOrderByNumber(orderNumber) {
  try {
    const guestToken = getGuestToken();
    const headers = { "Content-Type": "application/json" };
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }

    console.log("[guestCheckoutService] getGuestOrderByNumber REQUEST →", {
      url: `${backendUrl}/api/Order/guest/number/${orderNumber}`,
    });

    const response = await fetch(`${backendUrl}/api/Order/guest/number/${orderNumber}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();
    console.log("[guestCheckoutService] getGuestOrderByNumber RESPONSE ←", {
      httpStatus: response.status,
      data,
    });

    // Support both envelope shapes: data.data (new) and data.responseBody.data (legacy)
    const body = data?.data ?? data?.responseBody?.data ?? null;
    const success = data?.success ?? response.ok;

    // If we get a guest token in the response, save it
    if (body?.guestToken) {
      saveGuestToken(body.guestToken);
    }

    if (success && body) {
      return { success: true, data: body, message: data.message };
    }

    return {
      success: false,
      data: null,
      message: data?.message || data?.responseBody?.message || "Failed to fetch guest order details.",
    };
  } catch (error) {
    console.error("[guestCheckoutService] getGuestOrderByNumber error:", error);
    return { success: false, data: null, message: "Network error. Please try again." };
  }
}
