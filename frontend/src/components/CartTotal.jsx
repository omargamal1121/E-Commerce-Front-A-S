import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { usePromo } from '../context/PromoContext'
import { useTranslation } from 'react-i18next'
import { fmt2 } from '../utils/moneyMath'
import Title from './Title'
import PromoCodeInput from './PromoCodeInput'

const CartTotal = () => {
    const { currency, getCartAmount, getCartOriginalAmount } = useContext(ShopContext);
    const { appliedPromo, computeTotals } = usePromo();
    const { t } = useTranslation();

    const originalAmount = getCartOriginalAmount();
    const currentAmount = getCartAmount();
    const hasProductDiscount = originalAmount > currentAmount;

    // Promo totals — shipping not known at cart stage, omit it
    const { subtotal, discountAmount, total } = computeTotals(currentAmount, 0);

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-2 mt-2 text-sm'>
                {/* Subtotal (after product discounts) */}
                <div className='flex justify-between'>
                    <p>{t('CART_SUBTOTAL', 'Subtotal')}</p>
                    {hasProductDiscount ? (
                        <div className="flex items-center gap-2">
                            <span className="line-through text-gray-400">{currency}{fmt2(originalAmount)}</span>
                            <span className="font-semibold text-red-600">{currency}{fmt2(currentAmount)}</span>
                        </div>
                    ) : (
                        <p>{currency}{fmt2(currentAmount)}</p>
                    )}
                </div>

                {/* Promo Discount row */}
                {appliedPromo && discountAmount > 0 && (
                    <div className='flex justify-between text-green-600 font-semibold'>
                        <span className="flex items-center gap-1.5">
                            🏷️ {appliedPromo.code}
                            <span className="text-[9px] font-black bg-green-600 text-white rounded-full px-1.5 py-0.5">
                                -{appliedPromo.discountPercent}%
                            </span>
                        </span>
                        <span>-{currency}{fmt2(discountAmount)}</span>
                    </div>
                )}

                <hr className='border-[var(--border)]' />

                {/* Shipping */}
                <div className='flex justify-between'>
                    <p>{t('CART_SHIPPING', 'Shipping Fee')}</p>
                    <p className="text-green-600 text-xs">{t('CART_SHIPPING_CALC', 'Calculated at checkout')}</p>
                </div>

                <hr className='border-[var(--border)]' />

                {/* Total */}
                <div className='flex justify-between font-bold text-base'>
                    <p>{t('CART_TOTAL', 'Total')}</p>
                    <p className="text-[var(--accent)]">
                        {appliedPromo
                            ? <>{currency}{fmt2(total)}</>
                            : <>{currency}{fmt2(currentAmount)}</>
                        }
                    </p>
                </div>
            </div>

            {/* Promo code input */}
            <PromoCodeInput />
        </div>
    )
}

export default CartTotal
