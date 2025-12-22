import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row border border-gray-400 overflow-hidden">
      {/* Hero Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
        <div className="text-[#414141]">
          <div className="flex items-center gap-2">
            <p className="w-8 md:w-11 h-[1px] bg-[#414141]"></p>
            <p className="font-medium text-sm md:text-base">{t('OUR_BESTSELLERS')}</p>
          </div>
          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">
            {t('LATEST_ARRIVALS')}
          </h1>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm md:text-base">{t('SHOP_NN')}</p>
            <p className="w-8 md:w-11 h-[1px] bg-[#414141]"></p>
          </div>
        </div>
      </motion.div>
      {/* Hero Right Side */}
      <motion.img
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        src={assets.hero_img} className="w-full sm:w-1/2" alt="HeroImg" />
    </div>
  );
};

export default Hero;
