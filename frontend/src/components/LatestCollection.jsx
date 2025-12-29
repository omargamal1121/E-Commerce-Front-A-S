import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const LatestCollection = () => {
  const { t } = useTranslation();
  const { products, productsLoading } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const activeProducts = products.filter(product => product.isActive === true);
      const sortedProducts = activeProducts.sort((a, b) => {
        const idA = parseInt(a._id) || 0;
        const idB = parseInt(b._id) || 0;
        return idB - idA;
      });
      setLatestProducts(sortedProducts.slice(0, 8));
    }
  }, [products]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    },
  };

  if (productsLoading) {
    return (
      <div className="my-20 px-4 sm:px-[5vw]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-100 pb-8">
          <Title text1={t('LATEST')} text2={t('COLLECTION')} />
          <p className="max-w-md text-gray-500 text-sm md:text-base mt-4 md:mt-0 font-light">
            Stay ahead with our freshest drops. Curated items for the modern lifestyle.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-100 aspect-[3/4] rounded-sm mb-4"></div>
              <div className="bg-gray-100 h-6 w-3/4 rounded mb-2"></div>
              <div className="bg-gray-100 h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!productsLoading && latestProducts.length === 0) return null;

  return (
    <div className="my-24 px-4 sm:px-[5vw]">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-100 pb-10"
      >
        <div className="relative">
          <Title text1={t('LATEST')} text2={t('COLLECTION')} />
          <div className="absolute -top-6 -left-6 text-9xl font-black text-gray-50/50 -z-10 select-none">NEW</div>
        </div>
        <p className="max-w-md text-gray-500 text-sm md:text-base mt-4 md:mt-0 font-light italic">
          "Elegance is the only beauty that never fades." — Discover our neuesten designs.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-12"
      >
        {latestProducts.map((item, index) => (
          <motion.div key={index} variants={itemVariants} className="card-luxury relative group">
            <ProductItem
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
              finalPrice={item.finalPrice}
              discountPrecentage={item.discountPrecentage}
              discountName={item.discountName}
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-50 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity -z-10 bg-luxury"></div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LatestCollection;
