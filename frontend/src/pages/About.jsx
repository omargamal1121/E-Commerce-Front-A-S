import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "201555522161";

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
    <div className="pt-32 sm:pt-36 pb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[var(--bg)] text-[var(--text)]">
      {/* About Us Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='text-2xl text-center pb-8 border-b border-[var(--border)]'>
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
          className='w-full md:max-w-[450px] rounded-2xl shadow-sm'
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={textVariants}
          className='flex flex-col gap-6 justify-center md:w-2/4 text-[var(--text-muted)]'>
          <p>{t('ABOUT_DESC_1')}</p>
          <p>{t('ABOUT_DESC_2')}</p>
          <b className='text-[var(--text)] font-serif-title'>{t('OUR_MISSION')}</b>
          <p>{t('ABOUT_DESC_3')}</p>
        </motion.div>
      </div>

      {/* Why Choose Us Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className='text-2xl text-center pt-12 border-t border-[var(--border)]'>
        <Title text1={t('WHY')} text2={t('CHOOSE_US')} />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={chooseUsContainerVariants}
        className='flex flex-col md:flex-row text-sm my-16 gap-6'>
        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl px-8 py-10 sm:py-16 flex-1 flex flex-col gap-4 shadow-sm'>
          <b className="text-base text-[var(--text)]">{t('QUALITY_ASSURANCE')}</b>
          <p className='text-[var(--text-muted)] leading-relaxed'>{t('QUALITY_ASSURANCE_DESC')}</p>
        </motion.div>
        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl px-8 py-10 sm:py-16 flex-1 flex flex-col gap-4 shadow-sm'>
          <b className="text-base text-[var(--text)]">{t('CONVENIENCE')}</b>
          <p className='text-[var(--text-muted)] leading-relaxed'>{t('CONVENIENCE_DESC')}</p>
        </motion.div>
        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl px-8 py-10 sm:py-16 flex-1 flex flex-col gap-4 shadow-sm'>
          <b className="text-base text-[var(--text)]">{t('EXCEPTIONAL_CUSTOMER_SERVICE')}</b>
          <p className='text-[var(--text-muted)] leading-relaxed'>{t('EXCEPTIONAL_CUSTOMER_SERVICE_DESC')}</p>
        </motion.div>
      </motion.div>

      {/* B2B Services Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className='text-2xl text-center pt-16 border-t border-[var(--border)]'>
        <Title text1={t('B2B')} text2={t('SERVICES')} />
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-muted)] mt-3 font-light">
          {t('B2B_SUBTITLE')}
        </p>
      </motion.div>

      {/* B2B Features Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={chooseUsContainerVariants}
        className='grid grid-cols-1 md:grid-cols-3 gap-6 my-12'>
        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-8 flex flex-col gap-4 shadow-sm hover:border-[var(--accent)] transition-colors'>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-[var(--accent)] flex items-center justify-center text-2xl font-bold">
            🏢
          </div>
          <b className="text-base text-[var(--text)]">{t('B2B_FEATURE_1_TITLE')}</b>
          <p className='text-sm text-[var(--text-muted)] leading-relaxed'>{t('B2B_FEATURE_1_DESC')}</p>
        </motion.div>

        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-8 flex flex-col gap-4 shadow-sm hover:border-[var(--accent)] transition-colors'>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-2xl font-bold">
            🧵
          </div>
          <b className="text-base text-[var(--text)]">{t('B2B_FEATURE_2_TITLE')}</b>
          <p className='text-sm text-[var(--text-muted)] leading-relaxed'>{t('B2B_FEATURE_2_DESC')}</p>
        </motion.div>

        <motion.div variants={chooseUsItemVariants} className='border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-8 flex flex-col gap-4 shadow-sm hover:border-[var(--accent)] transition-colors'>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
            📦
          </div>
          <b className="text-base text-[var(--text)]">{t('B2B_FEATURE_3_TITLE')}</b>
          <p className='text-sm text-[var(--text-muted)] leading-relaxed'>{t('B2B_FEATURE_3_DESC')}</p>
        </motion.div>
      </motion.div>

      {/* B2B WhatsApp Call-to-Action Card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className='my-8 bg-[var(--surface)] border border-[var(--accent)]/40 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-md'>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] uppercase tracking-wider">
          B2B &amp; Corporate Inquiries
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] max-w-xl font-serif-title">
          {t('B2B_CTA_TITLE')}
        </h3>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
          {t('B2B_CTA_DESC')}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello R&S Team, I am interested in your B2B / wholesale services.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="h-5 w-5 fill-current"
            >
              <path d="M19.11 17.58c-.27-.14-1.59-.79-1.84-.88-.25-.09-.43-.14-.62.14-.18.27-.71.88-.88 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.46-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.36.98 2.67 1.12 2.86.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.56.58.66.21 1.25.18 1.72.11.52-.08 1.59-.65 1.81-1.27.23-.62.23-1.14.16-1.27-.07-.11-.25-.18-.52-.32z"/>
              <path d="M27.54 4.46A15.92 15.92 0 0016 .02C7.18.02.02 7.18.02 16c0 2.8.73 5.54 2.12 7.95L.02 32l8.22-2.09A15.9 15.9 0 0016 31.98c8.82 0 15.98-7.16 15.98-15.98 0-4.27-1.66-8.29-4.44-11.54zM16 29.32c-2.66 0-5.26-.71-7.53-2.06l-.54-.32-4.88 1.24 1.3-4.75-.35-.58A13.3 13.3 0 012.68 16C2.68 8.65 8.65 2.68 16 2.68S29.32 8.65 29.32 16 23.35 29.32 16 29.32z"/>
            </svg>
            <span>{t('B2B_WHATSAPP_BTN')} (01555522161)</span>
          </a>
          <a
            href="mailto:r.s.store.0012@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-xl text-sm font-semibold transition-all hover:bg-[var(--surface-raised)]"
          >
            ✉️ r.s.store.0012@gmail.com
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default About
