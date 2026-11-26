/**
 * moneyMath.js — integer-cent arithmetic matching backend rounding.
 * "Round half away from zero" (standard commercial rounding).
 */

/** Convert a float EGP amount to integer cents (e.g. 99.5 → 9950) */
export const toCents = (egp) => Math.round(egp * 100);

/** Convert cents back to EGP float (e.g. 9950 → 99.5) */
export const fromCents = (cents) => cents / 100;

/**
 * Calculate promo discount amount in cents.
 * discountCents = round(subtotalCents × percent / 100)   (round half away from zero)
 */
export const calcPromoDiscount = (subtotalEgp, discountPercent) => {
  if (!subtotalEgp || !discountPercent) return 0;
  const subtotalCents = toCents(subtotalEgp);
  const discountCents = Math.round(subtotalCents * discountPercent / 100);
  return fromCents(discountCents);
};

/**
 * Format a number to 2 decimal places (safe display).
 */
export const fmt2 = (n) => Number(n || 0).toFixed(2);
