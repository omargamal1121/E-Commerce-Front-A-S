import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import NewLetterBox from '../components/NewLetterBox'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next';

const About = () => {
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

  const textVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } },
  };

  const chooseUsContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const chooseUsItemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="mt-[80px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* About Us Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className='text-2xl text-center pt-8 border-t border-gray-200'>
        <Title text1={t('ABOUT')} text2={t('US')} />
      </motion.div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <motion.img
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={imageVariants}
          src={assets.about_img}
          alt=""
          className='w-full md:max-w-[450px]'
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={textVariants}
          className='flex flex-col gap-6 justify-center md:w-2/4 text-gray-600'>
          <p>{t('ABOUT_DESC_1')}</p>
          <p>{t('ABOUT_DESC_2')}</p>
          <b className='text-gray-800'>{t('OUR_MISSION')}</b>
          <p>{t('ABOUT_DESC_3')}</p>
        </motion.div>
      </div>

      {/* Why Choose Us Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className='text-2xl text-center pt-8 border-t border-gray-200'>
        <Title text1={t('WHY')} text2={t('CHOOSE_US')} />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={chooseUsContainerVariants}
        className='flex flex-col md:flex-row text-sm my-20'>
        <motion.div variants={chooseUsItemVariants} className='border border-gray-200 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>{t('QUALITY_ASSURANCE')}</b>
          <p className='text-gray-600'>{t('QUALITY_ASSURANCE_DESC')}</p>
        </motion.div>
        <motion.div variants={chooseUsItemVariants} className='border border-gray-200 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>{t('CONVENIENCE')}</b>
          <p className='text-gray-600'>{t('CONVENIENCE_DESC')}</p>
        </motion.div>
        <motion.div variants={chooseUsItemVariants} className='border border-gray-200 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>{t('EXCEPTIONAL_CUSTOMER_SERVICE')}</b>
          <p className='text-gray-600'>{t('EXCEPTIONAL_CUSTOMER_SERVICE_DESC')}</p>
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}>
        <NewLetterBox />
      </motion.div>
    </div>
  )
}

export default About