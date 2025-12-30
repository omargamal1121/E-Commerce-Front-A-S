import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
    const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

    return (
        <div className='w-full bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm'>
            <div className='text-2xl mb-4'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-3 text-sm sm:text-base'>
                <div className='flex justify-between items-center'>
                    <p className='text-gray-600'>Subtotal</p>
                    <p className='font-medium text-gray-900'>{currency}{getCartAmount()}.00</p>
                </div>

                <hr className='border-gray-200' />

                <div className='flex justify-between items-center py-2'>
                    <p className='text-lg font-bold text-gray-800'>Total</p>
                    <p className='text-lg font-bold text-black'>{currency}{getCartAmount()}.00</p>
                </div>

                <div className='text-xs text-gray-500 italic mt-1'>
                    * Shipping & taxes calculated at checkout
                </div>
            </div>
        </div>
    )
}

export default CartTotal