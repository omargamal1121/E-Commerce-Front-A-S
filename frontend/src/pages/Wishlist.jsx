import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ProductItem from '../components/ProductItem';
import Title from '../components/Title';

const Wishlist = () => {
  const { t } = useTranslation();
  const {
    wishlistItems,
    wishlistLoading,
    removeFromWishlist,
    addToCart,
    clearWishlist,
    fetchWishlist,
    currency,
    user,
    backendUrl
  } = useContext(ShopContext);

  const [isRemoving, setIsRemoving] = useState({});
  const [mostWishlisted, setMostWishlisted] = useState([]);
  const [loadingMostWishlisted, setLoadingMostWishlisted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      const fetchMostWishlisted = async () => {
        try {
          setLoadingMostWishlisted(true);
          const response = await axios.get(`${backendUrl}/api/Products/most-wishlisted?page=1&pageSize=8`);
          if (response.data?.responseBody?.data) {
            setMostWishlisted(response.data.responseBody.data);
          } else if (response.data?.items) {
            setMostWishlisted(response.data.items);
          } else if (Array.isArray(response.data)) {
            setMostWishlisted(response.data);
          }
        } catch (error) {
          console.error("Error fetching most wishlisted:", error);
        } finally {
          setLoadingMostWishlisted(false);
        }
      };
      fetchMostWishlisted();
    }
  }, [user, backendUrl]);

  const handleRemoveFromWishlist = async (productId) => {
    setIsRemoving(prev => ({ ...prev, [productId]: true }));
    await removeFromWishlist(Number(productId));
    setIsRemoving(prev => ({ ...prev, [productId]: false }));
  };

  const handleAddToCart = async (productId, size = 'M', color = 'default') => {
    await addToCart(String(productId), size, color, 1);
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      await clearWishlist();
    }
  };

  // Guest View: Show Most Wishlisted
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <Title text1={'TRENDING'} text2={'WISHLIST'} />
            <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 mb-8">
              Check out the most loved items this week.
            </p>

            {loadingMostWishlisted ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 aspect-[3/4] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
                {mostWishlisted.map((item, index) => {
                  const images = Array.isArray(item.images)
                    ? item.images.map(img => img.url || img.imageUrl || img.Url).filter(Boolean)
                    : (item.mainImageUrl || item.image ? [item.mainImageUrl || item.image] : []);
                  const finalP = item.finalPrice !== undefined ? item.finalPrice : item.price;

                  return (
                    <ProductItem
                      key={item.id || item._id || index}
                      id={item.id || item._id}
                      image={images}
                      name={item.name}
                      price={item.price}
                      finalPrice={finalP}
                      discountPrecentage={item.discountPrecentage || item.discountPercentage}
                      discountName={item.discountName}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-gray-500 mb-4">{t("LOGIN_WISHLIST_PROMPT") || "Want to save your own list?"}</p>
              <Link
                to="/login"
                className="inline-block border border-black text-black px-8 py-2 rounded hover:bg-black hover:text-white transition-all"
              >
                {t("LOGIN") || "Login"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("WISHLIST")}</h1>
            <p className="text-gray-500 text-lg">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : t("WISHLIST_ITEMS")}
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-red-600 border-2 border-red-50 border-red-100 rounded-full hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t("CLEAR_WISHLIST") || "Clear Wishlist"}
            </button>
          )}
        </div>

        {wishlistItems.length === 0 && !wishlistLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <h3 className="text-xl font-medium text-gray-900 mb-2">{t("WISHLIST_EMPTY")}</h3>
            <p className="text-gray-600 mb-6">{t("WISHLIST_EMPTY_DESC")}</p>
            <Link
              to="/"
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors inline-block"
            >
              {t("CONTINUE_SHOPPING")}
            </Link>
          </motion.div>
        )}

        {wishlistItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item, index) => {
              const product = item.product || item;
              if (!product) return null;

              // Image handling for various API shapes
              let mainImage = product?.mainImageUrl ||
                product?.image ||
                product?.images?.find(img => img.isMain)?.url ||
                product?.images?.[0]?.url ||
                (Array.isArray(product.images) && product.images[0]) ||
                'https://via.placeholder.com/300x400?text=No+Image';

              const originalPrice = product?.price || 0;
              const finalPrice = product?.finalPrice || originalPrice;
              const hasDiscount = finalPrice < originalPrice;

              return (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Link to={`/product/${product?.id}`}>
                      <img
                        src={mainImage}
                        alt={product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=No+Image'; }}
                      />
                    </Link>
                    <button
                      onClick={() => handleRemoveFromWishlist(product?.id)}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-2 shadow-sm"
                    >
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <Link to={`/product/${product?.id}`}>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product?.name}</h3>
                    </Link>
                    <div className="mb-4">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{currency}{finalPrice}</span>
                          <span className="text-sm text-gray-400 line-through">{currency}{originalPrice}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">{currency}{originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product?.id)}
                      className="w-full bg-black text-white py-2 rounded text-sm hover:bg-gray-800"
                    >
                      {t("ADD_TO_CART")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
