import React from 'react'
import { motion } from 'framer-motion'

const Title = ({ text1, text2 }) => {
  return (
    <div className='inline-flex gap-3 items-center mb-3 group'>
      <p className='text-gray-500 uppercase tracking-widest text-sm sm:text-lg lg:text-3xl font-light'>
        {text1} <span className='text-gray-900 font-black'>{text2}</span>
      </p>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "3rem" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='h-[2px] bg-black hidden sm:block'
      />
      <div className='w-8 h-[1px] bg-black sm:hidden' />
    </div>
  )
}

export default Title