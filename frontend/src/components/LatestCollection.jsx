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
    // Filter active products and get the latest 8 by creation date or ID
    // Filter active products and get the latest 8 by creation date or ID
    if (Array.isArray(products) && products.length > 0) {
      const activeProducts = products.filter(product => product.isActive === true);
      
      // Sort by ID descending to get the most recently added products
      const sortedProducts = activeProducts.sort((a, b) => {
        // Try to sort by numeric ID (most recent first)
        const idA = parseInt(a._id) || 0;
        const idB = parseInt(b._id) || 0;
        return idB - idA;
      });
      
      // Take the first 8 (most recent)
      setLatestProducts(sortedProducts.slice(0, 8));
    }
  }, [products]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Show loading state while products are being fetched
  if (productsLoading) {
    return (
      <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
        <div className="text-left py-8 text-3xl">
          <Title text1={t('LATEST')} text2={t('COLLECTION')} />
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            Discover our Latest Collection, where fresh designs meet modern trends.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-1"></div>
              <div className="bg-gray-200 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Do not render the component if there are no products to show after loading
  if (!productsLoading && latestProducts.length === 0) {
    return null;
  }

  return (
    <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
      <motion.div
        initial="hidden"  
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={itemVariants}
        className="text-left py-8 text-3xl">
        <Title text1={t('LATEST')} text2={t('COLLECTION')} />
        <p className="text-xs sm:text-sm md:text-base text-gray-600">
          Discover our Latest Collection, where fresh designs meet modern trends.
        </p>
      </motion.div>
      {/* Rendering Products */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
        {latestProducts.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            <ProductItem
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
              finalPrice={item.finalPrice}
              discountPrecentage={item.discountPrecentage}
              discountName={item.discountName}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LatestCollection;
