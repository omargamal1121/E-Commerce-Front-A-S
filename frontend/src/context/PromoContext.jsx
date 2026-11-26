/**
 * PromoContext — global promo-code state shared across cart, checkout, and
 * order-submit flows.  Wraps the entire app so both Cart and PlaceOrder can
 * access the same applied code.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { calcPromoDiscount } from '../utils/moneyMath';

export const PromoContext = createContext(null);

export const PromoProvider = ({ children }) => {
  const [appliedPromo, setAppliedPromo] = useState(null);
  // appliedPromo shape: { code, discountPercent, endsAt }

  const applyPromo = useCallback((promoData) => {
    setAppliedPromo(promoData);
  }, []);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  /**
   * Returns { subtotal, discountAmount, total } given the cart subtotal + shipping.
   * Always clamps total to >= 0.
   */
  const computeTotals = useCallback((subtotalEgp, shippingEgp = 0) => {
    const discountAmount = appliedPromo
      ? calcPromoDiscount(subtotalEgp, appliedPromo.discountPercent)
      : 0;
    const total = Math.max(0, subtotalEgp - discountAmount) + shippingEgp;
    return { subtotal: subtotalEgp, discountAmount, total };
  }, [appliedPromo]);

  return (
    <PromoContext.Provider value={{ appliedPromo, applyPromo, clearPromo, computeTotals }}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = () => {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used inside <PromoProvider>');
  return ctx;
};
