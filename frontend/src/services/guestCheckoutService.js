/**
 * guestCheckoutService.js
 *
 * Thin service layer for anonymous (guest) checkout API calls.
 * Both endpoints require NO authentication token.
 */

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
    const response = await fetch(`${backendUrl}/api/order/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const requestBody = {
      orderNumber,
      paymentDetails: {
        paymentMethod,          // numeric enum id (e.g. 1 = Card, 2 = MobileWallet)
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
      headers: { "Content-Type": "application/json" },
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
