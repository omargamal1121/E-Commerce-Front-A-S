import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const contactInfoVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } },
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="pt-32 sm:pt-36 pb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[var(--bg)] text-[var(--text)]">
      {/* Contact Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='text-2xl text-center pb-8 border-b border-[var(--border)]'>
        <Title text1={t('CONTACT')} text2={t('US')} />
      </motion.div>

      {/* Contact Content */}
      <div className='my-10 flex flex-col md:flex-row gap-10 mb-28 justify-center'>
        <motion.img
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={imageVariants}
          src={assets.contact_img}
          alt=""
          className='w-full md:max-w-[450px]'
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactInfoVariants}
          className='flex flex-col gap-6 items-start justify-center'>
          <motion.div
            variants={containerVariants}
            className='flex flex-col gap-6'>
            <motion.p variants={itemVariants} className='font-semibold text-xl text-gray-600'>{t('OUR_STORE')}</motion.p>
            <motion.p variants={itemVariants} className='text-gray-500' dangerouslySetInnerHTML={{ __html: t('STORE_CONTACT') }}></motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Contact
