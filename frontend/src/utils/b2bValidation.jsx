import React from 'react';
import { toast } from 'react-toastify';

export const MAX_PRODUCT_QUANTITY = 5;
export const WHATSAPP_NUMBER = "201555522161";
export const WHATSAPP_DISPLAY = "01555522161";

/**
 * Returns the total quantity of a product in the given cartItems object
 * @param {Object} cartItems - e.g. { [productId]: { [variantKey]: quantity } }
 * @param {string|number} productId
 * @returns {number}
 */
export const getProductTotalQuantity = (cartItems, productId) => {
  if (!cartItems) return 0;
  const pId = String(productId);
  const variants = cartItems[pId];
  if (!variants || typeof variants !== 'object') return 0;
  return Object.values(variants).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
};

/**
 * Displays a user-friendly B2B alert with a direct WhatsApp action button
 * @param {string} [productName] - Optional product name
 */
export const notifyB2BMaxQuantity = (productName) => {
  const isArabic = typeof document !== 'undefined' && document.documentElement.lang === 'ar';

  const defaultMsg = isArabic
    ? "الحد الأقصى للطلب هو 5 قطع من كل منتج. للكميات والطلبات بالجملة، يُفضل استخدام خدمات B2B والتواصل معنا عبر واتساب للحصول على أسعار خاصة!"
    : "The maximum limit is 5 items per product. For bulk and wholesale orders, it's better to use our B2B services — message us on WhatsApp for special pricing!";

  const btnText = isArabic
    ? "تواصل معنا عبر واتساب (01555522161)"
    : "Text us on WhatsApp (01555522161)";

  const prefilled = encodeURIComponent(
    isArabic
      ? `مرحباً، أود الاستفسار عن طلب كميات بالجملة (B2B) ${productName ? `لمنتج: ${productName}` : ''}`
      : `Hello R&S, I would like to inquire about B2B wholesale orders ${productName ? `for: ${productName}` : ''}`
  );

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${prefilled}`;

  toast.warning(
    <div className="flex flex-col gap-2 py-1">
      <div className="font-bold text-sm text-[var(--text,#111)]">
        ⚠️ {isArabic ? "تجاوزت الحد الأقصى (5 قطع)" : "Maximum 5 Items Per Product"}
      </div>
      <p className="text-xs text-[var(--text-muted,#4b5563)] leading-relaxed">
        {defaultMsg}
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center gap-2 mt-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
      >
        <span>💬</span>
        <span>{btnText}</span>
      </a>
    </div>,
    {
      autoClose: 8000,
      closeOnClick: false,
    }
  );
};
