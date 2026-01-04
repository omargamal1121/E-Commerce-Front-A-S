import React from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import MostWanted from "../components/MostWanted";
import OurPolicy from "../components/OurPolicy";
import NewLetterBox from '../components/NewLetterBox';
import { motion } from "framer-motion";
import HeroImage from "../components/HeroImage";
import { assets } from "../assets/frontend_assets/assets";
import ScrollSection from "../components/ScrollSection";
import TypeCollection from "../components/TypeCollection";
import ReelBaggey from "../components/ReelBaggey";
import TypeProduct from "../components/TypeProduct";
import CollectionSection from "../components/CollectionSection";
import { useTranslation } from 'react-i18next';
import HeroBanner from "../components/HeroBanner";

const Home = () => {
  const { t } = useTranslation();
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  return (
    <div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <HeroImage height={100} />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <LatestCollection />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <BestSeller />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <MostWanted />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <ScrollSection scroll1={assets.scroll1_max} scroll2={assets.scroll2_max} />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <CollectionSection />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <TypeCollection />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        {/* HeroBanner full width */}
        <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw]">
          <HeroBanner />
        </div>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <ReelBaggey />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <OurPolicy />
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={itemVariants}>
        <NewLetterBox />
      </motion.div>
    </div>
  );
};

export default Home;
