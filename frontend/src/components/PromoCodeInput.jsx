/**
 * PromoCodeInput.jsx
 *
 * Reusable promo-code text input + Apply button for cart / checkout summary.
 * Displays success badge, error messages, and a remove (×) button.
 * Pressing Enter triggers Apply (not the outer form submit).
 */
import React, { useState, useRef, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePromo } from '../context/PromoContext';
import { validatePromoCode, reasonToMessage } from '../services/promoCodeService';

const PROMO_INPUT_REGEX = /^[A-Z0-9_\-]{0,20}$/;

const PromoCodeInput = () => {
  const { t } = useTranslation();
  const { appliedPromo, applyPromo, clearPromo } = usePromo();

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const feedbackId = useId();

  const handleChange = (e) => {
    const raw = e.target.value.toUpperCase();
    if (PROMO_INPUT_REGEX.test(raw)) {
      setInputValue(raw);
      setError('');
    }
  };

  const handleApply = async () => {
    if (loading) return;
    const code = inputValue.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');

    try {
      const result = await validatePromoCode(code);

      if (result.errorMessage === 'TOO_MANY_REQUESTS') {
        setError(t('PROMO_RATE_LIMIT'));
        return;
      }
      if (result.errorMessage === 'NETWORK_ERROR') {
        setError(t('PROMO_NETWORK_ERROR'));
        return;
      }

      if (result.isValid) {
        applyPromo({
          code: result.code,
          discountPercent: result.discountPercent,
          endsAt: result.endsAt,
        });
        setInputValue('');
        setError('');
      } else {
        setError(reasonToMessage(result.reason, t));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent outer form submit
      handleApply();
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
        {t('PROMO_CODE')}
      </label>

      {/* Applied badge */}
      <AnimatePresence>
        {appliedPromo && (
          <motion.div
            key="badge"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
            aria-live="polite"
          >
            <span className="text-xs font-black text-green-600 dark:text-green-400 flex items-center gap-1.5">
              🏷️ {appliedPromo.code}
              <span className="bg-green-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">
                -{appliedPromo.discountPercent}%
              </span>
            </span>
            <button
              type="button"
              onClick={clearPromo}
              aria-label={t('PROMO_REMOVE')}
              className="text-green-600 hover:text-red-500 transition-colors font-black text-base leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row (hidden when a code is already applied) */}
      {!appliedPromo && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('PROMO_PLACEHOLDER')}
            maxLength={20}
            disabled={loading}
            aria-label={t('PROMO_CODE')}
            aria-describedby={feedbackId}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono uppercase tracking-wider outline-none transition-all
              ${error
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-2 focus:ring-red-300'
                : 'border-[var(--border)] bg-[var(--surface-raised)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30'
              } text-[var(--text)]`}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !inputValue.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${loading || !inputValue.trim()
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--accent)] text-white hover:opacity-90 active:scale-95'
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('PROMO_APPLYING')}
              </span>
            ) : t('PROMO_APPLY')}
          </button>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={feedbackId}
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="alert"
            aria-live="assertive"
            className="mt-1.5 text-xs text-red-500 font-semibold"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromoCodeInput;
