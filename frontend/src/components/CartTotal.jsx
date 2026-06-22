import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
    const { currency, getCartAmount, getCartOriginalAmount } = useContext(ShopContext);

    const originalAmount = getCartOriginalAmount();
    const currentAmount = getCartAmount();
    const hasDiscount = originalAmount > currentAmount;

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p>Subtotal</p>
                    {hasDiscount ? (
                        <div className="flex items-center gap-2">
                            <span className="line-through text-gray-400">{currency}{originalAmount}.00</span>
                            <span className="font-semibold text-red-600">{currency}{currentAmount}.00</span>
                        </div>
                    ) : (
                        <p>{currency}{currentAmount}.00</p>
                    )}
                </div>
                <hr className='border-gray-300' />
                <div className='flex justify-between'>
                    <p>Total</p>
                    {hasDiscount ? (
                        <div className="flex items-center gap-2">
                            <span className="line-through text-gray-400">{currency}{originalAmount}.00</span>
                            <span className="font-bold text-red-600">{currency}{currentAmount}.00</span>
                        </div>
                    ) : (
                        <p>{currency}{currentAmount}.00</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CartTotal
