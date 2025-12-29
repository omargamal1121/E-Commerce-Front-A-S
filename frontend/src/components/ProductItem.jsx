import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import WishlistButton from "./WishlistButton";
import { motion, AnimatePresence } from "framer-motion";

const ProductItem = ({
  id,
  _id,
  productId: propProductId,
  image,
  name,
  price,
  finalPrice,
  discountPrecentage,
  hidePrice = false,
}) => {
  const { currency } = useContext(ShopContext);
  const productId = id || _id || propProductId;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Standardize images array
  const imageArray = Array.isArray(image) ? image : [image].filter(Boolean);
  const hasMultipleImages = imageArray.length > 1;

  useEffect(() => {
    let interval;
    if (isHovered && hasMultipleImages) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
      }, 1500); // Cycle every 1.5 seconds
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, hasMultipleImages, imageArray.length]);

  const originalPrice = price || 0;
  const effectivePrice = typeof finalPrice === "number" ? finalPrice : originalPrice;

  const apiDiscountPercentage = discountPrecentage || 0;
  const calculatedDiscountPercentage =
    originalPrice > 0 && effectivePrice < originalPrice
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : 0;

  const discountPercentage = apiDiscountPercentage > 0 ? apiDiscountPercentage : calculatedDiscountPercentage;
  const hasDiscount = discountPercentage > 0;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="text-gray-700 cursor-pointer relative group"
    >
      <Link
        to={`/product/${productId}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="overflow-hidden relative aspect-[3/4] bg-gray-50 rounded-sm">
          {/* 🔖 Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-20 discount-badge">
              -{discountPercentage}%
            </div>
          )}

          {/* ❤️ Wishlist Button */}
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
            <WishlistButton
              productId={productId}
              size="small"
              variant="default"
            />
          </div>

          {/* 🖼️ Product Image with Cycling Animation */}
          <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0.8, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.8, scale: 1.05 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full object-cover"
                src={imageArray[currentImageIndex] || "https://via.placeholder.com/300x400?text=No+Image"}
                alt={name || "Product image"}
              />
            </AnimatePresence>

            {/* Progress dots for image cycling */}
            {hasMultipleImages && isHovered && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-10 px-2">
                {imageArray.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-black w-4' : 'bg-black/20'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Overly subtle zoom on hover (backup) */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </Link>

      {/* 🏷️ Product Info */}
      <div className="pt-4 px-1">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">New Arrival</p>
        <p className="text-sm font-semibold text-gray-900 group-hover:text-black transition-colors line-clamp-1">{name}</p>

        {/* 💰 Price Display (Conditional) */}
        {!hidePrice && (
          <div className="mt-2">
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">
                  {currency}{effectivePrice}
                </span>
                <span className="text-xs line-through text-gray-400">
                  {currency}{originalPrice}
                </span>
              </div>
            ) : (
              <p className="text-sm font-bold text-black">
                {currency}{originalPrice}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductItem;
