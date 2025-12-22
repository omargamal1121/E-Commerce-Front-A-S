import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import WishlistButton from "./WishlistButton";

const ProductItem = ({
  id,
  image,
  name,
  price,
  finalPrice,
  discountPrecentage,
}) => {
  const { currency } = useContext(ShopContext);
  const originalPrice = price || 0;
  const effectivePrice =
    typeof finalPrice === "number" ? finalPrice : originalPrice;

  // ✅ استخدم نسبة الخصم من الـ API إن وجدت، أو احسبها من السعر
  const apiDiscountPercentage = discountPrecentage || 0;
  const calculatedDiscountPercentage =
    originalPrice > 0 && effectivePrice < originalPrice
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : 0;

  const discountPercentage =
    apiDiscountPercentage > 0
      ? apiDiscountPercentage
      : calculatedDiscountPercentage;
  const hasDiscount = discountPercentage > 0;

  return (
    <div className="text-gray-700 cursor-pointer relative group">
      <Link
        to={`/product/${id}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="overflow-hidden relative">
          {/* 🔖 شارة الخصم */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{discountPercentage}%
            </div>
          )}

          {/* ❤️ زر المفضلة */}
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <WishlistButton 
              productId={id} 
              size="small" 
              variant="default" 
            />
          </div>

          {/* 🖼️ صورة المنتج */}
          <img
            className="hover:scale-110 transition ease-in-out"
            src={
              image && image.length > 0
                ? image[0]
                : "https://via.placeholder.com/300x400"
            }
            alt={name || "Product image"}
          />
        </div>
      </Link>

      {/* 🏷️ اسم المنتج */}
      <p className="pt-3 pb-1 text-sm">{name}</p>

      {/* 💰 السعر والخصم */}
      {hasDiscount ? (
        <div className="flex items-center gap-2">
          <span className="text-xs line-through text-gray-400">
            {currency}
            {originalPrice}
          </span>
          <span className="text-sm font-bold text-red-500">
            {currency}
            {effectivePrice}
          </span>
        </div>
      ) : (
        <p className="text-sm font-medium">
          {currency}
          {originalPrice}
        </p>
      )}
    </div>
  );
};

export default ProductItem;
