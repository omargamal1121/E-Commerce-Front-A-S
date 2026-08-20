import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Title from "./Title";
import { useTranslation } from "react-i18next";
import { ShopContext } from "../context/ShopContext";
import WishlistButton from "./WishlistButton";
import discountService from "../services/discountService";
import axios from "axios";
import { motion } from "framer-motion";

const TypeProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, currency, refreshToken, backendUrl } = useContext(ShopContext);

  const [topDiscountedProducts, setTopDiscountedProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  // --- Fetch top discounted products ---
  useEffect(() => {
    const fetchTopDiscountedProducts = async () => {
      try {
        setLoading(true);
        const searchResult = await discountService.advancedSearch(
          { onSale: true, sortBy: "discount", sortDescending: true },
          1,
          10,
          refreshToken
        );

        if (!searchResult.success) throw new Error(searchResult.error);

        const discountedProducts = searchResult.data.map((p) => ({
          ...p,
          discountPercentage: p.discountPrecentage || 0,
          originalPrice: p.price,
          finalPrice: p.finalPrice,
        }));

        const top2 = discountedProducts
          .sort((a, b) => b.discountPercentage - a.discountPercentage)
          .slice(0, 2);

        setTopDiscountedProducts(top2);
      } catch (error) {
        console.error("Error fetching discounted products:", error);

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

  // --- Fetch collections ---
  useEffect(() => {
    const fetchCollections = async () => {
      if (!backendUrl) return;
      try {
        setCollectionsLoading(true);
        const response = await axios.get(
          `${backendUrl}/api/Collection?page=1&pageSize=6&isActive=true&isDeleted=false`
        );
        const data =
          response.data?.responseBody?.data || response.data?.data || [];
        setCollections(data);
      } catch (err) {
        console.error("Error fetching collections:", err);
        setCollections([]);
      } finally {
        setCollectionsLoading(false);
      }
    };
    fetchCollections();
  }, [backendUrl]);

  // --- Helpers ---
  const getProductImage = (product) => {
    if (product?.images?.length > 0) {
      const mainImage = product.images.find((img) => img.isMain);
      return mainImage ? mainImage.url : product.images[0].url;
    }
    if (product?.image?.length > 0) return product.image[0];
    return null;
  };

  const getProductId = (product) => {
    return product?.id || product?._id || null;
  };

  const getCollectionImage = (collection) => {
    if (collection?.images?.length > 0) {
      const main = collection.images.find((img) => img.isMain);
      return main ? main.url : collection.images[0].url;
    }
    return null;
  };

  // --- States ---
  if (loading) {
    return (
      <div className="my-10 px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-500 text-sm tracking-widest uppercase">
            Loading biggest savings...
          </p>
        </div>
      </div>
    );
  }

  // If no discounted products exist, render nothing for the big discount section
  const hasDiscounts = topDiscountedProducts.length > 0;
  const hasCollections = collections.length > 0;

  if (!hasDiscounts && !hasCollections && !collectionsLoading) return null;

  return (
    <div className="my-10 overflow-hidden">
      {/* ===== BIG DISCOUNTS SECTION ===== */}
      {hasDiscounts && (
        <div className="px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw] mb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center py-8 mb-2"
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl tracking-wide mb-3 sm:mb-4 uppercase">
              <Title text1={t("BIG")} text2={t("DISCOUNTS")} />
            </h1>
            <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
              {t("DISCOVER_BIGGEST_SAVINGS")}
            </p>
          </motion.div>

          {/* Product grid — only shows real products, no static fallback */}
          <div
            className={`grid gap-y-6 gap-x-6 ${
              topDiscountedProducts.length === 1
                ? "grid-cols-1 max-w-3xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {topDiscountedProducts.map((product, index) => {
              const imgSrc = getProductImage(product);
              const productId = getProductId(product);

              return (
                <motion.div
                  key={productId || index}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="col-span-1 relative group bg-[#111111] overflow-hidden"
                >
                  {/* Product image */}
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-neutral-800 flex items-center justify-center">
                      <span className="text-neutral-500 text-sm tracking-widest uppercase">
                        No Image
                      </span>
                    </div>
                  )}

                  {/* Discount badge */}
                  {Number(product.discountPercentage) > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg z-20">
                      -{Number(product.discountPercentage)}%
                    </div>
                  )}

                  {/* Discount name badge */}
                  {product.discountName && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold z-20 shadow-md">
                      {product.discountName}
                    </div>
                  )}

                  {/* Wishlist button */}
                  {productId && (
                    <div
                      className={`absolute z-10 ${
                        product.discountName ? "top-16 left-4" : "top-4 left-4"
                      }`}
                    >
                      <WishlistButton
                        productId={productId}
                        size="small"
                        variant="filled"
                      />
                    </div>
                  )}

                  {/* Info overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 flex flex-col gap-2 items-start justify-end">
                    <h2 className="text-white text-3xl sm:text-4xl font-medium mb-1 leading-tight">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="text-white/70 text-sm mb-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-white/60 text-base line-through">
                        {currency}
                        {product.originalPrice || product.price}
                      </span>
                      <span className="text-red-400 text-xl font-bold">
                        {currency}
                        {product.finalPrice}
                      </span>
                    </div>
                    <button
                      className="text-black border border-white cursor-pointer text-sm font-semibold bg-white px-8 py-3 hover:bg-transparent hover:text-white transition-all duration-300 tracking-wider uppercase"
                      onClick={() =>
                        productId && navigate(`/product/${productId}`)
                      }
                    >
                      {t("SHOP_NOW")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== COLLECTIONS SECTION ===== */}
      {(collectionsLoading || hasCollections) && (
        <div className="px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center py-8 mb-2"
          >
            <Title text1={t("OUR")} text2={t("COLLECTIONS")} />
            <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 mt-3">
              {t("EXPLORE_OUR_COLLECTIONS") || "Explore our curated collections crafted for every style."}
            </p>
          </motion.div>

          {collectionsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 aspect-[4/3] rounded-sm"
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              {collections.map((collection, index) => {
                const imgSrc = getCollectionImage(collection);
                return (
                  <motion.div
                    key={collection.id || index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5 },
                      },
                    }}
                  >
                    <Link
                      to={`/collection-products/${collection.id}`}
                      className="block relative group overflow-hidden bg-neutral-100 aspect-[4/3]"
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={collection.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-neutral-400 text-xs uppercase tracking-widest">
                            {collection.name}
                          </span>
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-semibold text-sm sm:text-base tracking-wider uppercase">
                          {collection.name}
                        </h3>
                        {collection.description && (
                          <p className="text-white/70 text-xs mt-0.5 line-clamp-1 hidden sm:block">
                            {collection.description}
                          </p>
                        )}
                      </div>

                      {/* Hover "Shop" pill */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="bg-white text-black text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-xl">
                          Shop
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default TypeProduct;
