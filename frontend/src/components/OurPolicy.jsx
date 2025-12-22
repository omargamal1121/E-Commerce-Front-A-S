import React from "react";
import { assets } from "../assets/frontend_assets/assets";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const OurPolicy = () => {
  const { t } = useTranslation();
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={containerVariants}
      className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700 overflow-hidden">
      <motion.div variants={itemVariants}>
        <img src={assets.exchange_icon} className="w-12 m-auto mb-5" alt="" />
        <p className="font-semibold">{t('EASY_EXCHANGE_POLICY')}</p>
        <p className="text-gray-400">{t('EXCHANGE_POLICY_DESC')}</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <img src={assets.quality_icon} className="w-12 m-auto mb-5" alt="" />
        <p className="font-semibold">{t('RETURN_POLICY')}</p>
        <p className="text-gray-400">{t('RETURN_POLICY_DESC')}</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <img src={assets.support_img} className="w-12 m-auto mb-5" alt="" />
        <p className="font-semibold">{t('BEST_CUSTOMER_SUPPORT')}</p>
        <p className="text-gray-400">{t('CUSTOMER_SUPPORT_DESC')}</p>
      </motion.div>
    </motion.div>
  );
};

export default OurPolicy;
