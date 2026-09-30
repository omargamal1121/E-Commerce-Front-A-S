import React from 'react'
import { motion } from 'framer-motion'

const Title = ({ text1, text2 }) => {
  return (
    <div className='inline-flex gap-3 items-center mb-3 group'>
      <p className='font-serif-title uppercase tracking-tight text-xl sm:text-2xl lg:text-4xl text-[var(--text-muted)] font-semibold'>
        {text1} <span className='text-[var(--text)] font-bold'>{text2}</span>
      </p>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "3.5rem" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='h-[2px] bg-[var(--accent)] hidden sm:block'
      />
      <div className='w-8 h-[2px] bg-[var(--accent)] sm:hidden' />
    </div>
  )
}

export default Title
