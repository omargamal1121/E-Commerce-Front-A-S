/**
 * Meta Pixel — safe event helper.
 *
 * Usage:
 *   import { trackEvent } from "../utils/pixel";
 *
 *   // AddToCart
 *   trackEvent("AddToCart", {
 *     content_ids: ["PRODUCT_SKU_123"],
 *     content_type: "product",
 *     value: 299.99,
 *     currency: "EGP",
 *   });
 *
 *   // Purchase
 *   trackEvent("Purchase", {
 *     content_ids: ["PRODUCT_SKU_123", "PRODUCT_SKU_456"],
 *     content_type: "product",
 *     value: 849.00,
 *     currency: "EGP",
 *     num_items: 2,
 *   });
 */
export const trackEvent = (name, data = {}) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", name, data);
  }
};
