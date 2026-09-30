import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import WishlistButton from "./WishlistButton";

const ProductCard = ({ product }) => {
  const { currency, addToCart } = useContext(ShopContext);

  // Handle missing product data gracefully
  if (!product) {
    return null;
  }

  // Get main image or placeholder
  const mainImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isMain)?.url || product.images[0].url
      : "https://via.placeholder.com/300x400";

  // Format price and discount
  const price = product.price || 0;
  const finalPrice = product.finalPrice || price;

  // Use API discount percentage if available, otherwise calculate from price difference
  const apiDiscountPercentage = product.discountPrecentage || 0;
  const calculatedDiscountPercentage =
    price > 0 && finalPrice < price
      ? Math.round(((price - finalPrice) / price) * 100)
      : 0;

  const discountPercentage =
    apiDiscountPercentage > 0
      ? apiDiscountPercentage
      : calculatedDiscountPercentage;
  const hasDiscount = discountPercentage > 0;

  return (
    <div className="card-luxury relative group cursor-pointer flex flex-col h-full">
      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-20 discount-badge">
          -{discountPercentage}%
        </div>
      )}

      {/* Wishlist button */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
        <WishlistButton
          productId={product.id}
          size="small"
          variant="default"
          isInWishlist={product.isInWishlist}
        />
      </div>

      {/* Product image with hover effect */}
      <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-t-xl bg-gray-50 flex-shrink-0">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </Link>

      {/* Product details */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-white">
        <Link to={`/product/${product.id}`} className="block">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-medium">New Arrival</p>
          <h3 className="mb-1 text-sm font-semibold text-gray-800 group-hover:text-black transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>
          <p className="text-[13px] text-gray-500 line-clamp-2 mt-1 mb-2 leading-relaxed">
            {product.description}
          </p>
        </Link>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-black">
                  {currency}
                  {finalPrice}
                </span>
                <span className="text-xs text-gray-400 font-medium line-through">
                  {currency}
                  {price}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-bold text-black">
                {currency}
                {price}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
