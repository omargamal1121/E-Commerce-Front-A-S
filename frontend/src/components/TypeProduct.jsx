import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { useNavigate } from "react-router-dom";
import Title from "./Title";
import { useTranslation } from "react-i18next";
import { ShopContext } from "../context/ShopContext";
import WishlistButton from "./WishlistButton";
import discountService from "../services/discountService";

const TypeProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, currency, refreshToken } = useContext(ShopContext);

  const [topDiscountedProducts, setTopDiscountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products with biggest discounts using the discount API
  useEffect(() => {
    const fetchTopDiscountedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all products
        const productsResult = await discountService.getAllProducts(
          1,
          100,
          refreshToken
        );
        if (!productsResult.success) throw new Error(productsResult.error);

        const allProducts = productsResult.data;

        // Fetch discount details for each product
        const productsWithDiscounts = await Promise.all(
          allProducts.map(async (product) => {
            try {
              const discountResult = await discountService.getProductDetails(
                product.id,
                refreshToken
              );

              if (discountResult.success && discountResult.data) {
                const productData = discountResult.data;
                const discount = productData.discount;

                if (discount && discount.isActive) {
                  const originalPrice = productData.price || 0;
                  const finalPrice = productData.finalPrice || originalPrice;
                  const discountPercentage = discount.discountPercent || 0;

                  return {
                    ...productData,
                    discountPercentage,
                    discountPrecentage: discountPercentage,
                    discountName: discount.name,
                    discountDescription: discount.description,
                    startDate: discount.startDate,
                    endDate: discount.endDate,
                    originalPrice,
                    finalPrice,
                  };
                }
              }

              // Fallback discount calculation
              const originalPrice = product.price || 0;
              const finalPrice = product.finalPrice || originalPrice;
              const discountPercentage =
                originalPrice > 0 && finalPrice < originalPrice
                  ? Math.round(
                      ((originalPrice - finalPrice) / originalPrice) * 100
                    )
                  : 0;

              if (discountPercentage > 0) {
                return {
                  ...product,
                  discountPercentage,
                  discountPrecentage: discountPercentage,
                  originalPrice,
                  finalPrice,
                };
              }

              return null;
            } catch (error) {
              console.error(
                `Error fetching discount for product ${product.id}:`,
                error
              );
              return null;
            }
          })
        );

        // Keep only valid discounted products
        const validDiscountedProducts = productsWithDiscounts
          .filter(
            (product) => product !== null && product.discountPercentage > 0
          )
          .sort((a, b) => b.discountPercentage - a.discountPercentage)
          .slice(0, 2);

        setTopDiscountedProducts(validDiscountedProducts);
      } catch (error) {
        console.error("Error fetching discounted products:", error);
        setError(error.message);

        // Local fallback
        const fallbackProducts = products
          .filter((product) => {
            const originalPrice = product.price || 0;
            const finalPrice =
              typeof product.finalPrice === "number"
                ? product.finalPrice
                : originalPrice;
            return finalPrice < originalPrice && originalPrice > 0;
          })
          .map((product) => {
            const originalPrice = product.price || 0;
            const finalPrice =
              typeof product.finalPrice === "number"
                ? product.finalPrice
                : originalPrice;
            const discountPercentage = Math.round(
              ((originalPrice - finalPrice) / originalPrice) * 100
            );
            return {
              ...product,
              discountPercentage,
              discountPrecentage: discountPercentage,
              originalPrice,
              finalPrice,
            };
          })
          .sort((a, b) => b.discountPercentage - a.discountPercentage)
          .slice(0, 2);

        setTopDiscountedProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDiscountedProducts();
  }, [refreshToken]);

  // Helpers
  const getProductImage = (product, index) => {
    if (product && product.images && product.images.length > 0) {
      const mainImage = product.images.find((img) => img.isMain);
      return mainImage ? mainImage.url : product.images[0].url;
    }
    if (product && product.image && product.image.length > 0) {
      return product.image[0];
    }
    return index === 0 ? assets.baggey4 : assets.baggey3;
  };

  const getProductName = (product) =>
    product ? product.name : t("NEWEST_DROP");
  const getProductDescription = (product) =>
    product ? product.description || t("BALLON_FIT") : t("BALLON_FIT");

  const getProductId = (product, index) => {
    if (product?.id) return product.id;
    if (product?._id) return product._id;
    return index === 0 ? "15" : "14";
  };

  // States
  if (loading) {
    return (
      <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading biggest savings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading products: {error}</p>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!loading && topDiscountedProducts.length === 0) {
    return (
      <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
        <div className="text-center py-8">
          <p className="text-gray-600">
            No discounted products available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
      <div className="text-center py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl tracking-wide mb-3 sm:mb-4 uppercase">
          <Title text1={t("BIG")} text2={t("DISCOUNTS")} />
        </h1>
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          {t("DISCOVER_BIGGEST_SAVINGS")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
        {[0, 1].map((index) => {
          const product = topDiscountedProducts[index];
          return (
            <div key={index} className="col-span-1 relative group bg-[#111111]">
              <img
                src={getProductImage(product, index)}
                alt={getProductName(product)}
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {product && Number(product.discountPercentage) > 0 && (
                <div
                  className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
                  title={`${product.discountPercentage}% off`}
                >
                  -{Number(product.discountPercentage)}%
                </div>
              )}

              {product && product.discountName && (
                <div
                  className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold z-20"
                  title={product.discountName}
                >
                  {product.discountName}
                </div>
              )}

              <div
                className={`absolute z-10 ${product?.discountName ? "top-16 left-4" : "top-4 left-4"}`}
              >
                <WishlistButton
                  productId={getProductId(product, index)}
                  size="small"
                  variant="filled"
                />
              </div>

              <div className="absolute bottom-0 left-0 w-full h-full p-4 flex flex-col gap-2 items-start justify-end py-15 px-10">
                <h1 className="text-white text-4xl font-medium mb-2">
                  {getProductName(product)}
                </h1>
                <p className="text-white text-sm font-base mb-2">
                  {getProductDescription(product)}
                </p>
                {product && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-lg line-through opacity-75">
                      {currency}
                      {product.originalPrice || product.price}
                    </span>
                    <span className="text-red-400 text-xl font-bold">
                      {currency}
                      {product.finalPrice}
                    </span>
                  </div>
                )}
                <button
                  className="text-black border border-white cursor-pointer text-sm font-medium bg-white px-8 py-3 hover:bg-[#111111] hover:border-white hover:text-white transition-all duration-300"
                  onClick={() =>
                    navigate(`/product/${getProductId(product, index)}`)
                  }
                >
                  {t("SHOP_NOW")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TypeProduct;
