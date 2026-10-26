import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ProductItem from '../components/ProductItem';
import ProductImage from '../components/common/ProductImage';
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
          const response = await axios.get(`${backendUrl}/api/Products/most-wishlisted?isActive=true&includeDeleted=false&page=1&pageSize=8`);
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
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <Title text1={'TRENDING'} text2={'WISHLIST'} />
            <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-[var(--text-muted)] mb-8">
              Check out the most loved items this week.
            </p>

            {loadingMostWishlisted ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-[var(--surface-raised)] border border-[var(--border)] aspect-[3/4] rounded-2xl"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
                {mostWishlisted.map((item, index) => {
                  const images = Array.isArray(item.images)
                    ? item.images.map(img => typeof img === 'string' ? img : (img.url || img.imageUrl || img.Url)).filter(Boolean)
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
                      quantity={item.quantity}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-16 pt-8 border-t border-[var(--border)]">
              <p className="text-[var(--text-muted)] mb-4">{t("LOGIN_WISHLIST_PROMPT") || "Want to save your own list?"}</p>
              <Link
                to="/login"
                className="inline-block border border-[var(--border)] text-[var(--text)] px-8 py-2.5 rounded-xl hover:bg-[var(--surface-raised)] transition-all font-medium"
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
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text)] mb-2">{t("WISHLIST")}</h1>
            <p className="text-[var(--text-muted)] text-lg">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : t("WISHLIST_ITEMS")}
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-red-500 border border-red-500/30 bg-red-500/10 rounded-full hover:bg-red-500/20 hover:border-red-500/50 transition-all active:scale-95 shadow-sm"
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
            <h3 className="text-xl font-medium text-[var(--text)] mb-2">{t("WISHLIST_EMPTY")}</h3>
            <p className="text-[var(--text-muted)] mb-6">{t("WISHLIST_EMPTY_DESC")}</p>
            <Link
              to="/"
              className="bg-[var(--accent)] text-black font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity inline-block"
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
                product?.images?.find(img => img?.isMain)?.url ||
                (typeof product?.images?.[0] === 'string' ? product?.images?.[0] : (product?.images?.[0]?.url || product?.images?.[0]?.imageUrl || product?.images?.[0]?.Url)) ||
                'https://via.placeholder.com/300x400?text=No+Image';

              const originalPrice = product?.price || 0;
              const finalPrice = product?.finalPrice || originalPrice;
              const hasDiscount = finalPrice < originalPrice;

              return (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden group flex flex-col justify-between"
                >
                  <div className="relative aspect-square overflow-hidden bg-[var(--surface-raised)]">
                    <Link to={`/product/${product?.id}`}>
                      <ProductImage
                        src={mainImage}
                        alt={product?.name || "Wishlist product"}
                        width={400}
                        aspectRatio="1/1"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      />
                    </Link>
                    <button
                      onClick={() => handleRemoveFromWishlist(product?.id)}
                      className="absolute top-2 right-2 bg-[var(--surface)]/90 backdrop-blur-sm border border-[var(--border)] rounded-full p-2 shadow-sm hover:scale-105 transition-transform"
                    >
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <Link to={`/product/${product?.id}`}>
                        <h3 className="font-medium text-[var(--text)] mb-1 line-clamp-1 hover:text-[var(--accent)] transition-colors">{product?.name}</h3>
                      </Link>
                      <div className="mb-4">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text)]">{currency}{finalPrice}</span>
                            <span className="text-sm text-[var(--text-muted)] line-through">{currency}{originalPrice}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-[var(--text)]">{currency}{originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product?.id)}
                      className="w-full bg-[var(--accent)] text-black font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
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
