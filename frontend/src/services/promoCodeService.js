/**
 * promoCodeService.js
 * Customer-facing promo code validation.
 * POST /api/promo-codes/validate  — public, no auth required, rate-limited.
 */

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * Validates a promo code against the backend.
 *
 * @param {string} code  — Raw code from the input (will be trimmed + uppercased).
 * @returns {Promise<{
 *   isValid: boolean,
 *   code: string|null,
 *   discountPercent: number|null,
 *   endsAt: string|null,
 *   reason: string|null,
 *   errorMessage: string|null   // set when network/server error
 * }>}
 */
export async function validatePromoCode(code) {
  const sanitized = String(code || '').trim().toUpperCase();
  try {
    const response = await fetch(`${backendUrl}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sanitized }),
    });

    if (response.status === 429) {
      return {
        isValid: false, code: sanitized, discountPercent: null, endsAt: null,
        reason: 'RateLimit', errorMessage: 'TOO_MANY_REQUESTS',
      };
    }

    const data = await response.json();
    const body = data?.data ?? data?.responseBody?.data ?? data;

    return {
      isValid: body?.isValid ?? false,
      code: body?.code ?? sanitized,
      discountPercent: body?.discountPercent ?? null,
      endsAt: body?.endsAt ?? null,
      reason: body?.reason ?? null,
      errorMessage: null,
    };
  } catch (err) {
    console.error('[promoCodeService] validatePromoCode error:', err);
    return {
      isValid: false, code: sanitized, discountPercent: null, endsAt: null,
      reason: null, errorMessage: 'NETWORK_ERROR',
    };
  }
}

/**
 * Map backend reason codes to user-friendly messages.
 */
export function reasonToMessage(reason, t) {
  if (!reason) return t ? t('PROMO_INVALID_GENERIC') : 'Invalid promo code.';
  switch (reason) {
    case 'NotFound':    return t ? t('PROMO_NOT_FOUND')    : "This promo code doesn't exist.";
    case 'Inactive':    return t ? t('PROMO_INACTIVE')     : 'This promo code is currently inactive.';
    case 'NotStarted':  return t ? t('PROMO_NOT_STARTED')  : "This promo code isn't active yet.";
    case 'Expired':     return t ? t('PROMO_EXPIRED')      : 'This promo code has expired.';
    case 'RateLimit':   return t ? t('PROMO_RATE_LIMIT')   : 'Too many attempts, try again shortly.';
    default:            return t ? t('PROMO_INVALID_GENERIC') : 'Invalid promo code.';
  }
}
